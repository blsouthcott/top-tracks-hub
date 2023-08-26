# scrape-top-tracks
Provides tracks recommended tracks from music review sites such as Pitchfork and allows you to add them to your Spotify playlist. Also allows you to view your top tracks and artists.

## Demo
Click [here](https://youtu.be/DSUNz7GJ_nQa) to see a demo of this project!

# To run this locally
A .flaskenv file should be saved in the root directory with the following enviornment variables:
```
SPOTIFY_CLIENT_ID={get from your spotify developer dashboard}
SPOTIFY_CLIENT_SECRET={get from your spotify developer dashboard}
SPOTIFY_REDIRECT_URI={get from your spotify developer dashboard}

FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1

SECRET_KEY={change this}
JWT_SECRET_KEY={change this}

PORT=5000
```

If you change PORT you'll also need to change it in the client side code.

## Frontend
From the root directory run
```
cd ui
npm install
npm start
```

## Backend
From the root directory run
```
pyenv virtualenv install <python version> <virtual env name>
pyenv local <virtual env name>
pyenv activate <virtual env name>
cd server
pip install -r requirements.txt
flask run
```

# Dependency Documentation
tekore documentation @ https://tekore.readthedocs.io/en/stable/index.html

Spotify developer dashboard @ https://developer.spotify.com/dashboard/applications

Flask SQLAlchemy documentation: https://flask-sqlalchemy.palletsprojects.com/en/2.x/
