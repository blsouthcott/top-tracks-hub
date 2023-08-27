import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./footer";
import { checkValidToken } from "../utils/api";

export default function About ({ setIsAuthenticated }) {
  useEffect(() => {
    checkValidToken().then(isValid => {
      if (isValid) {
        setIsAuthenticated(isValid);
      };
    })
  }, []);
  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          <div className="section m-4">
            <h1 className="title">About Us</h1>
            <div className="content">
              <ul>
                <li>This site allows you to easily add tracks to your Spotify playlist which have been recommended by music review sites such as <Link to="https://pitchfork.com/" target="_blank">Pitchfork</Link>.</li>
                <li><Link to="https://www.flaticon.com/free-icons/playlist" target="_blank" title="playlist icons">Playlist icons created by Smashicons - Flaticon</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  )
}
