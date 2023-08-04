import os
import logging

import tekore as tk

from .models import db, Song, User
from .scrape_top_tracks import sanitize_track_name


logging.basicConfig(level=logging.DEBUG)

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config_files")
PITCHFORK_TOP_TRACKS_PLAYLIST_NAME = "Pitchfork Top Tracks"


def get_spotify_obj(config_file: str = None) -> tk.Spotify:
    if config_file is None:
        config_file = [file for file in os.listdir(CONFIG_DIR) if "placeholder" not in file][0]
        fi_conf = tk.config_from_file(
            os.path.join(CONFIG_DIR, config_file), return_refresh=True
        )
    else:
        fi_conf = tk.config_from_file(
            os.path.join(CONFIG_DIR, config_file), return_refresh=True
        )
    token = tk.refresh_user_token(
        *fi_conf[:2],
        fi_conf[3],
    )
    return tk.Spotify(token)


def search_spotify_track_id(spotify_obj: tk.Spotify, song: Song) -> str or None:
    """
    searches for the song through the Spotify API based on the song name and first artist
    if both the song name matches and the number of artists match and the artists' names match it,
    it returns the track ID, otherwise we can't find an exact match and it returns None
    """
    logging.debug(f"Track info: {song.name}, {song.artists}")

    search = spotify_obj.search(f"{song.name} artist:{song.artists[0].name}")
    logging.debug(f"Searched for: '{song.name} artist:{song.artists[0].name}'")
    for search_result in search[0].items:
        spotify_track_info = spotify_obj.track(search_result.id)
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

    # we couldn't find a match
    return None


def get_user_spotify_playlists(user_email: str, filter_keyword="Pitchfork") -> list[dict]:
    """
    returns the name and id for each playlist in the user's account filtered by keyword
    """
    spotify_obj = get_spotify_obj(f"{user_email}.cfg")
    spotify_playlists = spotify_obj.playlists(spotify_obj.current_user().id)
    return [{"name": playlist.name, "id": playlist.id} for playlist in spotify_playlists.items if filter_keyword.lower() in playlist.name.lower()]


def create_spotify_playlist(spotify_obj: tk.Spotify, user: User, playlist_name="Pitchfork Top Tracks") -> None:
    """
    create a new playlist in the user's Spotify account
    """
    new_playlist = spotify_obj.playlist_create(
        spotify_obj.current_user().id,
        playlist_name,
        public=False,
        description="Playlist containing Pitchfork recommended tracks",
    )
    user.playlist_id = new_playlist.id
    db.session.commit()


def add_track_to_playlist(spotify_obj: tk.Spotify, playlist_id: str, new_track_id: str) -> bool:
    """
    TODO: implement a more efficient version of this function
    """
    top_tracks_playlist = spotify_obj.playlist(playlist_id)
    top_tracks_playlist_tracks = top_tracks_playlist.tracks

    # Spotify does allow duplicate tracks in a playlist
    # check which track IDs are already in the playlist so we avoid adding duplicates
    for playlist_track in top_tracks_playlist_tracks.items:
        if playlist_track.track.id == new_track_id:
            logging.debug(f"skipped adding duplicate track with id {new_track_id} to playlist")
            return False

    added = spotify_obj.playlist_add(playlist_id, [spotify_obj.track(new_track_id).uri])
    logging.debug(f"playlist_add returned: {added}")
    return added


def search_spotify_tracks(spotify_obj: tk.Spotify, song_name: str, artist: str) -> list[tk.model.FullTrack]:
    search_results = spotify_obj.search(f"{song_name} artist:{artist}")[0].items
    return [spotify_obj.track(search_result.id) for search_result in search_results]
