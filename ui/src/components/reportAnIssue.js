import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "./getAccessToken";

export default function ReportAnIssue ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  useEffect(() => {
    getAccessToken(navigate, setIsAuthenticated);
  });
  return (
    <div className="section">
      <h1 className="title">
        Report an Issue
      </h1>
      <p>To report an issue please create a new issue here <Link to="https://github.com/blsouthcott/scrape-top-tracks/issues" target="_blank">GitHub Issues</Link>.</p>
    </div>
  )
}
