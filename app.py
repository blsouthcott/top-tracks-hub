""" tekore documentation @ https://tekore.readthedocs.io/en/stable/index.html
    Spotify developer dashboard @ https://developer.spotify.com/dashboard/applications

    1. authenticate user (-> determine which app to authenticate with, for now just Spotify)
    2. determine which playlist to add top tracks to
    3. scrap site(s) (for now, just Pitchfork) to get tracks to add
        a. by genre?
        b. all tracks on 'top tracks' page?
        c. get 8.0+ albums? -> in Spotify determine 2 most-streamed tracks and add those?
    4. search for tracks by name, artist, album, figure out ID of track
    4. add tracks to playlist by IDs
    5. let user know?
"""

import os
from dataclasses import dataclass

from flask import Flask, request, redirect, session
import tekore as tk
from bs4 import BeautifulSoup as bs
import requests
from dotenv import load_dotenv

load_dotenv()

TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"

conf = tk.config_from_environment()
cred = tk.Credentials(*conf)
spotify = tk.Spotify()

auths = {}
users = {}

in_link = '<a href="/login">login</a>'
out_link = '<a href="/logout">logout</a>'
login_msg = f'You can {in_link} or {out_link}'


def app_factory():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "aliens"

    @app.route("/", methods=["GET"])
    def main():
        user = session.get("user", None)
        token = users.get(user, None)

        if user is None or token is None:
            session.pop("user", None)
            return f"User ID: None<br>{login_msg}"

        page = f"User ID: {user}<br><br>{login_msg} \n"
        if token.is_expiring:
            token = cred.refresh(token)
            users[user] = token

        try:
            with spotify.token_as(token):
                playback = spotify.playback_currently_playing()
                item = playback.item.name if playback else None

                playlists = spotify.playlists(spotify.current_user().id)

            page += f'<br>Now playing: {item} \n'
            for playlist in playlists.items:
                page += f"{playlist.id} \n"

        except tk.HTTPError:
            return "Error retrieving Spotify information!"

        return page

    @app.route("/login", methods=["GET"])
    def login():
        if "user" in session:
            return redirect("/", 307)

        scope = tk.scope.user_read_currently_playing
        auth = tk.UserAuth(cred, scope)
        auths[auth.state] = auth
        return redirect(auth.url, 307)

    @app.route("/callback", methods=["GET"])
    def login_callback():
        code = request.args.get("code", None)
        state = request.args.get("state", None)
        auth = auths.pop(state, None)

        if auth is None:
            return "Invalid state!", 400

        token = auth.request_token(code, state)
        session["user"] = state
        users[state] = token
        return redirect("/", 307)

    @app.route("/logout", methods=["GET"])
    def logout():
        uid = session.pop("user", None)
        if uid is not None:
            users.pop(uid, None)
        return redirect("/", 307)

    return app


@dataclass
class Track:
    artists: list
    track_name: str
    genres: list


def get_pitchfork_top_tracks_html(page=1):
    resp = requests.get(f"{TOP_TRACKS_URL}?page={page}")
    if resp.status_code == 200:
        return resp.content
    return None


def parse_top_tracks_html(html):

    tracks = []

    soup = bs(html, "html.parser")
    track_elems = soup.find_all("div", {"class": "track-collection-item"})

    for track_elem in track_elems:

        artists = []
        artist_list_elems = track_elem.findChildren("ul", {"class": "artist-list"})
        artist_elems = artist_list_elems[0].findChildren("li")
        for elem in artist_elems:
            artists.append(elem.text)

        track_name_elems = track_elem.findChildren("h2", {"class": "track-collection-item__title"})
        track_name = track_name_elems[0].text

        genres = []
        genre_elems = track_elem.findChildren("li", {"class": "genre-list__item"})
        for genre_elem in genre_elems:
            genres.append(genre_elem.text)

        tracks.append(Track(artists, track_name, genres))

    return tracks


if __name__ == "__main__":
    application = app_factory()
    application.run("127.0.0.1", 5000)
