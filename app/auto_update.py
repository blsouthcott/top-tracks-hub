
from .models import db
from .scrape_top_tracks import get_pitchfork_top_tracks_html, parse_top_tracks_html
from .controller import save_new_track_to_db, get_song_by_name_and_artist
from .spotify import get_spotify_obj, search_spotify_track_id


def add_new_track():
    html = get_pitchfork_top_tracks_html()
    tracks = parse_top_tracks_html(html)
    if tracks:
        new_track = tracks[0]
        new_track_saved = save_new_track_to_db(new_track, "Pitchfork")
        if new_track_saved:
            spotify_obj = get_spotify_obj()
            track_id = search_spotify_track_id(spotify_obj, new_track)
            if not track_id:
                # TODO: send an automated email to me telling me I have to manually put in the track ID
                pass
            else:
                # TODO: update track ID in the database
                song = get_song_by_name_and_artist(new_track.track_name, new_track.artists[0])
                song.spotify_track_id = track_id
                db.session.commit()