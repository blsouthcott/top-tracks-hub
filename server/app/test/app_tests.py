""" To run local tests, a configuration file must be saved in the test directory """

# TODO: rewrite outdated tests

import os
import unittest
import logging

import tekore as tk

from ..controller import get_pitchfork_top_tracks_html, parse_top_tracks_html
from ..spotify import search_spotify_track_id, create_spotify_playlist

logging.basicConfig(level=logging.DEBUG)


CONFIG_FILE = f"{os.getenv('HOME')}/repos/scrape-top-tracks/app/test/tekore.cfg"


def local_config():
    """run this function so tests can run locally"""
    with open(CONFIG_FILE, "w") as f:
        f.write("")
    conf = (
        os.getenv("SPOTIFY_CLIENT_ID"),
        os.getenv("SPOTIFY_CLIENT_SECRET"),
        os.getenv("SPOTIFY_REDIRECT_URI"),
    )

    token = tk.prompt_for_user_token(*conf, scope=tk.scope.every)
    tk.config_to_file(CONFIG_FILE, conf + (token.refresh_token,))


class AppTester(unittest.TestCase):
    def test_parse_tracks(self):
        for i in range(10):
            html = get_pitchfork_top_tracks_html(int(i) + 1)
            tracks = parse_top_tracks_html(html)
            print(tracks)
            self.assertTrue(tracks)

    def test_get_track_id(self):
        conf = tk.config_from_file(CONFIG_FILE, return_refresh=True)
        token = tk.refresh_user_token(*conf[:2], conf[3])
        spotify = tk.Spotify(token)

        html = get_pitchfork_top_tracks_html(1)
        tracks = parse_top_tracks_html(html)
        for track in tracks:
            track_id = search_spotify_track_id(spotify, track)
            self.assertTrue(track_id is not None)
            track_match = spotify.track(track_id)
            print(f"Track: {track.track_name}")
            print(f"Found Track: {track_match.name}\n\n")
            self.assertEqual(track.track_name.lower(), track_match.name.lower())
