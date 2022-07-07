
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
db = SQLAlchemy()


track_artists_table = db.Table("track_artists_table",
                               db.Column("song_id", db.String(80), db.ForeignKey("song.id")),
                               db.Column("artist_name", db.String(80), db.ForeignKey("artist.name")))

track_genres_table = db.Table("track_genres_table",
                              db.Column("song_id", db.String(80), db.ForeignKey("song.id")),
                              db.Column("genre_name", db.String(80), db.ForeignKey("genre.name")))

sites_table = db.Table("sites_table",
                       db.Column("song_id", db.String(80), db.ForeignKey("song.id")),
                       db.Column("site_name", db.String(80), db.ForeignKey("site.name")))


class User(UserMixin, db.Model):
    email = db.Column(db.String(120), primary_key=True)
    playlist_id = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120))
    name = db.Column(db.String(100))

    def get_id(self):
        return self.email


class Artist(db.Model):
    name = db.Column(db.String(80), primary_key=True)


class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    artists = db.relationship("Artist", secondary=track_artists_table, lazy="subquery", backref="song")
                              #backref=db.backref("tracks", lazy=True))
    genres = db.relationship("Genre", secondary=track_genres_table, lazy="subquery", backref="song")
                             #backref=db.backref("tracks", lazy=True))
    site_name = db.Column(db.String(80), db.ForeignKey("site.name"), nullable=False)


class Genre(db.Model):
    name = db.Column(db.String(80), primary_key=True)


class Site(db.Model):
    name = db.Column(db.String(80), primary_key=True)
    songs = db.relationship("Song", backref="site", lazy=True)
