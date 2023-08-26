# scrape-top-tracks
Provides tracks recommended by music review sites such as Pitchfork and allows you to add them to your Spotify playlist. Also allows you to view your top tracks and artists.

## Visit the app [here](https://top-tracks-a3b9b29d489d.herokuapp.com/)!

If you'd rather not sign up but still want to see the app's functionality, you can log in with the following credentials:

email: test_user@test.com  
password: testing123

# Run locally
## Environment configuration
A .flaskenv file should be saved in the `server/` directory with the following enviornment variables:
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

## Install the dependencies
From the `server/` directory run
```
poetry env use {a version of python3.11}
poetry install --no-root
poetry shell
```

## Start the backend
After installing the dependencies, from the `server/` directory run
```
flask run --port=5001
```

If you change the port you'll also need to change the proxy in the client side code.

## Frontend
From the root directory run
```
cd ui
npm install
npm start
```

# Dependency Documentation
tekore - https://tekore.readthedocs.io/en/stable/index.html  
Spotify developer dashboard - https://developer.spotify.com/dashboard/applications  
Flask SQLAlchemy - https://flask-sqlalchemy.palletsprojects.com/en/2.x/
