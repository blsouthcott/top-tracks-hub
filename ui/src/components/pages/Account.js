import React, { useState, useEffect } from "react";
import HeroSection from "../common/HeroSection";
import { api } from "../../utils/api";
import { alert } from "../../utils/alert";
import { styles, toClassName } from "../../utils/styles";

const authorizeAccount = async () => {
  const resp = await api.authorizeAccount();
  if (resp.status !== 307) {
    alert.fire({title: "Unable to authorize account", icon: "error"});
    return;
  };
  const data = await resp.json();
  window.open(data.redirect_url);
  alert.fire("Please refresh the page to update your account authorization status.");
}

const unauthorizeAccount = async (setSpotifyAccountIsAuthorized) => {
  const res = await alert.fire({
    title: "Are you sure you want to unauthorize your Spotify account?",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Yes",
    denyButtonText: "No"
  });
  if (res.isConfirmed) {
    const resp = await api.unauthorizeAccount();
    if (resp.status === 200) {
      alert.fire({title: "Your Spotify account has been removed. Please refresh the page.", icon: "success"});
      setSpotifyAccountIsAuthorized(false);
    } else {
      alert.fire({title: "There was a problem removing your Spotify Account", icon: "error"});
    };
  };
}

const setSpotifyAccountAuthorizationStatus = async (setSpotifyAccountIsAuthorized) => {
  const resp = await api.accountIsAuthorized();
  let authorized;
  if (resp.status !== 200) {
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

function AccountPageContent ({ spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized }) {
  const handleUnauthorizeAccount = () => unauthorizeAccount(setSpotifyAccountIsAuthorized);
  return (
    <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter, styles.margins.my3)}>
      <div className={styles.card}>
        <div className={styles.cardContent}>
          {spotifyAccountIsAuthorized &&
            <>
              <p className={toClassName(styles.margins.mb0, styles.hasTextCentered)}>Your Spotify account is currently authorized.</p>
              <p className={styles.hasTextCentered}>If you would like to remove this authorization, please click here.&nbsp;</p>
              <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
                <button className={toClassName(styles.button, styles.isPrimary, styles.margins.m2)} onClick={handleUnauthorizeAccount}>Unauthorize</button>
              </div>
            </>}
          {!spotifyAccountIsAuthorized &&
            <>
              <p className={toClassName(styles.margins.mb0, styles.hasTextCentered)}>Your Spotify account is not currently authorized.</p>
              <p className={styles.hasTextCentered}>Please click here to authorize your Spotify account.</p>
              <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
                <button className={toClassName(styles.button, styles.isPrimary, styles.margins.m2)} onClick={authorizeAccount}>Authorize</button>
              </div>
            </>}
        </div>
      </div>
    </div>
  )
}

export default function Account ({ isAuthenticated, setIsAuthenticated }) {

  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      setSpotifyAccountAuthorizationStatus(setSpotifyAccountIsAuthorized);
    };
  }, [isAuthenticated])

  useEffect(() => {
    api.checkToken(setIsAuthenticated, true);
  }, [])

  return (
    <HeroSection 
      content={ 
        <AccountPageContent
          spotifyAccountIsAuthorized={spotifyAccountIsAuthorized} 
          setSpotifyAccountIsAuthorized={setSpotifyAccountIsAuthorized} 
        /> 
      }
      containerStyle={toClassName(styles.isFlex, styles.isFlexDirectionColumn, styles.isAlignContentCenter)} 
    />
  )
}
