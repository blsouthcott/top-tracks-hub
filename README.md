# top-tracks-hub
Discover new music effortlessly with Music Recommendations Playlist Manager. This application curates song recommendations from reputable music review sites and integrates seamlessly with your Spotify playlist.

## Visit the app [here](https://top-tracks-a3b9b29d489d.herokuapp.com/)!

If you'd rather not sign up but still want to see the app's functionality, you can log in with the following credentials:

email: test_user@test.com  
password: testing123

# Features
- Curated Song Recommendations
- Spotify Playlist Integration
- View Your most listened to Tracks and Artists
- User-friendly Interface

# Installation

## Prerequisites
- Node.js
- Python 3.11
- [Poetry](https://python-poetry.org) (the requirements.txt file is for Heroku deployments)

## Steps
1. Clone the repository
```
git clone https://github.com/blsouthcott/scrape-top-tracks.git
```

2. Navigate to the `server` directory
```
cd server
```

3. Run
```
poetry env use 3.11.x
```

4. Navigate to the `ui` directory
```
poetry install --no-root
```

5. Navigate to the `ui` directory
```
cd ../ui
```

6. Install frontend dependencies
```
npm install
```

7. **See below to configure your environment before continuing on and starting the application**

8. Start the backend
```
poetry shell && flask run --port=5001
```

9. Start the frontend
```
npm start
```

## Environment configuration
A .flaskenv file should be saved in the `server/` directory with the following environment variables:
```
SPOTIFY_CLIENT_ID={get from your spotify developer dashboard}
SPOTIFY_CLIENT_SECRET={get from your spotify developer dashboard}
SPOTIFY_REDIRECT_URI={get from your spotify developer dashboard}

FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1

JWT_COOKIE_SECURE=false (should be true in production)
JWT_COOKIE_CSRF_PROTECT=false (should be true in production)
JWT_SECRET_KEY={change this}

SECRET_KEY={change this}

POSTGRES_CONNECTION_STRING={set up your own postgres database or some other database and put the connection string here}

PORT=5001

MAIL_USERNAME={user for email where you'll send sign up verifications}
MAIL_PASSWORD={password for the account}

ALLOWED_ORIGINS={the URL the frontend will run on}
```

# Usage
1. Open the application in your web browser at http://localhost:3000
2. Create an account and login.
3. Authorize your Spotify account.
4. Browse curated song recommendations.
5. Add songs directly to your Spotify playlist.

# Dependency Documentation
tekore - https://tekore.readthedocs.io/en/stable/index.html  
Spotify developer dashboard - https://developer.spotify.com/dashboard/applications  
Flask SQLAlchemy - https://flask-sqlalchemy.palletsprojects.com/en/2.x/
