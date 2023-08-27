import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./footer";
import { checkValidToken } from "../utils/api";

export default function ReportAnIssue ({ setIsAuthenticated }) {
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
              Report an Issue
            </h1>
            <p>To report an issue, please create a new issue here: <Link to="https://github.com/blsouthcott/scrape-top-tracks/issues" target="_blank">GitHub Issues</Link>.</p>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  )
}
