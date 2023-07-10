# scrape-top-tracks
Scrapes recommended tracks from music review sites, currently just Pitchfork, and adds them to your Spotify playlist. 

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
NAMESPACE=local

SECRET_KEY={change this}
JWT_SECRET_KEY={change this}

PORT=5000
```

If you change PORT you'll also need to change it in the client side code.