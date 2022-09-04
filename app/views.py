
import os
import logging

from flask import request, redirect, session, render_template, flash, url_for
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import tekore as tk

from .app import app
from .models import db, User, Song
from .spotify import get_spotify_obj


logging.basicConfig(level=logging.DEBUG)

auths = {}


@app.route("/", methods=["GET"])
def main():
    return render_template("index.html")


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
    reverse = False
    if sort_by:
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


@app.route("/song/<song_id>")
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