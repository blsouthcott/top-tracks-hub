""" tekore documentation @ https://tekore.readthedocs.io/en/stable/index.html
    Spotify developer dashboard @ https://developer.spotify.com/dashboard/applications
    Flask SQLAlchemy documentation: https://flask-sqlalchemy.palletsprojects.com/en/2.x/
"""

import os
import logging

from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from flask_restful import Api
from flask_jwt_extended import JWTManager

from .models import db, User
from .api import (
    Signup, 
    Login, 
    Authorize,
    Unauthorize,
    AccountIsAuthorized,
    AuthCallback, 
    Tracks,
    PlaylistTracks,
    SpotifyTrackId,
    SearchSpotifyTracks
)

logging.basicConfig(level=logging.DEBUG)


def create_app():

    app = Flask(__name__)
    CORS(app, origins="http://localhost:3000")
    JWTManager(app)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    app.config["CONFIG_DIR"] = os.path.join(app.root_path, "config_files")
    logging.debug(app.config["CONFIG_DIR"])

    app.config[
        "SQLALCHEMY_DATABASE_URI"
    ] = f"sqlite:////{os.path.join(app.root_path, 'db.sqlite')}"

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = "login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_email):
        return User.query.get(user_email)

    return app


app = create_app()
api = Api(app)
api.add_resource(Signup, "/signup")
api.add_resource(Login, "/login")
api.add_resource(Authorize, "/authorize")
api.add_resource(Unauthorize, "/unauthorize")
api.add_resource(AccountIsAuthorized, "/account-is-authorized")
api.add_resource(AuthCallback, "/callback")
api.add_resource(Tracks, "/tracks")
api.add_resource(PlaylistTracks, "/playlist-tracks")
api.add_resource(SearchSpotifyTracks, "/spotify-tracks")
api.add_resource(SpotifyTrackId, "/spotify-track-id")
