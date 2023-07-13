import re
from dataclasses import dataclass
from datetime import datetime, date

import requests
from bs4 import BeautifulSoup as bs


TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"


@dataclass
class Track:
    artists: list
    track_name: str
    genres: list
    link: str
    date_published: date


def rm_quotes(string):

    quote_chars = {
        chr(34),
        chr(39),
        chr(8216),
        chr(8217),
        chr(8219),
        chr(8220),
        chr(8221),
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


def parse_top_tracks_html(html: str) -> list[Track]:
    """
    this function returns a list of Tracks after parsing the HTML
    if newest_only is set to True it returns a list with one element
    """
    soup = bs(html, "html.parser")
    tracks = []

    track_elems = []
    track_elems.extend(soup.select("div.track-hero"))
    track_elems.extend(soup.select("div.track-collection-item"))
    
    for track_elem in track_elems:

        title_elem = track_elem.select("h2.track-collection-item__title")
        if title_elem:
            track_name = sanitize_track_name(title_elem[0].text)
        else:
            title_elem = track_elem.select("h2.title")
            track_name = sanitize_track_name(title_elem[0].text) if title_elem else None

        artist_elems = track_elem.select("ul.artist-list li")
        artists = sorted([artist_elem.text for artist_elem in artist_elems])

        genre_elems = track_elem.select("li.genre-list__item a")
        genres = [genre_elem.text for genre_elem in genre_elems]

        link_elem = track_elem.select("a.track-collection-item__track-link")
        if link_elem:
            link = link_elem[0]["href"]
        else:
            link_elem = track_elem.select("a.artwork")
            link = link_elem[0]["href"] if link_elem else None

        time_published_elem = track_elem.select("time.pub-date")
        date_published = datetime.strptime(time_published_elem[0]["datetime"], "%Y-%m-%dT%H:%M:%S").date() if time_published_elem else None

        tracks.append(
            Track(
                track_name=track_name,
                artists=artists, 
                genres=genres, 
                link=link, 
                date_published=date_published
            )
        )

    return tracks
