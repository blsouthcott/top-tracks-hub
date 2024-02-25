import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../common/HeroSection";
import { styles, toClassName } from "../../utils/styles";
import { api } from "../../utils/api";


export default function Contact ({ setIsAuthenticated }) {
  useEffect(() => {
    api.checkToken(setIsAuthenticated);
  }, []);
  return (
    <HeroSection content={
      <div className={toClassName(styles.section, styles.margins.m4)}>
        <h1 className={styles.title}>
          Contact Us
        </h1>
        <p>If you have any questions or feedback, please reach out to: <strong>contact.top.tracks@gmail.com</strong></p>
        <p>If you'd like to check out the source code for this project, it's available here: <Link to="https://github.com/blsouthcott/scrape-top-tracks" target="_blank">GitHub</Link>.</p>
      </div>}
    />
  )
}
