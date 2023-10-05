import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./login";
import { alert } from "../utils/alert";
import Footer from "./footer";
import * as api from "../utils/api";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {

  const navigate = useNavigate();
  
  const goToTracks = async (e) => {
    e.preventDefault();
    navigate("/tracks");
  }

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
        html: "<p>Spotify's policy currently requires user accounts to be authorized prior to completing the sign up process on this site. If you'd like to sign up, please reach out to contact.top.tracks@gmail.com with your Spotify email address.</p><br /><p>Otherwise, if you'd like to check out the app's features without signing up, please use the following credentials to sign in:</p><p>username: test_user@test.com<br />password: testing123</p><br /><p>Thanks for your understanding!</p>",
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
                  <div className="block has-text-centered">
                    <p>Click here to view all tracks available to add to your Spotify playlist.&nbsp;</p>
                    <div className="is-flex is-justify-content-center">
                      <button className="button is-primary m-2" onClick={goToTracks}>View Tracks</button>
                    </div>
                  </div>
              </div>
            </div>
          </div>}
        </div>
      </div>
      <Footer />
    </section>
  )
}
