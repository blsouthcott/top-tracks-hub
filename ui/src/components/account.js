import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../utils/api";
import { alert } from "../utils/alert";
import Footer from "./footer";

export default function Account ({ isAuthenticated, setIsAuthenticated }) {

  const navigate = useNavigate();
  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(true);

  const authorizeAccount = async () => {
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

  const unauthorizeAccount = async () => {
    const resp = await api.unauthorizeAccount();
    if (resp.status === 401) {
      alert.fire({title: "Your current login session has expired", icon: "warning"});
      navigate("/");
    } else if (resp.status === 200) {
      alert.fire({title: "Your Spotify account has been removed. Please refresh the page.", icon: "success"});
      setSpotifyAccountIsAuthorized(false);
      return;
    }
    alert.fire({title: "There was a problem removing your Spotify Account", icon: "error"});
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
        navigate("/");
      };
    });
  }, [])

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container is-flex is-flex-direction-column is-align-content-center">
          <div className="is-flex is-justify-content-center my-3">
            <div className="card">
              <div className="card-content">
                {spotifyAccountIsAuthorized &&
                <>
                  <p className="mb-0 has-text-centered">Your Spotify account is currently authorized.</p>
                  <p className="has-text-centered">If you would like to remove this authorization, please click here.&nbsp;</p>
                  <div className="is-flex is-justify-content-center">
                    <button className="button is-primary m-2" onClick={unauthorizeAccount}>Unauthorize</button>
                  </div>
                </>}
                {!spotifyAccountIsAuthorized &&
                <>
                  <p className="mb-0 has-text-centered">Your Spotify account is not currently authorized.</p>
                  <p className="has-text-centered">Please click here to authorize your Spotify account.</p>
                  <div className="is-flex is-justify-content-center">
                    <button className="button is-primary m-2" onClick={authorizeAccount}>Authorize</button>
                  </div>
                </>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  )
}