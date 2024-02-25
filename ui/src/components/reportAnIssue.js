import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { styles, toClassName } from "./styles";
import { api } from "../utils/api";
import HeroSection from "./heroSection";

export default function ReportAnIssue ({ setIsAuthenticated }) {
  useEffect(() => {
    api.checkToken(setIsAuthenticated);
  }, []);
  return (
    <HeroSection content={
      <div className={toClassName(styles.section, styles.margins.m4)}>
        <h1 className={styles.title}>
          Report an Issue
        </h1>
        <p>To report an issue, please create a new issue here: <Link to="https://github.com/blsouthcott/scrape-top-tracks/issues" target="_blank">GitHub Issues</Link>.</p>
      </div>
    }/>
          
  )
}
