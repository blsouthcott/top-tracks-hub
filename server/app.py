import os

from app.app import app

PORT = int(os.environ["PORT"])

if __name__ == "__main__":
    app.run(port=PORT)
