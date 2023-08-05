# custom startup script for heroku
#!/bin/sh
cd server && gunicorn run:app
