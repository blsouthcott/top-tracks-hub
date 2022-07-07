""" tekore documentation @ https://tekore.readthedocs.io/en/stable/index.html
    Spotify developer dashboard @ https://developer.spotify.com/dashboard/applications
    Flask SQLAlchemy documentation: https://flask-sqlalchemy.palletsprojects.com/en/2.x/

    1. authenticate user (-> determine which app to authenticate with, for now just Spotify)
    2. determine which playlist to add top tracks to
    3. scrap site(s) (for now, just Pitchfork) to get tracks to add
        a. by genre?
        b. all tracks on 'top tracks' page?
        c. get 8.0+ albums? -> in Spotify determine 2 most-streamed tracks and add those?
    4. search for tracks by name, artist, album, figure out ID of track
    4. add tracks to playlist by IDs
    5. let user know?

    TODO: 1. figure out user authentication
          2. store tracks in DB
          3. probably store playlist IDs for each user in DB?
"""

import os
import logging

from flask import Flask, request, redirect, session, render_template, flash, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import tekore as tk
from apscheduler.schedulers.background import BackgroundScheduler

from dotenv import load_dotenv
load_dotenv()

from .models import *


auths = {}
users = {}

in_link = '<a href="/login">login</a>'
out_link = '<a href="/logout">logout</a>'
login_msg = f'You can {in_link} or {out_link}'

logging.basicConfig(level=logging.DEBUG)


def get_spotify_obj():
    fi_conf = tk.config_from_file(os.path.join(app.config["CONFIG_DIR"], fi), return_refresh=True)
    token = tk.refresh_user_token(*fi_conf[:2], fi_conf[3], )
    spotify = tk.Spotify(token)
    return spotify



#sched = BackgroundScheduler(daemon=True)

# sched.add_job(send_scheduled_email_test, "interval", hours=12, id="00001", next_run_time=datetime.now()+timedelta(seconds=30))
# sched.add_job(track_foreign_priority, "cron", day_of_week="mon-fri", hour="11,19", id="00002", next_run_time=datetime.now()+timedelta(seconds=60))
#sched.start()


db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = "MyExtraUniqueSecretKey"

    app.config["CONFIG_DIR"] = os.path.join(app.root_path, "config_files")
    logging.debug(app.config["CONFIG_DIR"])

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:////{os.path.join(app.root_path, 'db.sqlite')}"

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = "login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_email):
        return User.query.get(user_email)

    return app


app = create_app()


@app.route("/", methods=["GET"])
def main():
    return render_template("index.html")
    #user = session.get("user", None)
    #token = users.get(user, None)

    #if user is None or token is None:
    #    session.pop("user", None)
    #    return f"User ID: None<br>{login_msg}"

    #page = f"User ID: {user}<br><br>{login_msg} \n"
    #if token.is_expiring:
    #    token = cred.refresh(token)
    #    users[user] = token

    ###### MAIN FUNCTIONALITY HERE ######
    # config_dir = app.config["CONFIG_DIR"]
    # for fi in os.listdir(config_dir):
    #     fi_conf = tk.config_from_file(os.path.join(config_dir, fi), return_refresh=True)
    #     token = tk.refresh_user_token(*fi_conf[:2], fi_conf[3], )
    #
    #     spotify = tk.Spotify(token)
    #     added_tracks = add_top_tracks_to_playlist(spotify, 6)
    #
    #     return "<br>".join(added_tracks)

        #current_tracks = []
        #playlist_id = get_top_tracks_playlist_id(spotify)
        #playlist_items = spotify.playlist_items(playlist_id)
        #for playlist_item in playlist_items.items:
        #    curr_track = f"{playlist_item.track.name} by "
        #    track_artists = playlist_item.track.artists
        #    for track_artist in track_artists:
        #        curr_track += f"{track_artist.name}, "
        #    current_tracks.append(curr_track)

        #return "<br>".join(current_tracks)


@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")

    if "user" in session:
        return redirect("/", 307)

    conf = tk.config_from_environment(return_refresh=True)
    cred = tk.RefreshingCredentials(*conf)
    scope = tk.scope.user_read_currently_playing
    auth = tk.UserAuth(cred, scope)
    auths[auth.state] = auth
    return redirect(auth.url, 307)


@app.route("/login", methods=["POST"])
def login_post():
    email = request.form.get("email")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    user = User.query.filter_by(email=email).first()
    if not user:
        flash("This user account is associated with this email address")
        return redirect(url_for("login"))
    elif not check_password_hash(user.password, password):
        flash("Incorrect password! Please try again.")
        return redirect(url_for("login"))

    login_user(user, remember=remember)
    return redirect(url_for("profile"))


@app.route("/callback", methods=["GET"])
def login_callback():
    code = request.args.get("code", None)
    state = request.args.get("state", None)
    auth = auths.pop(state, None)

    if auth is None:
        return "Invalid state!", 400

    token = auth.request_token(code, state)

    config_dir = os.path.join(app.root_path, "config_files")
    conf = (os.getenv("SPOTIFY_CLIENT_ID"), os.getenv("SPOTIFY_CLIENT_SECRET"), os.getenv("SPOTIFY_REDIRECT_URI"))
    tk.config_to_file(os.path.join(config_dir, "tekore.cfg"), conf + (token.refresh_token,))

    #session["user"] = state
    #users[state] = token

    return redirect("/", 307)


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/signup", methods=["POST"])
def signup_post():
    email = request.form.get("email")
    name = request.form.get("name")
    password = request.form.get("password")

    user = User.query.filter_by(email=email).first()
    if user:
        flash("This email address already exists in the database")
        return redirect(url_for("signup"))

    new_user = User(
        email=email,
        name=name,
        password=generate_password_hash(password, method='sha256')
    )

    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for("login"))


@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html", name=current_user.name)


@app.route("/logout", methods=["GET"])
@login_required
def logout():
    logout_user()
    return redirect(url_for("main"))

    uid = session.pop("user", None)
    if uid is not None:
        users.pop(uid, None)
    return redirect("/", 307)