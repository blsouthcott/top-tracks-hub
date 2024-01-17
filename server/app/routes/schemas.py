from marshmallow import Schema, fields, validate

from ..utils.validator_utils import CommaDelimitedStringField


class SignupSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6, max=35))
    name = fields.Str(required=True)


class VerifyAccountSchema(Schema):
    verification_code = fields.Str(required=True, validate=validate.Length(equal=32), data_key="code")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class TracksSchema(Schema):
    song_id = fields.Str(data_key="song-id")
    site_name = fields.Str(data_key="site-name")
    song_name = fields.Str(data_key="song-name")
    artists = CommaDelimitedStringField()
    genres = CommaDelimitedStringField()
    limit = fields.Int()
    offset = fields.Int()


class SpotifyTrackIdSchema(Schema):
    song_id = fields.Str(required=True, data_key="song-id")
    spotify_track_id = fields.Str(required=True, data_key="spotify-track-id")


class PlaylistTracksSchema(Schema):
    spotify_track_ids = fields.List(fields.Str, required=True, data_key="spotify-track-ids")
    spotify_playlist_id = fields.Str(required=True, data_key="spotify-playlist-id")


class SearchSpotifyTracksSchema(Schema):
    song_name = fields.Str(required=True, data_key="song-name")
    artists = fields.Str(required=True)


class PitchforkTracksSchema(Schema):
    max_page_num = fields.Int(validate=validate.Range(min=1, max=257))


class PersonalizationSchema(Schema):
    personalization_type = fields.Str(
        required=True,
        validate=validate.OneOf(("tracks", "artists",)),
        data_key="personalization-type",
    )
    time_period = fields.Str(
        required=True,
        validate=validate.OneOf(("short_term", "medium_term", "long_term",)),
        data_key="time-period",
    )
