import React, { useState, useEffect } from "react";
import HeroSection from "../common/HeroSection";
import { api } from "../../utils/api";
import { alert } from "../../utils/alert";
import { styles, toClassName } from "../../utils/styles";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "../../utils/spinnerStyle";
import { useWindowWidth } from "../../utils/windowSize";

const authorizeAccount = async (setIsLoading) => {
  setIsLoading(true);
  const resp = await api.authorizeAccount();
  if (resp.status !== 307) {
    alert.fire({title: "Unable to authorize account", icon: "error"});
    return;
  };
  const data = await resp.json();
  window.open(data.redirect_url);
  setIsLoading(false);
  alert.fire("Please refresh the page to update your account authorization status.");
}

const unauthorizeAccount = async (setIsLoading, setSpotifyAccountIsAuthorized) => {
  const res = await alert.fire({
    title: "Are you sure you want to unauthorize your Spotify account?",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Yes",
    denyButtonText: "No"
  });
  if (res.isConfirmed) {
    setIsLoading(true);
    const resp = await api.unauthorizeAccount();
    if (resp.status === 200) {
      alert.fire({title: "Your Spotify account has been removed. Please refresh the page.", icon: "success"});
      setSpotifyAccountIsAuthorized(false);
    } else {
      alert.fire({title: "There was a problem removing your Spotify Account", icon: "error"});
    };
    setIsLoading(false);
  };
}

const setSpotifyAccountAuthorizationStatus = async (setIsLoading, setSpotifyAccountIsAuthorized) => {
  setIsLoading(true);
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
  setIsLoading(false);
};

function AccountPageContent ({ isLoading, setIsLoading, spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized }) {
  const isMobile = useWindowWidth();
  const handleUnauthorizeAccount = () => unauthorizeAccount(setIsLoading, setSpotifyAccountIsAuthorized);
  const handleAuthorizeAccount = () => authorizeAccount(setIsLoading);
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  return (
    <>
      {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
      {!isLoading &&
        <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter, styles.margins.my3)}>
          <div className={styles.card}>
            <div className={toClassName(styles.cardHeader, styles.isPrimary)}>
              <h2 className={toClassName(styles.cardHeaderTitle, styles.sizes.isSize4)}>{name}</h2>
            </div>
            <div className={styles.cardContent}>
              <p><b>Email:</b> {email}</p>
              <hr />
              {spotifyAccountIsAuthorized &&
                <>
                  <p className={toClassName(styles.margins.mb0)}>Your Spotify account is currently authorized.</p>
                  <p className={toClassName(styles.margins.mb0)}>If you would like to remove this authorization, please click the button below.&nbsp;</p>
                  <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
                    <button className={toClassName(styles.button, styles.isWarning, styles.isFullWidth, styles.margins.mt4)} onClick={handleUnauthorizeAccount}>Unauthorize</button>
                  </div>
                </>}
              {!spotifyAccountIsAuthorized &&
                <>
                  <p className={toClassName(styles.margins.mb0, styles.hasTextCentered)}>Your Spotify account is not currently authorized.</p>
                  <p className={styles.hasTextCentered}>Please click here to authorize your Spotify account.</p>
                  <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
                    <button className={toClassName(styles.button, styles.isPrimary, styles.isFullWidth, styles.margins.mt4)} onClick={handleAuthorizeAccount}>Authorize</button>
                  </div>
                </>}
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default function Account ({ isAuthenticated, setIsAuthenticated }) {

  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setSpotifyAccountAuthorizationStatus(setSpotifyAccountIsAuthorized);
    };
  }, [isAuthenticated])

  useEffect(() => {
    api.checkToken(setIsAuthenticated, true).then(() => setIsLoading(false));
  }, [])

  return (
      
        <HeroSection 
          content={ 
            <AccountPageContent
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              spotifyAccountIsAuthorized={spotifyAccountIsAuthorized} 
              setSpotifyAccountIsAuthorized={setSpotifyAccountIsAuthorized} 
            /> 
          }
          containerStyle={toClassName(styles.isFlex, styles.isFlexDirectionColumn, styles.isAlignContentCenter)} 
        />
  )
}
