import React from "react";
import { Link } from "react-router-dom";

export default function About () {
  return (
    <div className="section">
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