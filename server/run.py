import os

from app.app import app
from app import api

PORT = int(os.environ["PORT"])

if __name__ == "__main__":
    app.run(port=PORT)
