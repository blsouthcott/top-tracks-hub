import logging

from flask import Blueprint, request, jsonify
from webargs import fields, validate
from webargs.flaskparser import use_args

from .models import *
from .controller import get_songs_by_str_val, get_songs_by_list_vals
from .api_utils import row_to_dict

logging.basicConfig(level=logging.DEBUG)

api = Blueprint("api", __name__)


@api.errorhandler(404)
def handle_bad_request(err):
    return jsonify({"error": "The route is not defined"})


@api.errorhandler(400)
@api.errorhandler(422)
def handle_bad_request(err):
    headers = err.data.get("headers", None)
    messages = err.data.get("messages", ["Invalid request."])
    if headers:
        return jsonify({"errors": messages}), err.code, headers
    else:
        return jsonify({"errors": messages}), err.code


get_songs_query_params = {
    "song-id": fields.Int(),
    "site-name": fields.Str(validate=validate.Length(max=120)),
    "song-name": fields.Str(validate=validate.Length(max=240)),
    "artists": fields.DelimitedList(fields.Str()),
    "genres": fields.DelimitedList(fields.Str()),
}


@api.route("/songs", methods=["GET"])
@use_args(get_songs_query_params, location="query")
def get_songs(args):

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

    return jsonify(songs_info)


patch_track_id_params = {
    "song-id": fields.Int(required=True),
    "spotify-track-id": fields.Str(validate=lambda x: len(x) == 22, required=True),
}


@api.route("/track-id", methods=["PATCH"])
@use_args(patch_track_id_params)
def update_spotify_track_id(args):
    logging.info(f"args for patch request {args}")
    song = Song.query.get(args.get("song-id"))
    song.spotify_track_id = args.get("spotify-track-id")
    db.session.commit()
    return (
        f"The Spotify Track ID for {song.name} with Song ID: {song.id} has been updated.",
        204,
    )
