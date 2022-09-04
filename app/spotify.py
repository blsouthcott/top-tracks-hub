import os
import logging

import tekore as tk

from .app import app
from .models import Song
from .scrape_top_tracks import sanitize_track_name


logging.basicConfig(level=logging.DEBUG)


def get_spotify_obj():
    fi_conf = tk.config_from_file(os.path.join(app.config["CONFIG_DIR"], "tekore.cfg"), return_refresh=True)
    token = tk.refresh_user_token(*fi_conf[:2], fi_conf[3], )
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
