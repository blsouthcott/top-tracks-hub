import logging
import os
from random import randint, choice
from datetime import datetime, timedelta
import tempfile
import pickle
from string import ascii_letters, digits
from urllib.parse import urlencode
from base64 import b64encode

import requests
from flask import request, jsonify
from flask_restful import Resource
from marshmallow import Schema, fields, validate, ValidationError
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash
from flask_mail import Message
import tekore as tk

from .app import mail
from .models import db, Song, User, Auth, AccountVerification
from .api_utils import row_to_dict
from .controller import (
    update_pitchfork_top_tracks_db, 
    get_songs_by_str_val, 
    get_songs_by_list_vals
)
from .spotify import (
    get_spotify_obj,
    create_spotify_playlist,
    add_track_to_playlist,
    get_user_spotify_playlists,
    search_spotify_tracks
)

logging.basicConfig(level=logging.DEBUG)


def clear_expired_verification_codes():
    account_verifications = AccountVerification.query.all()
    for account_verification in account_verifications:
        if account_verification.expires < datetime.now().timestamp():
            db.session.delete(account_verification)
    db.session.commit()


class SignupSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6, max=35))
    name = fields.Str(required=True)


class Signup(Resource):

    def post(self):
        schema = SignupSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        user = User.query.get(req["email"])
        if user:
            return "email address already exists in the database", 409
        
        if account_verification := AccountVerification.query.get(req["email"]):
            db.session.delete(account_verification)
            db.session.commit()
        
        verification_code = "".join([choice(ascii_letters + digits) for _ in range(32)])
        user = User(
            email=req["email"],
            name=req["name"],
            password=generate_password_hash(req["password"]),
        )
        pickled_user = pickle.dumps(user)
        
        account_verification = AccountVerification(
            verification_code=verification_code,
            expires=(datetime.now() + timedelta(hours=24.0)).timestamp(),
            user_obj=pickled_user
        )
        db.session.add(account_verification)
        db.session.commit()
        clear_expired_verification_codes()

        msg = Message("Verify Top Tracks Account", recipients=[req["email"]])
        base_url = os.getenv("BASE_URL", "http://127.0.0.1:5000")
        verification_url = f"{base_url}/api/verify-account?code={verification_code}"
        msg.html = f"<p>Please click the following link or copy and paste into your browser's address bar to verify your account.</p><p>If the verification code has expired, please complete the sign up process again to generate another code.</p><p>{verification_url}</p>"
        mail.send(msg)
        return "email sent successfully", 200


class VerifyAccountSchema(Schema):
    verification_code = fields.Str(required=True, validate=validate.Length(equal=32), data_key="code")


class VerifyAccount(Resource):

    def get(self):
        """
        verify the verification code is correct and then commit the new User to the db
        """
        schema = VerifyAccountSchema()
        try:
            args = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400

        account_verification = AccountVerification.query.get(args["verification_code"])
        if not account_verification:
            clear_expired_verification_codes()
            return "Invalid verification code", 400
        
        if account_verification.expires < datetime.now().timestamp():
            clear_expired_verification_codes()
            return "Verification code already expired", 400

        user = pickle.loads(account_verification.user_obj)
        db.session.add(user)
        db.session.delete(account_verification)
        db.session.commit()

        return f"Account verification successful! Please go to {os.getenv('BASE_URL', 'http://127.0.0.1:5000')} to sign in to your account.", 200


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class Login(Resource):

    def get(self):
        pass

    def post(self):
        schema = LoginSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        user = User.query.get(req["email"].lower())
        if not user:
            logging.info("user not found")
            return "user not found", 400
        elif not check_password_hash(user.password, req["password"]):
            logging.info("wrong password")
            return "incorrect password", 400

        expiration = (datetime.now() + timedelta(hours=3.0)).timestamp() * 1000
        access_token = create_access_token(identity=user.get_id(), expires_delta=timedelta(hours=3.0))
        return {
            "access_token": access_token,
            "expiration": expiration,
            "name": user.name
        }, 200


class AuthorizeAccount(Resource):

    @jwt_required()
    def post(self):
        logging.debug("handling request to authorize account endpoint")
        email = get_jwt_identity()
        user = User.query.get(email)
        if user.config_file:
            return "account already authorized", 400
        logging.debug("user is not currently authorized")
        config = tk.config_from_environment()
        params = {
            "client_id": config[0],
            "response_type": "code",
            "redirect_uri": config[2],
            "state": "".join([choice(ascii_letters + digits) for _ in range(43)]),
            "scope": str(tk.scope.user_read_currently_playing),
            "show_dialog": True
        }
        logging.debug(f"using params: {params}")
        redirect_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
        auth = Auth(state=params["state"], email=email)
        db.session.add(auth)
        db.session.commit()
        logging.debug(f"added {auth} to database and redirecting to: {redirect_url}")
        return {"redirect_url": redirect_url}, 307
    

class AuthCallback(Resource):

    def get(self):
        code = request.args["code"]
        state = request.args["state"]
        
        auth = Auth.query.get(state)
        if not auth:
            return "Invalid state", 400
        
        email = auth.email
        # token = auth_obj.request_token(code, state)
        config = tk.config_from_environment()
        headers = {
            "Authorization": f"Basic {b64encode(f'{config[0]}:{config[1]}'.encode()).decode()}"
        }
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": config[2]
        }
        resp = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
        
        if resp.status_code != 200:
            return "Unable to obtain authorization token", 400

        token = resp.json()
        with tempfile.NamedTemporaryFile() as temp_config_file:
            tk.config_to_file(
                temp_config_file.name,
                config + (token["refresh_token"],),
            )
            config_file_bytes = temp_config_file.read()
          
        user = User.query.get(email)
        user.config_file = config_file_bytes
        db.session.delete(auth)
        db.session.commit()

        playlists = get_user_spotify_playlists(user)
        if not playlists:
            create_spotify_playlist(user)

        return "Your account has been authorized and playlist created in your Spotify account. You can now close this window.", 200


class Unauthorize(Resource):

    @jwt_required()
    def post(self):
        email = get_jwt_identity()
        user = User.query.get(email)
        if not user.config_file:
            return "account authorization not found", 400
        user.config_file = None
        db.session.commit()
        return 200


class AccountIsAuthorized(Resource):

    @jwt_required()
    def get(self):
        email = get_jwt_identity()
        logging.debug(f"checking authorization status for {email}")
        user = User.query.get(email)
        if user.config_file:
            return {"authorized": True}, 200
        return {"authorized": False}, 200


class TracksSchema(Schema):
    song_id = fields.Str(data_key="song-id")
    site_name = fields.Str(data_key="site-name")
    song_name = fields.Str(data_key="song-name")
    artists = fields.Str()
    genres = fields.Str()


class Tracks(Resource):
    
    def get(self):
        schema = TracksSchema()
        try:
            args = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400
        
        logging.debug(f"received request to /tracks with params: {args}")
        query = None

        if (song_id := args.get("song_id")):
            song = Song.query.get(song_id)
            if not song:
                return jsonify([])
            return jsonify(row_to_dict(song))

        if (site_name := args.get("site_name")):
            query = get_songs_by_str_val("site_name", site_name)
            if not query:
                return jsonify([])

        if (song_name := args.get("song_name")):
            query = get_songs_by_str_val("name", song_name, query=query)
            if not query:
                return jsonify([])

        if (artists := args.get("artists")):
            query = get_songs_by_list_vals("artists", artists, query=query)
            if not query:
                return jsonify([])

        if (genres := args.get("genres")):
            query = get_songs_by_list_vals("genres", genres, query=query)
            if not query:
                return jsonify([])

        if not query:
            return [row_to_dict(song) for song in Song.query.all()], 200
        else:
            return [row_to_dict(song) for song in query.all()], 200


class SpotifyTrackIdSchema(Schema):
    song_id = fields.Str(required=True, data_key="song-id")
    spotify_track_id = fields.Str(required=True, data_key="spotify-track-id")


class SpotifyTrackId(Resource):

    @jwt_required()
    def patch(self):
        schema = SpotifyTrackIdSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400
        logging.info(f"request body for patch request: {req}")
        song = Song.query.get(req["song_id"])
        spotify_obj = get_spotify_obj()
        tracks = search_spotify_tracks(spotify_obj, song.name, song.artists[0].name)
        if req["spotify_track_id"] not in [track.id for track in tracks]:
            logging.info("spotify-track-id did not match track id in search results")
            return "invalid spotify track ID", 400
        song.spotify_track_id = req["spotify_track_id"]
        song.preview_url = [track for track in tracks if track.id == req["spotify_track_id"]][0].preview_url
        db.session.commit()
        return (
            f"The Spotify Track ID for {song.name} with Song ID: {song.id} has been updated.",
            204,
        )


class Playlists(Resource):

    @jwt_required()
    def get(self):
        email = get_jwt_identity()
        user = User.query.get(email)
        playlists = get_user_spotify_playlists(user)
        if not playlists:
            return "no playlists found", 400
        return jsonify(playlists)


class PlaylistTracksSchema(Schema):
    spotify_track_ids = fields.List(fields.Str, required=True, data_key="spotify-track-ids")
    spotify_playlist_id = fields.Str(required=True, data_key="spotify-playlist-id")


class PlaylistTracks(Resource):

    @jwt_required()
    def get(self):
        """ return all the track Ids in the playlist passed up in the request query """

    @jwt_required()
    def post(self):
        schema = PlaylistTracksSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400
        email = get_jwt_identity()
        user = User.query.get(email)
        spotify_obj = get_spotify_obj(user)
        results = []
        for track_id in req["spotify_track_ids"]:
            added = add_track_to_playlist(spotify_obj, req["spotify_playlist_id"], track_id)
            results.append({track_id: "success" if added else "error"})
        return results, 200


class SearchSpotifyTracksSchema(Schema):
    song_name = fields.Str(required=True, data_key="song-name")
    artists = fields.Str(required=True)


class SearchSpotifyTracks(Resource):

    @jwt_required()
    def get(self):
        schema = SearchSpotifyTracksSchema()
        try:
            req = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400
        logging.debug(f"song name: {req['song_name']}, artists: {req['artists']}")
        spotify_obj = get_spotify_obj()
        tracks = search_spotify_tracks(spotify_obj, req["song_name"], req["artists"].split(',')[0])
        return jsonify(tracks)


class PitchforkTracksSchema(Schema):
    max_page_num = fields.Int(validate=validate.Range(min=1, max=257))


class PitchforkTracks(Resource):

    @jwt_required()
    def post(self):
        schema = PitchforkTracksSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.message, 400
        if not (max_page_num := req.get("max_page_num")):
            max_page_num = 25
        num_new_tracks = update_pitchfork_top_tracks_db(max_page_num=max_page_num)
        return {"num_new_tracks": num_new_tracks}, 200


class PersonalizationSchema(Schema):
    personalization_type = fields.Str(required=True, validate=validate.OneOf(["tracks", "artists"]), data_key="personalization-type")
    time_period = fields.Str(required=True, validate=validate.OneOf(["short_term", "medium_term", "long_term"]), data_key="time-period")


class Personalization(Resource):

    @jwt_required()
    def get(self):
        schema = PersonalizationSchema()
        try:
            req = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400
        email = get_jwt_identity()
        user = User.query.get(email)
        spotify_obj = get_spotify_obj(user)
        limit = 50
        if req["personalization_type"] == "tracks":
            return jsonify(spotify_obj.current_user_top_tracks(req["time_period"], limit=limit).items)
        else:
            return jsonify(spotify_obj.current_user_top_artists(req["time_period"], limit=limit).items)
