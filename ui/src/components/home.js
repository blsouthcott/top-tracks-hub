import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./login";
import { getAccessToken } from "../utils/accessToken";
import { alert } from "./alert";
import Footer from "./footer";
import { accountIsAuthorized } from "../utils/accountAuth";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {

  const navigate = useNavigate();
  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(false);
  
  const authorizeAccount = async (e) => {
    e.preventDefault();
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch("/api/authorize", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    })
    if (resp.status !== 307) {
      alert.fire("Unable to authorize account");
      return;
    }
    const respData = await resp.json();
    window.open(respData.redirect_url);
    alert.fire("Please refresh the page to update your account authorization status.");
  }

  const unauthorizeAccount = async (e) => {
    e.preventDefault();
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch("/api/unauthorize", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    })
    if (resp.status === 200) {
      alert.fire("Your Spotify account has been removed");
      setSpotifyAccountIsAuthorized(false);
      return;
    }
    alert.fire("There was a problem removing your Spotify Account")
  }

  const goToTracks = async (e) => {
    e.preventDefault();
    navigate("/tracks");
  }

  const setSpotifyAccountAuthorizationStatus = async () => {
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    if (accessToken) {
      const authorized = await accountIsAuthorized(accessToken);
      setSpotifyAccountIsAuthorized(authorized);
    };
  }

  useEffect(() => {
    setSpotifyAccountAuthorizationStatus();
  }, [isAuthenticated])

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          {!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> :
          <div className="columns is-centered">
            <div className="column is-one-third">
              <div className="box">
                  <h2 className="title has-text-centered">Welcome!</h2>
                  {!spotifyAccountIsAuthorized &&
                  <div className="block has-text-centered">
                    <p>Click here to authorize your Spotify account.</p>
                    <div className="is-flex is-justify-content-center">  
                      <button className="button is-primary m-2" onClick={authorizeAccount}>Authorize</button>
                    </div>
                  </div>}
                  <div className="block has-text-centered">
                    <p>Click here to view all tracks recommended by Pitchfork and add them to your Spotify playlist.&nbsp;</p>
                    <div className="is-flex is-justify-content-center">
                      <button className="button is-primary m-2" onClick={goToTracks}>View Tracks</button>
                    </div>
                  </div>
                  {spotifyAccountIsAuthorized &&
                  <div className="block has-text-centered">
                    <p>Click here to remove your Spotify account authorization.&nbsp;</p>
                    <div className="is-flex is-justify-content-center">
                      <button className="button is-primary m-2" onClick={unauthorizeAccount}>Unauthorize</button>
                    </div>
                  </div>} 
              </div>
            </div>
          </div>}
        </div>
      </div>
      <Footer />
    </section>
  )
}
