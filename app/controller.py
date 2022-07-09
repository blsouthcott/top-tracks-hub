
import re
import logging
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup as bs
import tekore as tk

from .app import get_spotify_obj
from .models import db, User, Song, Site, Artist, Genre

logging.basicConfig(level=logging.DEBUG)


TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"


@dataclass
class Track:
    artists: list
    track_name: str
    genres: list


def save_new_recommendations_site(site_name):

    if Site.query.get(site_name):
        return False

    db.session.add(Site(name=site_name))
    db.session.commit()
    return True


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


def save_new_track_to_db(track: Track, site: str):
    """ track should be a Track object, site should be a string of the name of the recommendations site
        new recommendation site names should be added to the DB before calling this function
    """
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

        new_song = Song(
            name=track.track_name,
            artists=song_artists,
            genres=song_genres,
            site=Site.query.get(site)
        )

        db.session.add(new_song)
        db.session.commit()

        return

    return False


def get_song_by_name_and_artist(song_name: str, song_artist: str) -> Song:

    query = Song.query.filter(
        Song.name == song_name,
        Song.artists.any(name=song_artist)
    )
    songs = query.all()
    if not songs:
        return None
    return songs[0]


def rm_quotes(string):
    quote_chars = {chr(34), chr(39), chr(8216), chr(8217), chr(8219), chr(8220), chr(8221)}
    for char in quote_chars:
        if char in string:
            string = string.replace(char, "")
    return string


def rm_feat_artist(track_name):
    return re.sub(r"(\[|\(+)(feat|ft|featuring)(.*)", "", track_name)


def sanitize_track_name(track_name):
    return rm_feat_artist(rm_quotes(track_name)).strip()


def get_pitchfork_top_tracks_html(page=1):
    resp = requests.get(f"{TOP_TRACKS_URL}?page={page}")
    if resp.status_code == 200:
        return resp.content
    return None


def parse_top_tracks_html(html, only_newest=True) -> list[Track]:

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
    newest_track_name = sanitize_track_name(newest_track_name)

    newest_genres = []
    newest_genre_elems = newest_top_track_elems[0].findChildren("li", {"class": "genre-list__item"})
    for genre_elem in newest_genre_elems:
        newest_genres.append(genre_elem.text)

    tracks.append(Track(newest_artists, newest_track_name, newest_genres))
    if only_newest is True:
        return tracks

    for track_elem in track_elems:

        artists = []
        artist_list_elems = track_elem.findChildren("ul", {"class": "artist-list"})
        artist_elems = artist_list_elems[0].findChildren("li")
        for elem in artist_elems:
            artists.append(elem.text)
        # artists = sorted(artists)

        track_name_elems = track_elem.findChildren("h2", {"class": "track-collection-item__title"})
        track_name = track_name_elems[0].text
        track_name = sanitize_track_name(track_name)

        genres = []
        genre_elems = track_elem.findChildren("li", {"class": "genre-list__item"})
        for genre_elem in genre_elems:
            genres.append(genre_elem.text)

        tracks.append(Track(artists, track_name, genres))

    return tracks


def search_spotify_track_id(spotify: tk.Spotify, song: Song) -> str or None:
    # update this to handle where track is a `Song`

    logging.debug(f"Track info: {song.name}, {song.artists}")

    possible_matches = []
    search = spotify.search(f"{song.name} artist:{song.artists[0].name}")
    logging.debug(f"Searched for: '{song.name} artist:{song.artists[0].name}'")
    for search_result in search[0].items:
        spotify_track_info = spotify.track(search_result.id)
        # TODO: these are a pain to log because of the object structure, maybe make a logging function?
        spotify_track_name = sanitize_track_name(spotify_track_info.name)
        logging.debug(f"Search result track name: {spotify_track_name}")

        if spotify_track_name.lower() == song.name.lower():  # the track names match
            spotify_track_artists = []
            for artist in spotify_track_info.artists:
                spotify_track_artists.append(artist.name)
            spotify_track_artists.sort()
            song_artists = list(song.artists)
            song_artists.sort(key=lambda artist: artist.name)
            logging.debug(f"Search result track artists: {spotify_track_artists}")
            if len(spotify_track_artists) == len(song_artists):  # the number of artists is the same
                artists_match = True
                cnt = 0
                while artists_match and cnt < len(song_artists):
                    if spotify_track_artists[cnt].lower() != song_artists[cnt].name.lower():
                        artists_match = False
                    cnt += 1
                if artists_match:
                    # TODO: decide how to validate the track beyond the track names matching
                    # for now, only return the track id if it's an exact match
                    return search_result.id

            # elif spotify_track_artists[0].lower() == song_artists[0].name.lower():
            #     possible_matches.append(search_result.id)

    # if possible_matches:
    #     return possible_matches[0]  # just return the track ID for the one possible match

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
                                           description="Playlist containing Pitchfork recommended tracks"
                                           )
    return new_playlist.id


def fill_pitchfork_top_tracks_db():
    save_new_recommendations_site("Pitchfork")
    page = 1
    html = get_pitchfork_top_tracks_html(page=page)
    while html:
        tracks = parse_top_tracks_html(html, only_newest=False)
        for track in tracks:
            save_new_track_to_db(track, "Pitchfork")
        page += 1
        html = get_pitchfork_top_tracks_html(page)


def add_new_track():
    html = get_pitchfork_top_tracks_html()
    tracks = parse_top_tracks_html(html)
    if tracks:
        new_track = tracks[0]
        new_track_saved = save_new_track_to_db(new_track, "Pitchfork")
        if new_track_saved:
            spotify_obj = get_spotify_obj()
            track_id = search_spotify_track_id(spotify_obj, new_track)
            if not track_id:
                # TODO: send an automated email to me telling me I have to manually put in the track ID
                pass
            else:
                # TODO: update track ID in the database
                song = get_song_by_name_and_artist(new_track.track_name, new_track.artists[0])
                song.spotify_track_id = track_id
                db.session.commit()


def update_song_spotify_track_id(spotify: tk.Spotify, song: Song):

    track_id = search_spotify_track_id(spotify, song)
    if not track_id:
        logging.info(f"Could not find Spotify Track ID for song with Song ID: {song.id}")
        return False

    song.spotify_track_id = track_id
    db.session.commit()
    return True


# def add_top_tracks_to_playlist(spotify: tk.Spotify, num_recommendation_pages=1):
#
#     tracks = []
#     for page in range(1, num_recommendation_pages+1):
#         html = get_pitchfork_top_tracks_html(page=page)
#         tracks.extend(parse_top_tracks_html(html))
#
#     playlist_id = get_top_tracks_playlist_id(spotify)
#
#     top_tracks_playlist = spotify.playlist(playlist_id)
#     top_tracks_playlist_tracks = top_tracks_playlist.tracks
#     track_ids = set()
#     for top_tracks_playlist_track in top_tracks_playlist_tracks.items:
#         track_ids.add(top_tracks_playlist_track.track.id)
#
#     added_tracks = []
#
#     for track in tracks:
#         track_id = search_track_id(spotify, track)
#         if not track_id:
#             logging.warning(f"Could not get Track ID for {track.track_name} by {track.artists}")
#             continue
#         if track_id not in track_ids:
#             added = spotify.playlist_add(playlist_id, [spotify.track(track_id).uri])
#             logging.debug(f"playlist_add returned: {added}")
#             added_tracks.append(spotify.track(track_id).name)
#
#     return added_tracks