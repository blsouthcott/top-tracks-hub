import os
from flask import send_from_directory
from flask_restful import Api
from app.app import create_app
from app.utils.logging_utils import logger
from app.routes.user_routes import (
    Signup,
    VerifyAccount,
    Login,
    TokenIsValid,
    RefreshToken,
    Logout
)
from app.routes.auth_routes import (
    AuthorizeAccount,
    Unauthorize,
    AccountIsAuthorized,
    AuthCallback,
)
from app.routes.tracks_routes import (
    Tracks,
    Playlists,
    PlaylistTracks,
    SearchSpotifyTracks,
    SpotifyTrackId,
    PitchforkTracks,
    Personalization,
)

PORT = int(os.environ["PORT"])

app = create_app()
api = Api(app)

api.add_resource(Signup, "/api/signup")
api.add_resource(VerifyAccount, "/api/verify-account")
api.add_resource(Login, "/api/login")
api.add_resource(TokenIsValid, "/api/token-is-valid")
api.add_resource(RefreshToken, "/api/refresh")
api.add_resource(Logout, "/api/logout")
api.add_resource(AuthorizeAccount, "/api/authorize")
api.add_resource(Unauthorize, "/api/unauthorize")
api.add_resource(AccountIsAuthorized, "/api/account-is-authorized")
api.add_resource(AuthCallback, "/api/callback")
api.add_resource(Tracks, "/api/tracks")
api.add_resource(Playlists, "/api/playlists")
api.add_resource(PlaylistTracks, "/api/playlist-tracks")
api.add_resource(SearchSpotifyTracks, "/api/spotify-tracks")
api.add_resource(SpotifyTrackId, "/api/spotify-track-id")
api.add_resource(PitchforkTracks, "/api/pitchfork-tracks")
api.add_resource(Personalization, "/api/personalization")


# these routes serve the React frontend
@app.route("/")
def serve():
    logger.info("Serving React app...")
    index_file_path = os.path.join(app.static_folder, "index.html")
    logger.info(f"Trying to serve {index_file_path}")
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def static_proxy(path):
    logger.info(f"handling request for /{path}...")
    if os.path.exists(f"{app.static_folder}/{path}"):
        return app.send_static_file(path)
    else:
        return serve()


if __name__ == "__main__":
    app.run(port=PORT)
