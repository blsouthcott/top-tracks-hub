from multiprocessing.dummy import Pool

import tekore as tk

from .models import db, Song, Site, Artist, Genre
from .spotify import get_spotify_obj, search_spotify_track_id
from .scrape_top_tracks import (
    Track,
    get_pitchfork_top_tracks_html,
    parse_top_tracks_html,
)
from .logging_utils import logger


def save_new_recommendations_site(site_name):
    """
    Saves a new recommendations site in the database

    Args:
        site_name (str): The name of the site to be saved

    Returns:
        bool: True if the site is successfully saved, False if the site already exists in the database
    """
    if Site.query.get(site_name):
        return False
    db.session.add(Site(name=site_name))
    db.session.commit()
    return True


def save_new_artist(artist):
    """
    Saves a new artist in the database

    Args:
        artist (str): The name of the artist to be saved

    Returns:
        bool: True if the artist is successfully saved, False if the artist already exists in the database
    """
    if Artist.query.get(artist):
        return False
    db.session.add(Artist(name=artist))
    db.session.commit()
    return True


def save_new_genre(genre):
    """
    Saves a new genre in the database

    Args:
        genre (str): The name of the genre to be saved

    Returns:
        bool: True if the genre is successfully saved, False if the genre already exists in the database
    """
    if Genre.query.get(genre):
        return False
    db.session.add(Genre(name=genre))
    db.session.commit()
    return True


def query_track(track: Track, site: str) -> list:
    """
    Queries the database for tracks matching the given track and site

    Args:
        track (Track): The track to search for in the database
        site (str): The site to search for in the database

    Returns:
        list: A list of Songs in the database resulting from the query
    """
    query = (
        Song.query
        .filter(Song.name == track.track_name)
        .filter(Song.site_name == site)
    )

    for artist in track.artists:
        query = query.filter(Song.artists.any(name=artist))

    for genre in track.genres:
        query = query.filter(Song.genres.any(name=genre))
    
    return query.all()


def save_new_track(track: Track, site: str) -> bool | str:
    """
    Saves a new track in the database

    Args:
        track (Track): The track to be saved
        site (str): The name of the site to associate with the track

    Returns:
        bool | str: the Track ID for the new track if it saves, False if the track already exists in the database
    """
    if query_track(track, site):
        return False

    for artist in track.artists:
        save_new_artist(artist)

    for genre in track.genres:
        save_new_genre(genre)

    new_song = track.to_song(site)

    db.session.add(new_song)
    db.session.flush()
    db.session.refresh(new_song)
    db.session.commit()

    return new_song.id


def update_pitchfork_top_tracks_db(max_page_num: int = 255) -> int:
    """
    Populates the database with recommended Pitchfork tracks

    Args:
        max_page_num (int): The maximum page number to obtain the HTML for
            defaults to 255 to get all recommendations
    
    Returns:
        int: The number of tracks that were successfully added to the database
    """
    
    save_new_recommendations_site("Pitchfork")
    with Pool() as pool:
        html_results = pool.map(
            get_pitchfork_top_tracks_html,
            range(1, max_page_num + 1),
        )
    num_new_tracks_added = 0
    spotify_obj = get_spotify_obj()
    for html in html_results:
        if html:
            tracks = parse_top_tracks_html(html)
            for track in tracks:
                if song_id := save_new_track(track, "Pitchfork"):
                    num_new_tracks_added += 1
                    add_spotify_track_id_and_preview_url(song_id, spotify_obj, db)
    return num_new_tracks_added


def add_spotify_track_id_and_preview_url(song_id: int, spotify_obj: tk.Spotify) -> bool:
    """
    Updates a Song in the database with the Spotify Track ID for that song and the Spotify preview URL

    Args:
        song_id (int): The Song's ID in the database
        spotify_obj (tk.Spotify): a Spotify authentication object
    
        Returns:
            bool: True if the song's track ID and preview URL were successfully updated, False otherwise
    """
    song = Song.query.get(song_id)
    spotify_track_id = search_spotify_track_id(spotify_obj, song)
    if not spotify_track_id:
        return False
    song.spotify_track_id = spotify_track_id
    track = spotify_obj.track(spotify_track_id)
    song.preview_url = track.preview_url
    db.session.commit()
    return True
