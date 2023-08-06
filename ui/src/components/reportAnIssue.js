import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../utils/accessToken";
import Footer from "./footer";

export default function ReportAnIssue ({ setIsAuthenticated }) {
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
