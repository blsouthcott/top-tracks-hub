import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { styles, toClassName } from "./styles";
import HeroSection from "./heroSection";
import { api } from "../utils/api";

function PageContent () {
  return (
    <div className={toClassName(styles.section, styles.margins.m4)}>
      <h1 className={toClassName(styles.title)}>About Us</h1>
      <div className={styles.content}>
        <ul>
          <li>This site allows you to easily add tracks to your Spotify playlist which have been recommended by music review sites such as <Link to="https://pitchfork.com/" target="_blank">Pitchfork</Link>.</li>
          <li><Link to="https://www.flaticon.com/free-icons/playlist" target="_blank" title="playlist icons">Playlist icons created by Smashicons - Flaticon</Link></li>
        </ul>
      </div>
    </div>
  )
}

export default function About ({ setIsAuthenticated }) {
  useEffect(() => {
    api.checkToken(setIsAuthenticated);
  }, []);
  return (
    <HeroSection content={ <PageContent /> }/>
  )
}
