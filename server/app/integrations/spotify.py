import tempfile
import time
from typing import Callable, Iterable, Any
from functools import wraps
from dataclasses import dataclass

import tekore as tk
from tekore.model import FullTrackPaging, FullTrack, PlaylistTrack, Paging

from .scrape_top_tracks import sanitize_track_name
from ..utils.logging_utils import logger
from ..models import db, Song, User



def safe_spotify_call(spotify_fnx: Callable[..., Any]):
    """
    Decorator function that executes a function through the Spotify API with rate limit error handling and thread safety

    Args:
        spotify_fnx (Callable): The Spotify function to be called - should be a method of the tekore.Spotify authentication object
        lock (Lock | None): A Lock object to prevent multiple threads modifying the authentication object concurrently
        *args (Any): positional arguments to be passed to the Spotify function
        **kwargs (Any): Arbitrary keyword arguments to be passed to the Spotify function

    Returns:
        Any | None: The result of the Spotify function call, or None if the call fails after maximum retries
    """

    @wraps(spotify_fnx)
    def wrapper(
        *args,
        lock=None,
        max_tries: int = 10,
        **kwargs,
    ) -> Any | None:
        num_tries = 0
        while num_tries < max_tries:
            try:
                if not lock:
                    return spotify_fnx(*args, **kwargs)
                with lock:
                    return spotify_fnx(*args, **kwargs)
            except tk.TooManyRequests as err:
                num_tries += 1
                logger.debug(
                    f"reached rate limit making the following request: {spotify_fnx.__qualname__} with args: {args} and keyword args: {kwargs}"
                )
                logger.debug("trying again...")
                retry_after = int(err.response.headers.get("Retry-After", "1"))
                time.sleep(retry_after)

        logger.error(
            f"Unable to execute request. Maximum retries attempted for request: {spotify_fnx} with args: {args} and keyword args: {kwargs}"
        )
        return None

    return wrapper


class SafeSpotify(tk.Spotify):
    """
    Extended Spotify class with built-in rate limit handling and thread safety

    This class inherits from tekore.Spotify and adds automatic handling for rate limits
    and optional thread safety for its methods
    """

    @safe_spotify_call
    def current_user(self):
        return super().current_user()
    
    @safe_spotify_call
    def current_user_top_tracks(self, time_range: str = "medium_term", limit: int = 20, offset: int = 0):
        return super().current_user_top_tracks(time_range=time_range, limit=limit, offset=offset)

    @safe_spotify_call
    def current_user_top_artists(self, time_range: str = "medium_term", limit: int = 20, offset: int = 0):
        return super().current_user_top_artists(time_range=time_range, limit=limit, offset=offset)

    @safe_spotify_call
    def track(self, track_id: str, market: str | None = None):
        return super().track(track_id, market=market)

    @safe_spotify_call
    def next(self, page: Paging):
        return super().next(page)

    @safe_spotify_call
    def playlists(self, user_id: str, limit: int = 20, offset: int = 0):
        return super().playlists(user_id, limit=limit, offset=offset)

    @safe_spotify_call
    def playlist(
        self,
        playlist_id: str,
        fields: str | None = None,
        market: str | None = None,
        as_tracks: bool | Iterable[str] = False,
    ):
        return super().playlist(playlist_id, fields=fields, market=market, as_tracks=as_tracks)

    @safe_spotify_call
    def playlist_create(self, user_id: str, name: str, public: bool = True, description: str = ""):
        return super().playlist_create(user_id, name, public=public, description=description)

    @safe_spotify_call
    def playlist_add(self, playlist_id: str, uris: list[str], position: int | None = None):
        return super().playlist_add(playlist_id, uris, position=position)

    @safe_spotify_call
    def search(
        self,
        query: str,
        types: tuple = ("track",),
        market: str | None = None,
        include_external: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ):
        return super().search(
            query, types=types, market=market, include_external=include_external, limit=limit, offset=offset
        )


def track_id_to_uri(track_id: str):
    """
    Formats the Track ID to the URI

    Args:
        track_id (str): the track ID

    Returns:
        str: the track's URI
    """
    return f"spotify:track:{track_id}"


def get_spotify_obj(user: User | None = None) -> tk.Spotify | None:
    """
    Creates and returns a Spotify authentication object for a given user

    Because not all calls to the Spotify API require authentication with a specific user,
        if no user is specified it selects the first user in the list of returned users

    Args:
        user (User | None): The user to authenticate with - defaults to the first user with a config file if None

    Returns:
        tk.Spotify | None: A Spotify client object or None if no valid user is found
    """
    if user is None:
        if users := User.query.filter(User.config_file.is_not(None)).all():
            user = users[0]
        else:
            return None

    elif user.config_file is None:
        return None

    else:
        # tekore provides a convenient function for parsing the credentials necessary for authenticating to the
        #   Spotify API, so first we first write the credentials to a temp file
        with tempfile.NamedTemporaryFile() as temp_config_file:
            temp_config_file.write(user.config_file)
            temp_config_file.seek(0)
            config = tk.config_from_file(temp_config_file.name, return_refresh=True)

        token = tk.refresh_user_token(
            config[0],
            config[1],
            config[3],
        )
        return SafeSpotify(token)


def get_track_match(song: Song, tracks: list[FullTrack]) -> FullTrack | None:
    """
    Finds and returns the first Spotify track that matches the given song

    Args:
        song (Song): The song for which we attempt to find the Spotify track ID
        tracks (ModelList[FullTrack]): A list of Spotify tracks with which to perform the matching

    Returns:
        tk.model.FullTrack | None: The matching Spotify track or None if no match is found
    """
    for track in tracks:
        spotify_track_name = sanitize_track_name(track.name)
        logger.debug(f"Sanitized search result track name: {spotify_track_name}")
        spotify_track_artists = sorted([artist.name.lower() for artist in track.artists])
        logger.debug(f"Search result track artists: {spotify_track_artists}")
        song_artists = sorted([artist.name.lower() for artist in list(song.artists)])
        if spotify_track_artists == song_artists:
            return track
    return None


def search_spotify_track_id(spotify_obj: tk.Spotify, song: Song) -> str | None:
    """
    Searches for a Spotify track ID that matches the given song

    Args:
        spotify_obj (tk.Spotify): The Spotify authenticatino object
        song (Song): The song to search for on Spotify

    Returns:
        str | None: The Spotify track ID if a match is found, otherwise None
    """
    logger.debug(f"Searching for track info - song name: {song.name}, song artists: {song.artists}")

    search_results = search_spotify_tracks(spotify_obj, song.name, song.artists[0].name)
    if track := get_track_match(song, search_results.items):
        return track.id
    
    while search_results.next:
        search_results = spotify_obj.next(search_results)
        if track := get_track_match(song, search_results.items):
            return track.id

    return None


def get_user_spotify_playlists(spotify_obj: tk.Spotify, filter_keyword="Pitchfork") -> list[dict]:
    """
    Retrieves a list of the user's Spotify playlists filtered by a keyword

    Args:
        spotify_obj (tk.Spotify): The Spotify authentication object
        filter_keyword (str): The keyword to filter playlists - defaults to "Pitchfork"

    Returns:
        list[dict]: A list of dictionaries containing the name and ID of each playlist after filtering
    """
    spotify_playlists = spotify_obj.playlists(spotify_obj.current_user().id)
    lkeyword = filter_keyword.lower()
    return [
        {"name": playlist.name, "id": playlist.id}
        for playlist in spotify_playlists.items
        if lkeyword in playlist.name.lower()
    ]


def create_spotify_playlist(user: User, spotify_obj: tk.Spotify, playlist_name="Pitchfork Top Tracks") -> None:
    """
    Creates a new Spotify playlist for the user

    Args
        user (User): The user for whom to create the playlist
        spotify_obj (tk.Spotify): The Spotify authentication object
        playlist_name (str): The name of the new playlist - defaults to "Pitchfork Top Tracks"
    """
    new_playlist = spotify_obj.playlist_create(
        spotify_obj.current_user().id,
        playlist_name,
        public=False,
        description="Playlist containing Pitchfork recommended tracks",
    )
    user.playlist_id = new_playlist.id
    db.session.commit()


def get_playlist_tracks(
    spotify_obj: tk.Spotify, playlist_id: str, ids_as_set=False
) -> list[PlaylistTrack] | set[str]:
    """
    Retrieves the tracks that are in the given user's playlist
    """
    playlist = spotify_obj.playlist(playlist_id)
    if not ids_as_set:
        return playlist.tracks.items
    
    playlist_tracks = playlist.tracks.items
    return {playlist_track.track.id for playlist_track in playlist_tracks}


@dataclass
class PlaylistAddResults:
    """
    Represents the results of adding tracks to a playlist

    Attributes:
        success (tuple[str]): List of successful track IDs
        failure (tuple[str]): List of failed track IDs
        duplicate (tuple[str]): List of duplicate track IDs
    """
    success: tuple[str]
    failure: tuple[str]
    duplicate: tuple[str]


def add_tracks_to_playlist(
    spotify_obj: tk.Spotify, playlist_id: str, new_track_ids: set[str]
) -> PlaylistAddResults:
    """
    Adds a list of track IDs to a Spotify playlist without duplicating any tracks in the playlist

    Args:
        spotify_obj (tk.Spotify): The Spotify authentication object
        playlist_id (str): The ID of the playlist the tracks should be added to
        new_track_ids (list[str]): A list of Spotify track IDs to add

    Returns:
        dict: PlaylistAddResults object with success, failure, and duplicate fields to indicate the result of each track ID
    """
    playlist_track_ids = get_playlist_tracks(spotify_obj, playlist_id, ids_as_set=True)

    # Spotify allows duplicate tracks in playlists, so we check which track IDs are already in the playlist
    #   to avoid adding duplicates
    filtered_track_ids = set()
    duplicates = set()
    for track_id in new_track_ids:
        if track_id in playlist_track_ids:
            logger.warning(f"skipping duplicate track with id {track_id} to playlist")
            duplicates.add(track_id)
        else:
            filtered_track_ids.add(track_id)

    if filtered_track_ids:
        snapshot_id = spotify_obj.playlist_add(
            playlist_id, [track_id_to_uri(track_id) for track_id in filtered_track_ids]
        )
        logger.info(f"Successfully updated playlist - snapshot ID returned: {snapshot_id}")
        playlist_track_ids = get_playlist_tracks(spotify_obj, playlist_id, ids_as_set=True)

    added_track_ids = filtered_track_ids & playlist_track_ids
    missing_track_ids = filtered_track_ids - playlist_track_ids
    return PlaylistAddResults(
        success=tuple(added_track_ids), failure=tuple(missing_track_ids), duplicate=tuple(duplicates)
    )


def search_spotify_tracks(spotify_obj: tk.Spotify, song_name: str, artist_name: str) -> FullTrackPaging:
    """
    Searches Spotify for tracks matching a specific song name and artist

    Args:
        spotify_obj (tk.Spotify): The Spotify client object
        song_name (str): The name of the song to search for
        artist_name (str): The name of the artist of the song

    Returns:
        tk.model.FullTrackPaging: A paging object containing the search results
    """
    return spotify_obj.search(f"{song_name} artist:{artist_name}")[0]
