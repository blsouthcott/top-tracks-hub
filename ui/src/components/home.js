import React, { useEffect } from "react";
import HeroSection from "./heroSection";
import { styles, toClassName } from "./styles";
import { useNavigate } from "react-router-dom";
import Login from "./login";
import { alert } from "../utils/alert";
import { api } from "../utils/api";


const goToTracks = async (e, navigate) => {
  e.preventDefault();
  navigate("/tracks");
}

const welcomeHtml = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
    <p>After signing up, add tracks to your Spotify Playlists from the Recommended Tracks page and view your Top Artists and Tracks on the Your Top Spotify Content page!</p>
    <hr />
    <p>If you'd like to check out the app's features without signing up, please use the following credentials to sign in:</p>
    <p style="background-color: #e6e6e6; padding: 10px; border-radius: 3px;">
      <span style="font-weight: bold;">Username:</span> test_user@test.com<br />
      <span style="font-weight: bold;">Password:</span> testing123
    </p>
  </div>`


const displayWelcomeMsg = () => {
  const welcomeMsgDisplayed = JSON.parse(localStorage.getItem("welcomeMsgDisplayed"));
  const now = new Date().getTime();
  const twoWeeks = 2 * 7 * 24 * 60 * 60 * 1000;
  if (!welcomeMsgDisplayed || welcomeMsgDisplayed.timestamp < now - twoWeeks ) {
    alert.fire({
      title: "Welcome to Music Recommendations Playlist Manager!",
      html: welcomeHtml,
      icon: "info",
    });
    localStorage.setItem("welcomeMsgDisplayed", JSON.stringify({timestamp: now}));
  };
}


export default function Home ({ isAuthenticated, setIsAuthenticated }) {

  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  useEffect(() => {
    api.setNavigator(navigate);
  }, [navigate])
  
  useEffect(() => {
    api.checkToken(setIsAuthenticated);
    displayWelcomeMsg();
  }, [])

  return (
    <HeroSection content={
      <>
        {!isAuthenticated && <Login setIsAuthenticated={setIsAuthenticated} />}
        {isAuthenticated &&
        <div className={toClassName(styles.columns, styles.isCentered)}>
          <div className={toClassName(styles.column, styles.isOneThird)}>
            <div className={styles.box}>
                <h2 className={toClassName(styles.title, styles.hasTextCentered)}>{`Welcome, ${name}!`}</h2>
                <hr />
                <div className={toClassName(styles.block, styles.hasTextCentered)}>
                  <p>Click below to view all tracks available to add to your Spotify playlist.&nbsp;</p>
                  <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
                    <button className={toClassName(styles.button, styles.isPrimary, styles.margins.m2)} onClick={(e) => goToTracks(e, navigate)}>View Tracks</button>
                  </div>
                </div>
            </div>
          </div>
        </div>}
      </>}
    />
  )
}
