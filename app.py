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
import logging

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

logging.basicConfig(level=logging.INFO)


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
        artists = sorted(artists)

        track_name_elems = track_elem.findChildren("h2", {"class": "track-collection-item__title"})
        track_name = track_name_elems[0].text

        genres = []
        genre_elems = track_elem.findChildren("li", {"class": "genre-list__item"})
        for genre_elem in genre_elems:
            genres.append(genre_elem.text)

        tracks.append(Track(artists, track_name, genres))

    return tracks


def get_track_id(spotify: tk.Spotify, track: Track) -> str:

    search = spotify.search(track.track_name)

    for search_result in search[0].items:
        track_info = spotify.track(search_result.id)
        if track_info.name.lower() == track.track_name.lower(): # the track names match
            track_artists = []
            for artist in track_info.artists:
                track_artists.append(artist.name)
            track_artists = sorted(track_artists)
            if len(track_artists) == len(track.artists): # the number of artists is the same
                artists_match = True
                cnt = 0
                while artists_match:
                    if track_artists[cnt].lower() != track.artists.lower():
                        artists_match = False
                    cnt += 1
                if artists_match:
                    # TODO: decide how to validate the track beyond the track names matching
                    return search_result.id

    # we couldn't find a match
    return None


def get_top_tracks_playlist_id(spotify: tk.Spotify) -> str:
    curr_user_id = spotify.current_user().id
    playlists = spotify.playlists(curr_user_id)
    for playlist in playlists:
        # TODO: make this a constant or decide otherwise how we'll determine which playlist to add to, maybe store
        #   in DB for each user?
        if playlist.name == "Pitchfork Top Tracks":
            return playlist.id

    # we didn't find the playlist, make a new playlist
    new_playlist = spotify.playlist_create(curr_user_id,
                                           "Pitchfork Top Tracks",
                                           public=False,
                                           description="Playlist containing Pitchfork recommended tracks")
    return new_playlist.id


def add_top_tracks_to_playlist(spotify: tk.Spotify):
    html = get_pitchfork_top_tracks_html(1)
    tracks = parse_top_tracks_html(html)
    playlist_id = get_top_tracks_playlist_id(spotify)
    for track in tracks:
        track_id = get_track_id(spotify, track)
        if not track_id:
            logging.warning("Could not get Track ID for {track.track_name} by {track.artists}")
            continue
        spotify.playlist_add(playlist_id, spotify.track(track_id).uri)


if __name__ == "__main__":
    application = app_factory()
    application.run("127.0.0.1", 5000)
