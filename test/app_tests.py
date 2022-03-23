
import unittest
import logging

from ..app import get_pitchfork_top_tracks_html, parse_top_tracks_html


logging.basicConfig(level=logging.DEBUG)


class AppTester(unittest.TestCase):

    def test_parse_tracks(self):
        for i in range(10):
            html = get_pitchfork_top_tracks_html(int(i)+1)
            tracks = parse_top_tracks_html(html)
            logging.debug(tracks)
            self.assertTrue(tracks)
