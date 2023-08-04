import logging
import os
from random import randint
from datetime import datetime, timedelta
from dataclasses import dataclass

from flask import request, jsonify
from flask_restful import Resource
from marshmallow import Schema, fields, validate, ValidationError
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash
from flask_mail import Message
import tekore as tk

from .app import mail
from .models import db, Song, User
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

logging.basicConfig(level=logging.INFO)

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config_files")

auths = {}
account_verifications = {}


def clear_expired_verification_codes():
    for key, val in account_verifications.items():
        if val.expires < datetime.now().timestamp():
            account_verifications.pop(key)


@dataclass
class AccountVerification:
    verification_code: str
    expires: float
    user: User


class SignupSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6, max=35))
    name = fields.Str(required=True)


class Signup(Resource):

    def get(self):
        pass

    def post(self):
        schema = SignupSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        user = User.query.filter_by(email=req["email"]).first()
        if user:
            return "email address already exists in the database", 400
        
        verification_code = "".join([str(randint(0,9)) for _ in range(6)])
        account_verifications[req["email"]] = AccountVerification(
            verification_code=verification_code,
            expires=(datetime.now() + timedelta(minutes=30.0)).timestamp(),
            user=User(
                email=req["email"],
                name=req["name"],
                password=generate_password_hash(req["password"]),
            )
        )
        clear_expired_verification_codes()

        msg = Message("Verify Top Tracks Account", recipients=[req["email"]])
        msg.html = f"<p>Please use the following code to verify your account. This code is valid for 30 minutes.</p><p>{verification_code}</p>"
        mail.send(msg)
        return "email sent successfully", 200


class VerifyAccountSchema(Schema):
    email = fields.Email(required=True)
    verification_code = fields.Str(required=True, validate=validate.Length(equal=6))


class VerifyAccount(Resource):

    def post(self):
        """
        verify the verification code is correct and then commit the new User to the db
        """
        schema = VerifyAccountSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        if req["email"] not in account_verifications:
            clear_expired_verification_codes()
            return "Invalid email", 400
        
        account_verification = account_verifications[req["email"]]
        
        if account_verification.expires < datetime.now().timestamp():
            clear_expired_verification_codes()
            return "Verification code already expired", 400
        
        if account_verification.verification_code != req["verification_code"]:
            clear_expired_verification_codes()
            return "Invalid verification code", 400

        db.session.add(account_verification.user)
        db.session.commit()

        expiration = (datetime.now() + timedelta(hours=3.0)).timestamp() * 1000
        access_token = create_access_token(identity=req["email"], expires_delta=timedelta(hours=3.0))
        return {
            "access_token": access_token,
            "expiration": expiration
        }, 200


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

        user = User.query.filter_by(email=req["email"]).first()
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
        email = get_jwt_identity()
        for fi in os.listdir(CONFIG_DIR):
            if email in fi:
                return "account already authorized", 400
        conf = tk.config_from_environment(return_refresh=True)
        cred = tk.RefreshingCredentials(*conf)
        scope = tk.scope.user_read_currently_playing
        auth = tk.UserAuth(cred, scope)
        auths[auth.state] = (auth, email)
        return {"redirect_url": auth.url}, 307
    

class AuthCallback(Resource):

    def get(self):
        code = request.args["code"]
        state = request.args["state"]
        if state not in auths:
            return "Invalid state", 400
        
        auth_info = auths.pop(state)
        auth, email = auth_info
        token = auth.request_token(code, state)
        conf = (
            os.getenv("SPOTIFY_CLIENT_ID"),
            os.getenv("SPOTIFY_CLIENT_SECRET"),
            os.getenv("SPOTIFY_REDIRECT_URI"),
        )

        tk.config_to_file(
            os.path.join(CONFIG_DIR, f"{email}.cfg"),
            conf + (token.refresh_token,),
        )

        spotify_obj = get_spotify_obj(f"{email}.cfg")
        user = User.query.filter_by(email=email).first()
        playlists = get_user_spotify_playlists(email)
        if not playlists:
            create_spotify_playlist(spotify_obj, user)

        return "Your account has been authorized and playlist created in your Spotify account. You can now close this window.", 200


class Unauthorize(Resource):

    @jwt_required()
    def post(self):
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        for fi in os.listdir(CONFIG_DIR):
            if email in fi:
                os.remove(os.path.join(CONFIG_DIR, fi))
                user.playlist_id = None
                db.session.commit()
                return 200
        return "account authorization not found", 400


class AccountIsAuthorized(Resource):

    @jwt_required()
    def get(self):
        email = get_jwt_identity()
        logging.debug(f"checking authorization status for {email}")
        for fi in os.listdir(CONFIG_DIR):
            if email in fi:
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
        db.session.commit()
        return (
            f"The Spotify Track ID for {song.name} with Song ID: {song.id} has been updated.",
            204,
        )


class Playlists(Resource):

    @jwt_required()
    def get(self):
        email = get_jwt_identity()
        playlists = get_user_spotify_playlists(email)
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
        spotify_obj = get_spotify_obj(f"{email}.cfg")
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
        spotify_obj = get_spotify_obj(f"{email}.cfg")
        limit = 50
        if req["personalization_type"] == "tracks":
            return jsonify(spotify_obj.current_user_top_tracks(req["time_period"], limit=limit).items)
        else:
            return jsonify(spotify_obj.current_user_top_artists(req["time_period"], limit=limit).items)
