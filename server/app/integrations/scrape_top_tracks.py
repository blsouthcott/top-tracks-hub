import re
from dataclasses import dataclass
from datetime import datetime, date

import requests
from bs4 import BeautifulSoup as bs
from sqlalchemy import func

from ..models import db, Artist, Genre, Song, Site


TOP_TRACKS_URL = "https://pitchfork.com/reviews/best/tracks/"

QUOTES_CHARS = (
    34,
    39,
    8216,
    8217,
    8219,
    8220,
    8221,
)

REMOVE_QUOTES_DICT = {c: None for c in QUOTES_CHARS}


@dataclass
class Track:
    """
    Represents a track scraped from a music review website

    Attributes:
        artists (list): List of artists associated with the track
        track_name (str): The name of the track
        genres (list): List of genres associated with the track
        link (str): The link to the track
        date_published (date): The date when the track was published
    """
    artists: list
    track_name: str
    genres: list
    link: str
    date_published: date

    def to_song(self, site):
        """
        Converts the Track object to a Song object

        Args:
            site (str): The name of the site to associate with the Song

        Returns:
            Song: The converted Song object
        """
        song_artists = [Artist.query.get(artist) for artist in self.artists]
        song_genres = [Genre.query.get(genre) for genre in self.genres]
        max_id = db.session.query(func.max(Song.id)).scalar()
        return Song(
            id=max_id + 1,
            name=self.track_name,
            artists=song_artists,
            genres=song_genres,
            site=Site.query.get(site),
            link=self.link,
            date_published=self.date_published,
        )


def rm_quotes(text: str) -> str:
    """
    Removes quotes, including non-ascii quotes from the given text
    """
    return text.translate(REMOVE_QUOTES_DICT)


def rm_feat_artist(track_name: str) -> str:
    """
    Uses a regex to remove the featured artist from the track name
    """
    return re.sub(r"(\[|\(+)(feat|ft|featuring)(.*)", "", track_name)


def sanitize_track_name(track_name: str) -> str:
    """
    Removes quotes, the featured artist, and trailing whitespace from the track name

    Args:
        track_name (str): name of the track

    Returns:
        str: the sanitized track name
    """
    return rm_feat_artist(rm_quotes(track_name)).strip()


def get_pitchfork_top_tracks_html(page: int) -> bytes | None:
    """
    Retrieves the HTML from Pitchfork

    Args:
        page (int): the page number of the HTML (1-indexed)
    
    Returns:
        bytes | None: the content of the response if successful, None otherwise
    """
    resp = requests.get(f"{TOP_TRACKS_URL}?page={page}")
    return resp.content if resp.status_code == 200 else None


def parse_top_tracks_html(html: str) -> list[Track]:
    """
    Parses the HTML and returns a list of Track objects

    Args:
        html (str): The HTML to be parsed

    Returns:
        list[Track]: A list of Track objects parsed from the HTML
    """
    soup = bs(html, "html.parser")
    tracks = []

    track_elems = soup.select("div.track-hero, div.track-collection-item")
    for track_elem in track_elems:
        title_elem = track_elem.select_one("h2.track-collection-item__title, h2.title")
        track_name = sanitize_track_name(title_elem.text) if title_elem else None

        artist_elems = track_elem.select("ul.artist-list li")
        artists = sorted([artist_elem.text for artist_elem in artist_elems])

        genre_elems = track_elem.select("li.genre-list__item a")
        genres = [genre_elem.text for genre_elem in genre_elems]

        link_elem = track_elem.select_one("a.track-collection-item__track-link, a.artwork")
        link = link_elem["href"] if link_elem else None

        time_published_elem = track_elem.select("time.pub-date")
        date_published = (
            datetime.strptime(time_published_elem[0]["datetime"], "%Y-%m-%dT%H:%M:%S").date()
            if time_published_elem
            else None
        )

        tracks.append(
            Track(
                track_name=track_name,
                artists=artists,
                genres=genres,
                link=link,
                date_published=date_published,
            )
        )

    return tracks
