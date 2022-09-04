""" tekore documentation @ https://tekore.readthedocs.io/en/stable/index.html
    Spotify developer dashboard @ https://developer.spotify.com/dashboard/applications
    Flask SQLAlchemy documentation: https://flask-sqlalchemy.palletsprojects.com/en/2.x/

    TODO: 1. add scheduled check for new track recommendation function
          2. if new rec, push to authenticated users playlists
          3. add option on signup to add previous tracks or just get future tracks
"""

import os
import logging

from flask import Flask
from flask_login import LoginManager
from apscheduler.schedulers.background import BackgroundScheduler

from .models import db, User
from .api import api

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.DEBUG)


#sched = BackgroundScheduler(daemon=True)

# sched.add_job(send_scheduled_email_test, "interval", hours=12, id="00001", next_run_time=datetime.now()+timedelta(seconds=30))
# sched.add_job(track_foreign_priority, "cron", day_of_week="mon-fri", hour="11,19", id="00002", next_run_time=datetime.now()+timedelta(seconds=60))
#sched.start()


def create_app():

    app = Flask(__name__)

    app.config["SECRET_KEY"] = "MyExtraUniqueSecretKey"

    app.config["CONFIG_DIR"] = os.path.join(app.root_path, "config_files")
    logging.debug(app.config["CONFIG_DIR"])

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:////{os.path.join(app.root_path, 'db.sqlite')}"

    db.init_app(app)

    app.register_blueprint(api, url_prefix="/api")

    login_manager = LoginManager()
    login_manager.login_view = "login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_email):
        return User.query.get(user_email)

    return app


app = create_app()
