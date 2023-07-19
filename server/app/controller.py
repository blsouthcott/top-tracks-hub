import logging
from multiprocessing.dummy import Pool

from .models import db, Song, Site, Artist, Genre
from .spotify import get_spotify_obj, add_spotify_track_id_to_song
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
    """track should be a Track object, site should be a string of the name of the recommendations site
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
        Song.name == song_name, Song.artists.any(name=song_artist)
    )
    songs = query.all()
    if not songs:
        return None
    return songs[0]


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
                    add_spotify_track_id_to_song(song_id, spotify_obj, db)
    return num_new_tracks_added
