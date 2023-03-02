import React from "react";
import { useNavigate } from "react-router-dom";
import Login from "./login";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();

  const authorizeAccount = async (e) => {
    e.preventDefault();
  }

  const goToTracks = async (e) => {
    e.preventDefault();
    navigate("/tracks");
  }

  return (
    <>
      {!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> :
      <div className="columns is-centered">
        <div className="column is-one-third">
          <div className="box">
              <h2 className="title">Welcome!</h2>
              <div className="block">
                <form onSubmit={authorizeAccount}>
                  <label className="label">
                    Cick here to authorize your Spotify account.&nbsp;
                    <br />
                    <button 
                      type="submit"
                      className="button is-primary is-outlined"
                    >
                      Authorize
                    </button>
                  </label>
                </form>
              </div>
              <div className="block">
                <form onSubmit={goToTracks}>
                  <label className="label">
                    Click here to view all Pitchfork-recommended tracks and add them to your Spotify playlist.&nbsp;
                    <br />
                    <button 
                      type="submit"
                      className="button is-primary"
                    >
                      View Tracks
                    </button>
                  </label>
                </form>
              </div>
          </div>
        </div>
      </div>}
    </>
  )
}
