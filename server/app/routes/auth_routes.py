from random import choice
import tempfile
from string import ascii_letters, digits
from urllib.parse import urlencode
from base64 import b64encode

import requests
from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
import tekore as tk

from ..models import db, User, Auth
from ..integrations.spotify import (
    get_spotify_obj,
    create_spotify_playlist,
    get_user_spotify_playlists,
)
from ..utils.logging_utils import logger


class AuthorizeAccount(Resource):
    @jwt_required()
    def post(self):
        logger.debug("handling request to authorize account endpoint")
        email = get_jwt_identity()
        user = User.query.get(email)
        if user.config_file:
            return "account already authorized", 400
        logger.debug("user is not currently authorized")
        config = tk.config_from_environment()
        params = {
            "client_id": config[0],
            "response_type": "code",
            "redirect_uri": config[2],
            "state": "".join([choice(ascii_letters + digits) for _ in range(43)]),
            "scope": "playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-top-read user-read-recently-played user-library-read",
            "show_dialog": True,
        }
        logger.debug(f"using params: {params}")
        redirect_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
        auth = Auth(state=params["state"], email=email)
        db.session.add(auth)
        db.session.commit()
        logger.debug(f"added {auth} to database and redirecting to: {redirect_url}")
        return {"redirect_url": redirect_url}, 307


class AuthCallback(Resource):
    def get(self):
        code = request.args["code"]
        state = request.args["state"]

        auth = Auth.query.get(state)
        if not auth:
            return "Invalid state", 400

        email = auth.email
        config = tk.config_from_environment()
        headers = {"Authorization": f"Basic {b64encode(f'{config[0]}:{config[1]}'.encode()).decode()}"}
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": config[2],
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

        spotify_obj = get_spotify_obj(user)
        playlists = get_user_spotify_playlists(spotify_obj)
        if not playlists:
            create_spotify_playlist(user, spotify_obj)

        return (
            "Your account has been authorized and playlist created in your Spotify account. You can now close this window.",
            200,
        )


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
        logger.debug(f"checking authorization status for {email}")
        user = User.query.get(email)
        if user.config_file:
            return jsonify(authorized=True)
        return jsonify(authorized=False)
