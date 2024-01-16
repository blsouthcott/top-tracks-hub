import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

from .models import db

mail = Mail()


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.abspath(os.path.join(__file__, "../../../ui/build")),
    )

    if allowed_origins := os.getenv("ALLOWED_ORIGINS"):
        CORS(app, origins=allowed_origins)

    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_COOKIE_SECURE"] = os.environ["JWT_COOKIE_SECURE"].lower() == "true"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = os.environ["JWT_COOKIE_CSRF_PROTECT"].lower() == "true"
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    JWTManager(app)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["POSTGRES_CONNECTION_STRING"]
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
