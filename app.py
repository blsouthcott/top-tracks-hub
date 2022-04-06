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
import re
from dataclasses import dataclass
import logging

from flask import Flask, request, redirect, session
from flask_sqlalchemy import SQLAlchemy
import tekore as tk
from bs4 import BeautifulSoup as bs
import requests

from dotenv import load_dotenv

load_dotenv()

TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"

#conf = tk.config_from_environment(return_refresh=True)
#cred = tk.RefreshingCredentials(*conf)
#spotify = tk.Spotify()

auths = {}
users = {}

in_link = '<a href="/login">login</a>'
out_link = '<a href="/logout">logout</a>'
login_msg = f'You can {in_link} or {out_link}'

logging.basicConfig(level=logging.DEBUG)


app = Flask(__name__)

#app.config["SECRET_KEY"] = ""

CONFIG_DIR = os.path.join(app.root_path, "config_files")
logging.debug(CONFIG_DIR)

NAMESPACE = os.getenv("NAMESPACE")
if NAMESPACE == "local":
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:////{os.path.join(app.root_path, 'test', 'test.db')}"
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:////{os.path.join(app.root_path, 'recommended_tracks.db')}"


db = SQLAlchemy(app)


track_artists_table = db.Table("track_artists_table",
                               db.Column("song_id", db.String(80), db.ForeignKey("song.id")),
                               db.Column("artist_name", db.String(80), db.ForeignKey("artist.name")))

track_genres_table = db.Table("track_genres_table",
                              db.Column("song_id", db.String(80), db.ForeignKey("song.id")),
                              db.Column("genre_name", db.String(80), db.ForeignKey("genre.name")))


class User(db.Model):
    email = db.Column(db.String(120), primary_key=True)
    playlist_id = db.Column(db.String(120), unique=True, nullable=False)


class Artist(db.Model):
    name = db.Column(db.String(80), primary_key=True)


class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    artists = db.relationship("Artist", secondary=track_artists_table, lazy="subquery")
                              #backref=db.backref("tracks", lazy=True))
    genres = db.relationship("Genre", secondary=track_genres_table, lazy="subquery")
                             #backref=db.backref("tracks", lazy=True))


class Genre(db.Model):
    name = db.Column(db.String(80), primary_key=True)



@app.route("/", methods=["GET"])
def main():
    #user = session.get("user", None)
    #token = users.get(user, None)

    #if user is None or token is None:
    #    session.pop("user", None)
    #    return f"User ID: None<br>{login_msg}"

    #page = f"User ID: {user}<br><br>{login_msg} \n"
    #if token.is_expiring:
    #    token = cred.refresh(token)
    #    users[user] = token

    for fi in os.listdir(CONFIG_DIR):
        fi_conf = tk.config_from_file(os.path.join(CONFIG_DIR, fi), return_refresh=True)
        token = tk.refresh_user_token(*fi_conf[:2], fi_conf[3], )

        spotify = tk.Spotify(token)
        added_tracks = add_top_tracks_to_playlist(spotify, 6)

        return "<br>".join(added_tracks)

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

    config_dir = os.path.join(app.root_path, "config_files")
    conf = (os.getenv("SPOTIFY_CLIENT_ID"), os.getenv("SPOTIFY_CLIENT_SECRET"), os.getenv("SPOTIFY_REDIRECT_URI"))
    tk.config_to_file(os.path.join(config_dir, "tekore.cfg"), conf + (token.refresh_token,))

    #session["user"] = state
    #users[state] = token

    return redirect("/", 307)


@app.route("/logout", methods=["GET"])
def logout():
    uid = session.pop("user", None)
    if uid is not None:
        users.pop(uid, None)
    return redirect("/", 307)


@dataclass
class Track:
    artists: list
    track_name: str
    genres: list


def save_new_artist(artist):

    if not Artist.query.get(artist):
        db.session.add(Artist(name=artist))
        db.session.commit()
        return True

    return False


def save_new_genre(genre):

    if not Genre.query.get(genre):
        db.session.add(Genre(name=genre))
        db.session.commit()
        return True

    return False


def save_new_track_to_db(track: Track):

    query = Song.query.filter(Song.name == track.track_name)

    cnt = 0
    while query.all() and cnt < len(track.artists):
        query = query.filter(Song.artists.any(name=track.artists[cnt]))
        cnt += 1

    cnt = 0
    while query.all() and cnt < len(track.genres):
        query = query.filter(Song.genres.any(name=track.genres[cnt]))
        cnt += 1

    if not query.all():

        for artist in track.artists:
            save_new_artist(artist)

        for genre in track.genres:
            save_new_genre(genre)

        song_artists = [Artist.query.get(artist) for artist in track.artists]
        song_genres = [Genre.query.get(genre) for genre in track.genres]

        new_song = Song(name=track.track_name, artists=song_artists, genres=song_genres)

        db.session.add(new_song)
        db.session.commit()

        return True

    return False


def get_pitchfork_top_tracks_html(page=1):
    resp = requests.get(f"{TOP_TRACKS_URL}?page={page}")
    if resp.status_code == 200:
        return resp.content
    return None


def rm_quotes(string):
    quote_chars = (chr(34), chr(39), chr(8216), chr(8217), chr(8219), chr(8220), chr(8221))
    if string[0] in quote_chars:
        string = string[1:]
    if string[len(string)-1] in quote_chars:
        string = string[:len(string)-1]
    return string


def parse_top_tracks_html(html) -> list[Track]:

    tracks = []

    soup = bs(html, "html.parser")
    track_elems = soup.find_all("div", {"class": "track-collection-item"})

    newest_top_track_elems = soup.find_all("div", {"class": "track-hero"})
    newest_artists = []
    newest_artist_list_elems = newest_top_track_elems[0].findChildren("ul", {"class": "artist-list"})
    newest_artist_elems = newest_artist_list_elems[0].findChildren("li")
    for elem in newest_artist_elems:
        newest_artists.append(elem.text)
    newest_artists = sorted(newest_artists)

    newest_track_name_elems = newest_top_track_elems[0].findChildren("h2", {"class": "title"})
    newest_track_name = newest_track_name_elems[0].text
    newest_track_name = rm_quotes(newest_track_name)

    newest_genres = []
    newest_genre_elems = newest_top_track_elems[0].findChildren("li", {"class": "genre-list__item"})
    for genre_elem in newest_genre_elems:
        newest_genres.append(genre_elem.text)

    tracks.append(Track(newest_artists, newest_track_name, newest_genres))

    for track_elem in track_elems:

        artists = []
        artist_list_elems = track_elem.findChildren("ul", {"class": "artist-list"})
        artist_elems = artist_list_elems[0].findChildren("li")
        for elem in artist_elems:
            artists.append(elem.text)
        artists = sorted(artists)

        track_name_elems = track_elem.findChildren("h2", {"class": "track-collection-item__title"})
        track_name = track_name_elems[0].text
        track_name = rm_quotes(track_name)

        genres = []
        genre_elems = track_elem.findChildren("li", {"class": "genre-list__item"})
        for genre_elem in genre_elems:
            genres.append(genre_elem.text)

        tracks.append(Track(artists, track_name, genres))

    return tracks


def get_track_id(spotify: tk.Spotify, track: Track) -> str or None:

    logging.debug(f"Track info: {track.track_name}, {track.artists}")

    possible_matches = []

    search = spotify.search(f"{track.track_name} artist:{track.artists[0]}")

    for search_result in search[0].items:
        track_info = spotify.track(search_result.id)
        # TODO: these are a pain to log because of the object structure, maybe make a logging function?

        search_result_track_name = re.sub(f"\(feat.*\)", "", track_info.name)

        logging.debug(f"Search result track name: {search_result_track_name}")

        if search_result_track_name.lower() == track.track_name.lower(): # the track names match
            track_artists = []
            for artist in track_info.artists:
                track_artists.append(artist.name)
            track_artists = sorted(track_artists)
            logging.debug(f"Search result track artists: {track_artists}")
            if len(track_artists) == len(track.artists):  # the number of artists is the same
                artists_match = True
                cnt = 0
                while artists_match and cnt < len(track.artists):
                    if track_artists[cnt].lower() != track.artists[cnt].lower():
                        artists_match = False
                    cnt += 1
                if artists_match:
                    # TODO: decide how to validate the track beyond the track names matching
                    return search_result.id

            elif track_artists[0].lower() == track.artists[0].lower():
                possible_matches.append(search_result.id)

    if possible_matches:
        return possible_matches[0]  # just return the track ID for the one possible match

    # we couldn't find a match
    return None


def get_top_tracks_playlist_id(spotify: tk.Spotify) -> str:
    curr_user_id = spotify.current_user().id
    playlists = spotify.playlists(curr_user_id)
    for playlist in playlists.items:
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


def add_top_tracks_to_playlist(spotify: tk.Spotify, num_recommendation_pages=1):

    tracks = []
    for page in range(1, num_recommendation_pages+1):
        html = get_pitchfork_top_tracks_html(page=page)
        tracks.extend(parse_top_tracks_html(html))

    playlist_id = get_top_tracks_playlist_id(spotify)

    top_tracks_playlist = spotify.playlist(playlist_id)
    top_tracks_playlist_tracks = top_tracks_playlist.tracks
    track_ids = set()
    for top_tracks_playlist_track in top_tracks_playlist_tracks.items:
        track_ids.add(top_tracks_playlist_track.track.id)

    added_tracks = []

    for track in tracks:
        track_id = get_track_id(spotify, track)
        if not track_id:
            logging.warning(f"Could not get Track ID for {track.track_name} by {track.artists}")
            continue
        if track_id not in track_ids:
            added = spotify.playlist_add(playlist_id, [spotify.track(track_id).uri])
            logging.debug(f"playlist_add returned: {added}")
            added_tracks.append(spotify.track(track_id).name)

    return added_tracks


def add_new_top_tracks(spotify: tk.Spotify, user: User, num_recommendation_pages: int = 1):

    tracks = []
    for page in range(1, num_recommendation_pages + 1):
        html = get_pitchfork_top_tracks_html(page=page)
        tracks.extend(parse_top_tracks_html(html))

    # ... TODO: finish implementing this function


if __name__ == "__main__":
    app.run("127.0.0.1", 5000)
