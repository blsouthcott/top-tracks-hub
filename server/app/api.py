import logging
import os
from datetime import datetime, timedelta

from flask import request, jsonify
from flask_restful import Resource

from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

import tekore as tk

from .app import api, mail
from .models import db, Song, User
from .controller import update_pitchfork_top_tracks_db, get_songs_by_str_val, get_songs_by_list_vals
from .api_utils import row_to_dict
from .spotify import get_spotify_obj, create_spotify_playlist, add_track_to_playlist, get_user_spotify_playlists

logging.basicConfig(level=logging.INFO)

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config_files")

auths = {}


class Signup(Resource):

    def post(self):
        body = request.get_json()
        email = body.get("email")
        name = body.get("name")
        password = body.get("password")

        user = User.query.filter_by(email=email).first()
        if user:
            return "email address already exists in the database", 400

        new_user = User(
            email=email,
            name=name,
            password=generate_password_hash(password, method="sha256"),
        )

        db.session.add(new_user)
        db.session.commit()

        expiration = (datetime.now() + timedelta(hours=3.0)).timestamp() * 1000
        access_token = create_access_token(identity=user.get_id(), expires_delta=timedelta(hours=3.0))
        return {
            "access_token": access_token,
            "expiration": expiration
        }, 200
    

class Login(Resource):

    def post(self):
        body = request.get_json()
        email = body.get("email")
        password = body.get("password")

        user = User.query.filter_by(email=email).first()
        if not user:
            logging.info("user not found")
            return "user not found", 400
        elif not check_password_hash(user.password, password):
            logging.info("wrong password")
            return "incorrect password", 400

        expiration = (datetime.now() + timedelta(hours=3.0)).timestamp() * 1000
        access_token = create_access_token(identity=user.get_id(), expires_delta=timedelta(hours=3.0))
        return {
            "access_token": access_token,
            "expiration": expiration
        }, 200


class Authorize(Resource):

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
        code = request.args.get("code")
        state = request.args.get("state")
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
        

class Tracks(Resource):
    
    def get(self):
        args = request.args
        logging.debug(args)
        query = None

        song_id = args.get("song-id")
        if song_id:
            song = Song.query.get(song_id)
            if not song:
                return jsonify([])
            return jsonify(row_to_dict(song))

        site_name = args.get("site-name")
        if site_name:
            query = get_songs_by_str_val("site_name", site_name)
            if not query:
                return jsonify([])

        song_name = args.get("song-name")
        if song_name:
            query = get_songs_by_str_val("name", song_name, query=query)
            if not query:
                return jsonify([])

        artists = args.get("artists")
        if artists:
            query = get_songs_by_list_vals("artists", artists, query=query)
            if not query:
                return jsonify([])

        genres = args.get("genres")
        if genres:
            query = get_songs_by_list_vals("genres", genres, query=query)
            if not query:
                return jsonify([])

        songs_info = []
        if not query:
            songs = Song.query.all()
            for song in songs:
                songs_info.append(row_to_dict(song))
        else:
            for song in query.all():
                songs_info.append(row_to_dict(song))

        return songs_info, 200


class SpotifyTrackId(Resource):

    @jwt_required()
    def patch(self):
        body = request.get_json()
        logging.info(f"body for patch request {body}")
        track = Song.query.get(body.get("song-id"))
        track.spotify_track_id = body.get("spotify-track-id")
        db.session.commit()
        return (
            f"The Spotify Track ID for {track.name} with Song ID: {track.id} has been updated.",
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


class PlaylistTracks(Resource):

    @jwt_required()
    def get(self):
        """ return all the track Ids in the playlist passed up in the request query """
        pass

    @jwt_required()
    def post(self):
        body = request.get_json()
        email = get_jwt_identity()
        spotify_obj = get_spotify_obj(f"{email}.cfg")
        track_ids = body.get("spotify-track-ids")
        playlist_id = body.get("spotify-playlist-id")
        results = []
        for track_id in track_ids:
            added = add_track_to_playlist(spotify_obj, playlist_id, track_id)
            results.append({track_id: "success" if added else "error"})
        return results, 200
    

class SearchSpotifyTracks(Resource):

    @jwt_required()
    def get(self):
        song_name = request.args.get("song-name")
        artists = request.args.get("artists")
        if not song_name or not artists:
            return "song-name and artists are required query params", 400
        logging.debug(f"song name: {song_name}, artists: {artists}")
        spotify_obj = get_spotify_obj()
        search_results = spotify_obj.search(f"{song_name} artist:{artists.split(',')[0]}")[0].items
        track_results = [spotify_obj.track(search_result.id) for search_result in search_results]
        return jsonify(track_results)
    

class PitchforkTracks(Resource):

    @jwt_required()
    def post(self):
        body = request.get_json()
        if not (max_page_num := body.get("max_page_num")):
            max_page_num = 25
        num_new_tracks = update_pitchfork_top_tracks_db(max_page_num=max_page_num)
        return {"num_new_tracks": num_new_tracks}, 200


api.add_resource(Signup, "/signup")
api.add_resource(Login, "/login")
api.add_resource(Authorize, "/authorize")
api.add_resource(Unauthorize, "/unauthorize")
api.add_resource(AccountIsAuthorized, "/account-is-authorized")
api.add_resource(AuthCallback, "/callback")
api.add_resource(Tracks, "/tracks")
api.add_resource(Playlists, "/playlists")
api.add_resource(PlaylistTracks, "/playlist-tracks")
api.add_resource(SearchSpotifyTracks, "/spotify-tracks")
api.add_resource(SpotifyTrackId, "/spotify-track-id")
api.add_resource(PitchforkTracks, "/pitchfork-tracks")
