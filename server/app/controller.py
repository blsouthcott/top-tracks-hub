import logging
from multiprocessing.dummy import Pool

from sqlalchemy import func

from .models import db, Song, Site, Artist, Genre
from .spotify import get_spotify_obj, search_spotify_track_id
from .scrape_top_tracks import (
    Track,
    get_pitchfork_top_tracks_html,
    parse_top_tracks_html,
)


logging.basicConfig(level=logging.DEBUG)


def save_new_recommendations_site(site_name):
    if Site.query.get(site_name):
        return False
    db.session.add(Site(name=site_name))
    db.session.commit()
    return True


def save_new_artist(artist):
    if Artist.query.get(artist):
        return False
    db.session.add(Artist(name=artist))
    db.session.commit()
    return True
    

def save_new_genre(genre):
    if Genre.query.get(genre):
        return False
    db.session.add(Genre(name=genre))
    db.session.commit()
    return True
    


def save_new_track_to_db(track: Track, site: str):
    """
    track should be a Track object, site should be a string of the name of the recommendations site
    new recommendation site names should be added to the DB before calling this function
    """
    query = Song.query.filter(Song.name == track.track_name)

    for artist in track.artists:
        query = query.filter(Song.artists.any(name=artist))

    for genre in track.genres:
        query = query.filter(Song.genres.any(name=genre))

    if not query.all():

        for artist in track.artists:
            save_new_artist(artist)

        for genre in track.genres:
            save_new_genre(genre)

        song_artists = [Artist.query.get(artist) for artist in track.artists]
        song_genres = [Genre.query.get(genre) for genre in track.genres]

        max_id = db.session.query(func.max(Song.id)).scalar()
        new_song = Song(
            id=max_id+1,
            name=track.track_name,
            artists=song_artists,
            genres=song_genres,
            site=Site.query.get(site),
            link=track.link,
            date_published=track.date_published
        )

        db.session.add(new_song)
        db.session.flush()
        db.session.refresh(new_song)
        db.session.commit()

        return new_song.id

    return False


def update_pitchfork_top_tracks_db(max_page_num=255):
    """ 
    updates the db with Pitchfork recommended tracks
    by default, it tries to get everything that's available
    it appears that Pitchfork only stores published recommendations for about 255 pages worth of recommendations
    """
    save_new_recommendations_site("Pitchfork")
    pool = Pool()
    html_results = pool.map(get_pitchfork_top_tracks_html, [page_num for page_num in range(1, max_page_num+1)])
    num_new_tracks_added = 0
    spotify_obj = get_spotify_obj()
    for html in html_results:
        if html:
            tracks = parse_top_tracks_html(html)
            for track in tracks:
                song_id = save_new_track_to_db(track, "Pitchfork")
                if song_id:
                    num_new_tracks_added += 1
                    add_spotify_track_id_and_preview_url(song_id, spotify_obj, db)
    return num_new_tracks_added


def add_spotify_track_id_and_preview_url(song_id, spotify_obj, db):
    """
    searches for a spotify track ID for the given song
    if there's a match, adds the spotify track ID and the preview URL to the database
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
