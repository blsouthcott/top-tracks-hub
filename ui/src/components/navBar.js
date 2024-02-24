import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { alert } from "../utils/alert";

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [burgerIsActive, setBurgerIsActive] = useState(false);
  const [dropDownIsOpen, setDropDownIsOpen] = useState(false);


  const toggleBurger = () => {
    setBurgerIsActive(!burgerIsActive);
  };

  const logout = async () => {
    const resp = await fetch("/api/logout", {method: "POST"});
    if (resp.status === 200) {
      alert.fire({title: "You have been successfully logged out.", icon: "success"});
      localStorage.removeItem("displayTestData");
      setIsAuthenticated(false);
      navigate("/");
    } else {
      alert.fire("Something went wrong. Unable to log out 🙁");
    };
  }

  const handleMouseOver = () => setDropDownIsOpen(true);
  const handleMouseOut = () => setDropDownIsOpen(false);

  useEffect(() => {
    setDropDownIsOpen(false);
    setBurgerIsActive(false);
  }, [location])

  return (
    <nav 
      className="navbar" 
      role="navigation" 
      aria-label="main navigation"
      style={{ position: 'fixed', top: '0', width: '100%', zIndex: 2 }}>
      
      <div className="navbar-brand">
        <Link className="navbar-item" to="/">
          <FontAwesomeIcon icon={faCirclePlay} />
        </Link>

        <button
          className={`burger-menu navbar-burger burger ${burgerIsActive ? 'is-active' : ''}`}
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
        className={`navbar-menu ${burgerIsActive ? 'is-active' : ''}`}
        style={{"zIndex": 2}}
      >
        <div className="navbar-start">
          <Link className="navbar-item" to="/">
            Home
          </Link>
          
          {isAuthenticated &&
          <Link className="navbar-item" to="/account">
            Account
          </Link>}

          {isAuthenticated && 
          <Link className="navbar-item" to="/personalization">
            Your Top Spotify Content
          </Link>}

          {isAuthenticated && 
          <Link className="navbar-item" to="/tracks">
            Recommended Tracks
          </Link>}

          <div className={`navbar-item has-dropdown ${dropDownIsOpen ? "is-active" : ""}`}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}>
            <Link className="navbar-link" to="#">
              More
            </Link>

            <div className="navbar-dropdown">
              <Link className="navbar-item" to="/about">
                About
              </Link>
              <Link className="navbar-item" to="/contact">
                Contact
              </Link>
              <Link className="navbar-item" to="/report-an-issue">
                Report an issue
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