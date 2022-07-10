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
    fi_conf = tk.config_from_file(os.path.join(app.config["CONFIG_DIR"], "tekore.cfg"), return_refresh=True)
    token = tk.refresh_user_token(*fi_conf[:2], fi_conf[3], )
    spotify = tk.Spotify(token)
    return spotify



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


@app.route("/authorize")
@login_required
def authorize():
    email = current_user.email
    for fi in os.listdir(app.config["CONFIG_DIR"]):
        if email in fi:
            flash("Your account is already authorized with Spotify.")
            return redirect(url_for("profile"))
    conf = tk.config_from_environment(return_refresh=True)
    cred = tk.RefreshingCredentials(*conf)
    scope = tk.scope.user_read_currently_playing
    auth = tk.UserAuth(cred, scope)
    auths[auth.state] = auth
    return redirect(auth.url, 307)


@app.route("/callback", methods=["GET"])
@login_required
def login_callback():
    code = request.args.get("code", None)
    state = request.args.get("state", None)
    auth = auths.pop(state, None)

    if auth is None:
        return "Invalid state!", 400

    token = auth.request_token(code, state)

    config_dir = os.path.join(app.root_path, "config_files")
    conf = (os.getenv("SPOTIFY_CLIENT_ID"), os.getenv("SPOTIFY_CLIENT_SECRET"), os.getenv("SPOTIFY_REDIRECT_URI"))
    # TODO: can we get the spotify account ID or something like that so we're not duplicating any authorizations
    #   and adding tracks multiple times to people's playlists?
    tk.config_to_file(os.path.join(config_dir, f"{current_user.email}.cfg"), conf + (token.refresh_token,))

    flash("Your Spotify account has been successfully authorized!")
    return redirect(url_for("profile"), 307)


@app.route("/un-authorize")
@login_required
def un_authorize():
    config_dir = os.path.join(app.root_path, "config_files")
    user_removed = False
    for fi in os.listdir(config_dir):
        if current_user.email in fi:
            os.remove(os.path.join(config_dir, fi))
            user_removed = True
            break

    if user_removed:
        flash(
            "Your Spotify account has been removed. You will no longer receive new tracks in your playlist."
        )
    else:
        flash(
            "Your Spotify account is not currently authorized. You are not currently "
            "receiving new tracks in your playlist"
        )

    return redirect(url_for("profile"))


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


@app.route("/songs", methods=["GET"])
@login_required
def display_songs():
    songs = Song.query.all()
    sort_by = request.args.get("sort-by")
    sorted_by = request.args.get("sorted_by")
    reverse = True if sorted_by == sort_by else False
    if sort_by == "song-id":
        songs.sort(key=lambda song: song.id, reverse=reverse)
    elif sort_by == "song-name":
        songs.sort(key=lambda song: song.name, reverse=reverse)
    elif sort_by == "song-artist":
        songs.sort(key=lambda song: str(song.artists[0]), reverse=reverse)
    elif sort_by == "song-genre":
        songs.sort(key=lambda song: str(song.genres[0]) if song.genres else "", reverse=reverse)
    elif sort_by == "site-name":
        songs.sort(songs, key=lambda song: str(song.site_name), reverse=reverse)
    elif sort_by == "spotify-track-id":
        songs.sort(key=lambda song: str(song.spotify_track_id), reverse=reverse)

    if reverse:
        sort_by += "_reversed"

    return render_template("display-songs.html", songs=songs, sort_by=sort_by)


@app.route("/view-song/<song_id>")
@login_required
def view_song(song_id):
    return render_template("song-info.html", song=Song.query.get(song_id))


@app.route("/update-track-id", methods=["POST"])
@login_required
def update_track_id():
    track_id = request.form.get("spotify-track-id")
    song_id = request.form.get("song-id")
    song_name = request.form.get("song-name")
    logging.info(f"Track ID: {track_id}")
    logging.info(f"Song ID: {song_id}")
    song = Song.query.get(song_id)
    song.spotify_track_id = track_id
    db.session.commit()
    flash(f"The Spotify Track ID for {song_name} with Song ID: {song_id} has been updated.")
    sort_by = request.args.get("sort-by")
    return redirect(f"/songs?sort-by=song-id#{song.id}")


@app.route("/search/<song_id>")
@login_required
def search_track(song_id):
    spotify = get_spotify_obj()
    song = Song.query.get(song_id)
    search = spotify.search(f"{song.name} artist:{song.artists[0].name}")
    search_results_tracks = []
    search_results = search[0].items
    for search_result in search_results:
        spotify_track_info = spotify.track(search_result.id)
        spotify_track_info.artists = str([artist.name for artist in spotify_track_info.artists])
        search_results_tracks.append(spotify_track_info)
    return render_template("search-results.html", search_results=search_results_tracks, song=song)
