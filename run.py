import os

from dotenv import load_dotenv

from app.app import app
from app import views

load_dotenv()


PORT = int(os.environ["PORT"])


if __name__ == "__main__":
    app.run(port=PORT)
