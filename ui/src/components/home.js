import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./login";
import { url } from "../constants/backend_url";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(false);

  const authorizeAccount = async (e) => {
    e.preventDefault();
    const access_token = localStorage.getItem("access_token");
    const resp = await fetch(`${url}/authorize`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      }
    })
    if (resp.status !== 307) {
      window.alert("unable to authorize account");
      return;
    }
    const respData = await resp.json();
    window.open(respData.redirect_url);
  }

  const unauthorizeAccount = async (e) => {
    e.preventDefault();
    const access_token = localStorage.getItem("access_token");
    const resp = await fetch(`${url}/unauthorize`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      }
    })
    if (resp.status === 200) {
      window.alert("Your Spotify account has been removed");
      setSpotifyAccountIsAuthorized(false);
      return;
    }
    window.alert("There was a problem removing your Spotify Account")
  }

  const getSpotifyAccountAuthorizationStatus = async () => {
    const access_token = localStorage.getItem("access_token");
    const resp = await fetch(`${url}/account-is-authorized`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
      }
    })
    const respData = await resp.json();
    if (!respData.authorized) {
      setSpotifyAccountIsAuthorized(false);
    } else {
      setSpotifyAccountIsAuthorized(true);
    };
  }

  const goToTracks = async (e) => {
    e.preventDefault();
    navigate("/tracks");
  }

  useEffect(() => {
    if (isAuthenticated) {
      getSpotifyAccountAuthorizationStatus();
    };
  }, [isAuthenticated])

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    };
  }, [])

  return (
    <>
      {!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> :
      <div className="columns is-centered">
        <div className="column is-one-third">
          <div className="box">
              <h2 className="title">Welcome!</h2>
              {!spotifyAccountIsAuthorized &&
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
              </div>}
              <div className="block">
                <form onSubmit={goToTracks}>
                  <label className="label">
                    Click here to view all Pitchfork-recommended tracks and add them to your Spotify playlist.&nbsp;
                    <br />
                    <button 
                      type="submit"
                      className="button is-primary is-outlined"
                    >
                      View Tracks
                    </button>
                  </label>
                </form>
              </div>
              {spotifyAccountIsAuthorized &&
              <div className="block">
                <form onSubmit={unauthorizeAccount}>
                  <label className="label">
                    Cick here to remove your Spotify account authorization.&nbsp;
                    <br />
                    <button 
                      type="submit"
                      className="button is-primary is-outlined"
                    >
                      Unauthorize
                    </button>
                  </label>
                </form>
              </div>}
          </div>
        </div>
      </div>}
    </>
  )
}
