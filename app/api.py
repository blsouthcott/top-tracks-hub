from flask import Blueprint, request, jsonify

from .models import *
from .api_utils import row_to_dict

api = Blueprint("api", __name__)


@api.errorhandler(404)
def handle_bad_request(err):
    return jsonify({"error": "The route is not defined"})


@api.route("/songs", methods=["GET"])
def get_songs():
    songs = Song.query.all()
    songs_info = []
    for song in songs:
        songs_info.append(row_to_dict(song))
    return jsonify(songs_info)
