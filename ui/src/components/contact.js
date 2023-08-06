import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "./getAccessToken";
import Footer from "./footer";

export default function Contact ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  useEffect(() => {
    getAccessToken(navigate, setIsAuthenticated, false);
  });
  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          <div className="section m-4">
            <h1 className="title">
              Contact Us
            </h1>
            <p>If you have any questions or feedback, please reach out to: <strong>contact.top.tracks@gmail.com</strong></p>
            <p>If you'd like to check out the source code for this project, it's available here: <Link to="https://github.com/blsouthcott/scrape-top-tracks" target="_blank">GitHub</Link>.</p>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  )
}
