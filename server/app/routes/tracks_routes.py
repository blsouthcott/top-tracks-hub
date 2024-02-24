from flask import request, jsonify
from flask_restful import Resource
from marshmallow import ValidationError
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from .schemas import (
    TracksSchema, 
    SpotifyTrackIdSchema, 
    PlaylistTracksSchema, 
    SearchSpotifyTracksSchema, 
    PitchforkTracksSchema, 
    PersonalizationSchema
)
from ..models import db, Song, User
from ..utils.api_utils import row_to_dict
from ..controller import update_pitchfork_top_tracks_db
from ..integrations.spotify import (
    get_spotify_obj,
    add_tracks_to_playlist,
    get_user_spotify_playlists,
    search_spotify_tracks,
)
from ..utils.logging_utils import logger


class Tracks(Resource):
    def get(self):
        schema = TracksSchema()
        try:
            args = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400

        logger.info(f"received request to /tracks with params: {args}")
        query = Song.query

        if song_id := args.get("song_id"):
            song = Song.query.get(song_id)
            return jsonify(row_to_dict(song)) if song else jsonify([])

        if site_name := args.get("site_name"):
            query = query.filter(Song.site_name == site_name)

        if song_name := args.get("song_name"):
            query = query.filter(Song.name.icontains(song_name))

        if artists := args.get("artists"):
            for artist in artists:
                query = query.filter(Song.artists.any(name=artist))

        if genres := args.get("genres"):
            for genre in genres:
                query = query.filter(Song.genres.any(name=genre))

        if limit := args.get("limit"):
            query = query.limit(limit)
        if offset := args.get("offset"):
            query = query.offset(offset)
        return [row_to_dict(song) for song in query.all()], 200


class SpotifyTrackId(Resource):
    @jwt_required()
    def patch(self):
        schema = SpotifyTrackIdSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400
        logger.info(f"request body for patch request: {req}")
        song = Song.query.get(req["song_id"])
        spotify_obj = get_spotify_obj()
        if not spotify_obj:
            return "Unable to authenticate to Spotify API", 500
        tracks = search_spotify_tracks(spotify_obj, song.name, song.artists[0].name)
        if req["spotify_track_id"] not in [track.id for track in tracks]:
            logger.info("spotify-track-id did not match track id in search results")
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
        spotify_obj = get_spotify_obj(user)
        playlists = get_user_spotify_playlists(spotify_obj)
        return jsonify(playlists) if playlists else ("no playlists found", 400,)


class PlaylistTracks(Resource):
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
        results = add_tracks_to_playlist(spotify_obj, req["spotify_playlist_id"], set(req["spotify_track_ids"]))
        return jsonify(results)


class SearchSpotifyTracks(Resource):
    @jwt_required()
    def get(self):
        schema = SearchSpotifyTracksSchema()
        try:
            req = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400
        logger.debug(f"song name: {req['song_name']}, artists: {req['artists']}")
        spotify_obj = get_spotify_obj()
        if not spotify_obj:
            return "Unable to execute search through Spotify API", 500
        tracks = search_spotify_tracks(spotify_obj, req["song_name"], req["artists"].split(",")[0])
        return jsonify(tracks)


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
        # limit = 50
        if req["personalization_type"] == "tracks":
            # return jsonify(spotify_obj.current_user_top_tracks(req["time_period"], limit=limit).items)
            return jsonify(spotify_obj.current_user_top_tracks(req["time_period"]).items)
        else:
            # return jsonify(spotify_obj.current_user_top_artists(req["time_period"], limit=limit).items)
            return jsonify(spotify_obj.current_user_top_artists(req["time_period"]).items)
