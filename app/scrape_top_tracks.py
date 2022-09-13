import re
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup as bs


TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"


@dataclass
class Track:
    artists: list
    track_name: str
    genres: list


def rm_quotes(string):

    quote_chars = {
        chr(34),
        chr(39),
        chr(8216),
        chr(8217),
        chr(8219),
        chr(8220),
        chr(8221)
    }

    for char in quote_chars:
        if char in string:
            string = string.replace(char, "")
    return string


def rm_feat_artist(track_name):
    return re.sub(r"(\[|\(+)(feat|ft|featuring)(.*)", "", track_name)


def sanitize_track_name(track_name):
    return rm_feat_artist(rm_quotes(track_name)).strip()


def get_pitchfork_top_tracks_html(page):
    resp = requests.get(f"{TOP_TRACKS_URL}?page={page}")
    if resp.status_code == 200:
        return resp.content
    return None


def parse_top_tracks_html(html, newest_only) -> list[Track]:
    """ this function returns a list of Tracks after parsing the HTML
        if newest_only is set to True it returns a list with one element
        TODO: make parsing each element its own function
    """
    tracks = []

    soup = bs(html, "html.parser")
    track_elems = soup.find_all("div", {"class": "track-collection-item"})

    newest_top_track_elems = soup.find_all("div", {"class": "track-hero"})
    newest_artists = []
    newest_artist_list_elems = newest_top_track_elems[0].findChildren("ul", {"class": "artist-list"})
    newest_artist_elems = newest_artist_list_elems[0].findChildren("li")
    for elem in newest_artist_elems:
        newest_artists.append(elem.text)
    newest_artists = sorted(newest_artists)

    newest_track_name_elems = newest_top_track_elems[0].findChildren("h2", {"class": "title"})
    newest_track_name = newest_track_name_elems[0].text
    newest_track_name = sanitize_track_name(newest_track_name)

    newest_genres = []
    newest_genre_elems = newest_top_track_elems[0].findChildren("li", {"class": "genre-list__item"})
    for genre_elem in newest_genre_elems:
        newest_genres.append(genre_elem.text)

    tracks.append(Track(newest_artists, newest_track_name, newest_genres))
    if newest_only is True:
        return tracks

    for track_elem in track_elems:

        artists = []
        artist_list_elems = track_elem.findChildren("ul", {"class": "artist-list"})
        artist_elems = artist_list_elems[0].findChildren("li")
        for elem in artist_elems:
            artists.append(elem.text)
        # artists = sorted(artists)

        track_name_elems = track_elem.findChildren("h2", {"class": "track-collection-item__title"})
        track_name = track_name_elems[0].text
        track_name = sanitize_track_name(track_name)

        genres = []
        genre_elems = track_elem.findChildren("li", {"class": "genre-list__item"})
        for genre_elem in genre_elems:
            genres.append(genre_elem.text)

        tracks.append(Track(artists, track_name, genres))

    return tracks
