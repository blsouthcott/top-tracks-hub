import os
import logging

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager
from flask_mail import Mail

from .models import db, User


logging.basicConfig(level=logging.INFO)

mail = Mail()

def create_app():

    app = Flask(__name__, static_folder=os.path.abspath(os.path.join(__file__, "../../../ui/build")))
    CORS(app, origins="*", methods=["GET", "POST", "PATCH"])
    JWTManager(app)

    # secrets config
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    # spotify auth files config
    app.config["CONFIG_DIR"] = os.path.join(app.root_path, "config_files")
    logging.debug(app.config["CONFIG_DIR"])

    # db config
    app.config[
        "SQLALCHEMY_DATABASE_URI"
    ] = f"sqlite:////{os.path.join(app.root_path, 'db.sqlite')}"

    db.init_app(app)
    
    # email sending config
    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 465
    app.config["MAIL_USE_TLS"] = False
    app.config["MAIL_USE_SSL"] = True
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

    mail.init_app(app)

    return app
