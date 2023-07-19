import os
import logging

from .models import db, Song, User
from .scrape_top_tracks import get_pitchfork_top_tracks_html, parse_top_tracks_html
from .controller import save_new_track_to_db, add_spotify_track_id_to_song
from .spotify import get_spotify_obj, get_spotify_playlist_id


logging.basicConfig(level=logging.DEBUG)


def check_for_and_add_new_recommended_track() -> int | None:
    """
    checks for the newest recommended track and adds it to the database if it doesn't already exist
    then searches for the Spotify track ID for that song and adds it if found
    """
    html = get_pitchfork_top_tracks_html(1)
    new_track = parse_top_tracks_html(html)[0]
    song_id = save_new_track_to_db(new_track, "Pitchfork")
    if not song_id:
        return None

    spotify_obj = get_spotify_obj()
    if add_spotify_track_id_to_song(song_id, spotify_obj, db):
        return song_id
    
    logging.info(f"Unable to find a Spotify Track ID that matched {new_track}")
    return None
    


def update_spotify_playlists_with_newest_recommended_track(config_dir: str) -> None:
    """ 
    checks for the newest recommended track and adds it to every playlist
    """
    song_id = check_for_and_add_new_recommended_track()
    if not song_id:
        logging.info("No new Pitchfork recommended tracks were found.")
        return
    
    song = Song.query.get(song_id)

    config_files = [file for file in os.listdir(config_dir) if "placeholder" not in file]
    for file in config_files:
        spotify_obj = get_spotify_obj(file)
        spotify_playlist_id = get_spotify_playlist_id(
            spotify_obj, User.query.get(file.replace(".cfg", ""))
        )
        new_spotify_track_uri = spotify_obj.track(song.spotify_track_id).uri
        spotify_obj.playlist_add(spotify_playlist_id, [new_spotify_track_uri])
        logging.info(
            f"Updated spotify playlist {spotify_playlist_id} with track {song.spotify_track_id}"
        )
