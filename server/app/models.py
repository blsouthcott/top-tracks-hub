from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


track_artists_table = db.Table(
    "track_artists_table",
    db.Column("song_id", db.Integer, db.ForeignKey("song.id")),
    db.Column("artist_name", db.String(80), db.ForeignKey("artist.name")),
)

track_genres_table = db.Table(
    "track_genres_table",
    db.Column("song_id", db.Integer, db.ForeignKey("song.id")),
    db.Column("genre_name", db.String(80), db.ForeignKey("genre.name")),
)

sites_table = db.Table(
    "sites_table",
    db.Column("song_id", db.Integer, db.ForeignKey("song.id")),
    db.Column("site_name", db.String(80), db.ForeignKey("site.name")),
)


class Auth(db.Model):
    __tablename__ = "auths"
    state = db.Column(db.String(80), primary_key=True)
    email = db.Column(db.String(120), nullable=False)


class AccountVerification(db.Model):
    __tablename__ = "account_verification"
    email = db.Column(db.String(120), primary_key=True)
    verification_code = db.Column(db.String, nullable=False)
    expires = db.Column(db.Float, nullable=False)
    user_obj = db.Column(db.LargeBinary, nullable=False)


class User(UserMixin, db.Model):
    email = db.Column(db.String(120), primary_key=True)
    playlist_id = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120))
    name = db.Column(db.String(100))
    config_file = db.Column(db.LargeBinary)

    def get_id(self):
        return self.email


class Artist(db.Model):
    name = db.Column(db.String(80), primary_key=True)


class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    artists = db.relationship(
        "Artist", secondary=track_artists_table, lazy="subquery", backref="song"
    )
    genres = db.relationship(
        "Genre", secondary=track_genres_table, lazy="subquery", backref="song"
    )
    site_name = db.Column(db.String(80), db.ForeignKey("site.name"), nullable=False)
    link = db.Column(db.String(80))
    date_published = db.Column(db.Date)
    spotify_track_id = db.Column(db.String(100))
    preview_url = db.Column(db.String)


class Genre(db.Model):
    name = db.Column(db.String(80), primary_key=True)


class Site(db.Model):
    name = db.Column(db.String(80), primary_key=True)
    songs = db.relationship("Song", backref="site", lazy=True)
