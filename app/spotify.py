import os
import logging

import tekore as tk

from .app import app
from .models import db, Song, User
from .scrape_top_tracks import sanitize_track_name


logging.basicConfig(level=logging.DEBUG)


PITCHFORK_TOP_TRACKS_PLAYLIST_NAME = "Pitchfork Top Tracks"


def get_spotify_obj(config_file=None):
    if config_file is None:
        fi_conf = tk.config_from_file(
            os.path.join(app.config["CONFIG_DIR"], "tekore.cfg"), return_refresh=True
        )
    else:
        fi_conf = tk.config_from_file(
            os.path.join(app.config["CONFIG_DIR"], config_file), return_refresh=True
        )
    token = tk.refresh_user_token(
        *fi_conf[:2],
        fi_conf[3],
    )
    spotify = tk.Spotify(token)
    return spotify


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
            if len(spotify_track_artists) == len(
                song_artists
            ):  # the number of artists is the same
                artists_match = True
                cnt = 0
                while artists_match and cnt < len(song_artists):
                    if (
                        spotify_track_artists[cnt].lower()
                        != song_artists[cnt].name.lower()
                    ):
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


def get_spotify_playlist_id(spotify: tk.Spotify, user: User) -> str:
    """this returns the"""

    if user.playlist_id:
        return user.playlist_id

    # the user doesn't have a playlist ID saved in the db, make a new playlist for them and save the ID
    curr_user_id = spotify.current_user().id
    new_playlist = spotify.playlist_create(
        curr_user_id,
        "Pitchfork Top Tracks",
        public=False,
        description="Playlist containing Pitchfork recommended tracks",
    )
    user.playlist_id = new_playlist.id
    db.session.commit()
    return new_playlist.id


def add_track_to_playlist(spotify: tk.Spotify, user: User, spotify_track_uri):

    top_tracks_playlist = spotify.playlist(playlist_id)
    top_tracks_playlist_tracks = top_tracks_playlist.tracks
    track_ids = set()
    for top_tracks_playlist_track in top_tracks_playlist_tracks.items:
        track_ids.add(top_tracks_playlist_track.track.id)

    added_tracks = []

    for track in tracks:
        track_id = search_track_id(spotify, track)
        if not track_id:
            logging.warning(
                f"Could not get Track ID for {track.track_name} by {track.artists}"
            )
            continue
        if track_id not in track_ids:
            added = spotify.playlist_add(playlist_id, [spotify.track(track_id).uri])
            logging.debug(f"playlist_add returned: {added}")
            added_tracks.append(spotify.track(track_id).name)

    return added_tracks
