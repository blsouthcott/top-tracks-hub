import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { alert } from "../../utils/alert";
import { styles, toClassName } from "../../utils/styles";
import { api } from "../../utils/api";


const logout = async (navigate, setIsAuthenticated) => {
  const resp = await api.logout();
  if (resp.status === 200) {
    alert.fire({title: "You have been successfully logged out.", icon: "success"});
    localStorage.removeItem("displayTestData");
    setIsAuthenticated(false);
    navigate("/");
  } else {
    alert.fire("Something went wrong. Unable to log out 🙁");
  };
}

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [burgerIsActive, setBurgerIsActive] = useState(false);
  const defaultBurgerStyle = toClassName(styles.burgerMenu, styles.navbarBurger, styles.burger);
  const [burgerStyle, setBurgerStyle] = useState(defaultBurgerStyle);
  const defaultDropdownStyle = toClassName(styles.navbarItem, styles.hasDropdown);
  const [dropDownStyle, setDropdownStyle] = useState(defaultDropdownStyle);
  
  
  const toggleBurger = () => {
    setBurgerIsActive(prevActive => !prevActive);
  };

  const handleMouseOver = () => {
    setDropdownStyle(toClassName(defaultDropdownStyle, styles.isActive));
  }
  const handleMouseOut = () => {
    setDropdownStyle(defaultDropdownStyle);
  }

  useEffect(() => {
    setDropdownStyle(defaultDropdownStyle);
    setBurgerIsActive(false);
  }, [location])

  useEffect(() => {
    if (burgerIsActive) {
      setBurgerStyle(toClassName(defaultBurgerStyle, styles.isActive));
    } else {
      setBurgerStyle(defaultBurgerStyle);
    }
  }, [burgerIsActive])

  return (
    <nav 
      className={styles.navbar}
      role="navigation"
      aria-label="main navigation"
      style={{ position: "fixed", top: "0", width: "100%", zIndex: 2 }}>
      
      <div className={styles.navbarBrand}>
        <Link className={styles.navbarItem} to="/">
          <FontAwesomeIcon icon={faCirclePlay} />
        </Link>

        <button
          className={burgerStyle}
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
        className={styles.navbarMenu + `${burgerIsActive ? " " + styles.isActive : ""}`}
        style={{"zIndex": 2}}
      >
        <div className={styles.navbarStart}>
          <Link className={styles.navbarItem} to="/">
            Home
          </Link>
          
          {isAuthenticated &&
          <Link className={styles.navbarItem} to="/account">
            Account
          </Link>}

          {isAuthenticated && 
          <Link className={styles.navbarItem} to="/personalization">
            Your Top Spotify Content
          </Link>}

          {isAuthenticated && 
          <Link className={styles.navbarItem} to="/tracks">
            Recommended Tracks
          </Link>}
          <div
            className={dropDownStyle}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}>

              <Link className={styles.navbarLink} to="#">
                More
              </Link>

              <div className={styles.navbarDropdown}>
                <Link className={styles.navbarItem} to="/about">
                  About
                </Link>
                <Link className={styles.navbarItem} to="/contact">
                  Contact
                </Link>
                <Link className={styles.navbarItem} to="/report-an-issue">
                  Report an issue
                </Link>
              </div>
          </div>
        </div>

        <div className={styles.navbarEnd}>
          <div className={styles.navbarItem}>
            <div className={styles.buttons}>
              {!isAuthenticated && 
                <Link className={toClassName(styles.button, styles.isPrimary)} to="/signup">
                  <strong>Sign up</strong>
                </Link>}
              {isAuthenticated ?
                <button className={toClassName(styles.button, styles.isLight)} onClick={() => logout(navigate, setIsAuthenticated)}>
                  Log out
                </button>
                :
                <Link className={toClassName(styles.button, styles.isLight)} to="/">
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