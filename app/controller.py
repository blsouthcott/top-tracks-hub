
import logging

import tekore as tk

from .models import db, User, Song, Site, Artist, Genre
from .scrape_top_tracks import Track, get_pitchfork_top_tracks_html, parse_top_tracks_html


logging.basicConfig(level=logging.DEBUG)


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
        db.session.flush()
        db.session.refresh(new_song)
        db.session.commit()

        return new_song.id

    return False


def get_songs_by_str_val(str_attr: str, str_val: str, query=None):
    if query:
        query = query.filter(getattr(Song, str_attr) == str_val)
    else:
        query = Song.query.filter(getattr(Song, str_attr) == str_val)
    return query if query.all() else None


def get_songs_by_list_vals(list_attr: str, list_vals: list, query=None):
    if query:
        cnt = 0
        while query.all() and cnt < len(list_vals):
            query = query.filter(getattr(Song, list_attr).any(name=list_vals[cnt]))
            cnt += 1
    else:
        query = Song.query.filter(getattr(Song, list_attr).any(name=list_vals[0]))
        cnt = 1
        while query.all() and cnt < len(list_vals):
            query = query.filter(getattr(Song, list_attr).any(name=list_vals[cnt]))
            cnt += 1
    return query if query.all() else None


def get_song_by_name_and_artist(song_name: str, song_artist: str) -> Song:
    query = Song.query.filter(
        Song.name == song_name,
        Song.artists.any(name=song_artist)
    )
    songs = query.all()
    if not songs:
        return None
    return songs[0]


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


def update_song_spotify_track_id(song: Song, track_id: str):
    song.spotify_track_id = track_id
    db.session.commit()
    return True


def fill_pitchfork_top_tracks_db():
    """ this can be used to fill the database if for some reason we have to start over from scratch
        it makes a request to get the html for each page of recommended tracks until we get a 404
        status code and the function doesn't return anything, and then adds those tracks to the db
    """
    save_new_recommendations_site("Pitchfork")
    page = 1
    html = get_pitchfork_top_tracks_html(page=page)
    while html:
        tracks = parse_top_tracks_html(html, only_newest=False)
        for track in tracks:
            save_new_track_to_db(track, "Pitchfork")
        page += 1
        html = get_pitchfork_top_tracks_html(page)


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
