
import logging

import tekore as tk

from .spotify import get_spotify_obj
from .models import db, User, Song, Site, Artist, Genre
from .scrape_top_tracks import Track, get_pitchfork_top_tracks_html, parse_top_tracks_html
from .spotify import search_spotify_track_id


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