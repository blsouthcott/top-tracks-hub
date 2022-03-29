""" To run local tests, a configuration file must be saved in the test directory """


import os
import unittest
import logging

import tekore as tk

from ..app import Track, get_pitchfork_top_tracks_html, parse_top_tracks_html, get_track_id, get_top_tracks_playlist_id


logging.basicConfig(level=logging.DEBUG)


CONFIG_FILE = "/home/ben/repos/top-tracks-scraper/test/tekore.cfg"


class AppTester(unittest.TestCase):

    def test_parse_tracks(self):
        for i in range(10):
            html = get_pitchfork_top_tracks_html(int(i)+1)
            tracks = parse_top_tracks_html(html)
            print(tracks)
            self.assertTrue(tracks)

    def test_get_top_tracks_playlist_id(self):
        conf = tk.config_from_file(CONFIG_FILE, return_refresh=True)
        token = tk.refresh_user_token(*conf[:2], conf[3])
        spotify = tk.Spotify(token)

        playlist_id = get_top_tracks_playlist_id(spotify)
        self.assertTrue(playlist_id)

    def test_get_track_id(self):
        conf = tk.config_from_file(CONFIG_FILE, return_refresh=True)
        token = tk.refresh_user_token(*conf[:2], conf[3])
        spotify = tk.Spotify(token)

        html = get_pitchfork_top_tracks_html(1)
        tracks = parse_top_tracks_html(html)
        for track in tracks:
            track_id = get_track_id(spotify, track)
            self.assertTrue(track_id is not None)
            track_match = spotify.track(track_id)
            print(f"Track: {track.track_name}")
            print(f"Found Track: {track_match.name}\n\n")
            self.assertEqual(track.track_name.lower(), track_match.name.lower())
