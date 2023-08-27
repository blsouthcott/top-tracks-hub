import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./footer";
import { checkValidToken } from "../utils/api";

export default function Contact ({ setIsAuthenticated }) {
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
