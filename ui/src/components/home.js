import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./login";
import { alert } from "../utils/alert";
import Footer from "./footer";
import * as api from "../utils/api";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {

  const navigate = useNavigate();
  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(false);
  
  const authorizeAccount = async (e) => {
    e.preventDefault();
    const resp = await api.authorizeAccount();
    if (resp.status === 401) {
      alert.fire({title: "Your current login session has expired", icon: "warning"});
      navigate("/");
    } else if (resp.status !== 307) {
      alert.fire({title: "Unable to authorize account", icon: "error"});
      return;
    };
    const data = await resp.json();
    window.open(data.redirect_url);
    alert.fire("Please refresh the page to update your account authorization status.");
  }

  const unauthorizeAccount = async (e) => {
    e.preventDefault();
    const resp = await api.unauthorizeAccount();
    if (resp.status === 401) {
      alert.fire({title: "Your current login session has expired", icon: "warning"});
      navigate("/");
    } else if (resp.status === 200) {
      alert.fire({title: "Your Spotify account has been removed", icon: "success"});
      setSpotifyAccountIsAuthorized(false);
      return;
    }
    alert.fire({title: "There was a problem removing your Spotify Account", icon: "error"});
  }

  const goToTracks = async (e) => {
    e.preventDefault();
    navigate("/tracks");
  }

  const setSpotifyAccountAuthorizationStatus = async () => {
    const resp = await api.accountIsAuthorized();
    let authorized;
    if (resp.status === 401) {
      alert.fire({title: "Your current login session has expired", icon: "warning"});
      navigate("/");
      return;
    } else if (resp.status !== 200) {
      alert.fire({title: "Unable to obtain Spotify account authorization status", icon: "warning"});
      authorized = false;
    } else {
      const data = await resp.json();
      if (!data.authorized) {
        authorized = false;
      } else {
        authorized = true;
      };
    };
    setSpotifyAccountIsAuthorized(authorized);
  };

  useEffect(() => {
    if (isAuthenticated) {
      setSpotifyAccountAuthorizationStatus();
    };
  }, [isAuthenticated])

  useEffect(() => {
    api.checkValidToken().then(isValid => {
      if (isValid) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      };
    });
    const welcomeMsgDisplayed = JSON.parse(localStorage.getItem("welcomeMsgDisplayed"));
    const now = new Date().getTime();
    const twoWeeks = 2 * 7 * 24 * 60 * 60 * 1000;
    if (!welcomeMsgDisplayed || welcomeMsgDisplayed.timestamp < now - twoWeeks ) {
      alert.fire({
        title: "Welcome to Music Recommendations Playlist Manager!",
        html: "<p>If you'd like to checkout the app's features without signing up, feel free to use the following credentials to sign in:</p><p>username: test_user@test.com<br />password: testing123</p>",
        icon: "info",
      });
      localStorage.setItem("welcomeMsgDisplayed", JSON.stringify({timestamp: now}));
    };
  }, [])

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
                    <p>Click here to view all tracks available to add to your Spotify playlist.&nbsp;</p>
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
