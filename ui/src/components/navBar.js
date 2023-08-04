import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [dropDownIsOpen, setDropDownIsOpen] = useState(false);

  const toggleBurger = () => {
    setIsActive(!isActive);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accessTokenExpiration");
    setIsAuthenticated(false);
    navigate("/");
  }

  const handleMouseOver = () => setDropDownIsOpen(true);
  const handleMouseOut = () => setDropDownIsOpen(false);

  useEffect(() => {
    setDropDownIsOpen(false);
  }, [location])

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link className="navbar-item" to="/">
          <FontAwesomeIcon icon={faCirclePlay} />        
        </Link>

        <button
          className={`navbar-burger burger ${isActive ? 'is-active' : ''}`}
          aria-label="menu"
          aria-expanded="false"
          data-target="navbar"
          onClick={toggleBurger}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      <div
        id="navbar"
        className={`navbar-menu ${isActive ? 'is-active' : ''}`}
      >
        <div className="navbar-start">
          <Link className="navbar-item" to="/">
            Home
          </Link>

          {isAuthenticated && 
          <Link className="navbar-item" to="/personalization">
            Your Top Spotify Content
          </Link>}

          {isAuthenticated && 
          <Link className="navbar-item" to="/tracks">
            Pitchfork Tracks
          </Link>}

          <div className={`navbar-item has-dropdown ${dropDownIsOpen ? "is-active" : ""}`}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}>
            <Link className="navbar-link" to="#">
              More
            </Link>

            <div className="navbar-dropdown">
              <Link className="navbar-item" to="/contact">
                Contact
              </Link>
              <Link className="navbar-item" to="/report-an-issue">
                Report an issue
              </Link>
              <Link className="navbar-item" to="/about">
                About
              </Link>
            </div>
          </div>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              {!isAuthenticated && 
                <Link className="button is-primary" to="/signup">
                  <strong>Sign up</strong>
                </Link>}
              {isAuthenticated ?
                <button className="button is-light" onClick={logout}>
                  Log out
                </button>
                :
                <Link className="button is-light" to="/">
                  Log in
                </Link>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}