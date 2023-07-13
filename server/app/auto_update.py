import os
import logging

from .models import db, Song, User
from .scrape_top_tracks import get_pitchfork_top_tracks_html, parse_top_tracks_html
from .controller import save_new_track_to_db, get_song_by_name_and_artist
from .spotify import get_spotify_obj, search_spotify_track_id, get_spotify_playlist_id


logging.basicConfig(level=logging.DEBUG)


GENERIC_SPOTIFY_CONFIG_FILE = "tekore.cfg"


def check_for_and_add_new_recommended_track():
    html = get_pitchfork_top_tracks_html(1)
    new_track = parse_top_tracks_html(html)[0]
    new_track_id = save_new_track_to_db(new_track, "Pitchfork")
    if not new_track_id:
        return None

    new_song = Song.query.get(new_track_id)
    spotify_obj = get_spotify_obj()
    spotify_track_id = search_spotify_track_id(spotify_obj, new_song)
    if not spotify_track_id:
        # TODO: send an automated email to me telling me I have to manually put in the track ID
        logging.info(f"Unable to find a Spotify Track ID that matched {new_track}")
        pass
    else:
        new_song.spotify_track_id = spotify_track_id
        db.session.commit()
        return spotify_track_id


def update_spotify_playlists(config_dir):

    new_spotify_track_id = check_for_and_add_new_recommended_track()
    if not new_spotify_track_id:
        logging.info("No new Pitchfork recommended tracks were found.")
        return

    for file in os.listdir(config_dir):
        # if we're authenticating through other music streaming services, we may want to
        if file != GENERIC_SPOTIFY_CONFIG_FILE:
            spotify_obj = get_spotify_obj(file)
            spotify_playlist_id = get_spotify_playlist_id(
                spotify_obj, User.query.get(file.replace(".cfg", ""))
            )
            new_spotify_track_uri = spotify_obj.track(new_spotify_track_id).uri
            spotify_obj.playlist_add(spotify_playlist_id, [new_spotify_track_uri])
            logging.info(
                f"Updated spotify playlist {spotify_playlist_id} with track {new_spotify_track_id}"
            )
