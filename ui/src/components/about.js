import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { getAccessToken } from "./getAccessToken";

export default function About ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  useEffect(() => {
    getAccessToken(navigate, setIsAuthenticated, false);
  });
  return (
    <div className="section m-4">
      <h1 className="title">About Us</h1>
      <div className="content">
        <ul>
          <li>This site allows you to easily add tracks to your Spotify playlist which have been recommended by music review sites such as <Link to="https://pitchfork.com/" target="_blank">Pitchfork</Link>.</li>
          <li><Link to="https://www.flaticon.com/free-icons/playlist" target="_blank" title="playlist icons">Playlist icons created by Smashicons - Flaticon</Link></li>
        </ul>
      </div>
    </div>
  )
}
