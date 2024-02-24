import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alert } from "../utils/alert";
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";
import { styles, toClassName } from "./styles";


const login = async (e, setIsLoading, email, password, setIsAuthenticated) => {
  e.preventDefault();
  setIsLoading(true);
  const resp = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({
      email: email,
      password: password
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Method": "Cookie",
    },
  })
  setIsLoading(false);
  if (resp.status !== 200) {
    alert.fire({title: "Unable to login", icon: "error"});
  } else {
    const data = await resp.json();
    const displayTestData = email === "test_user@test.com";
    localStorage.setItem("displayTestData", JSON.stringify(displayTestData));
    localStorage.setItem("name", data.name);
    setIsAuthenticated(true);
    alert.fire({title: `Welcome, ${data.name}!`, icon: "success"});
  };
}


export default function Login ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => login(e, setIsLoading, email, password, setIsAuthenticated);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const goToSignupPage = () => navigate("/signup");

  return (
    <>
    {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
    {!isLoading &&
      <div className={toClassName(styles.columns, styles.isCentered)}>
        <div className={toClassName(styles.column, styles.isOneThird)}>
          <div className={styles.box}>
            <h1 className={toClassName(styles.title, styles.hasTextCentered)}>Login</h1>
            <form onSubmit={handleLogin}>
              <label className={styles.label}>Email</label>
                <div className={styles.control}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="test_user@test.com ..."
                    value={email}
                    onChange={handleEmailChange}
                  />
                </div>
              <br />
              <label className={styles.label}>Password</label>
                <div className={styles.control}>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="testing123 ..."
                    value={password}
                    onChange={handlePasswordChange}
                  />
                </div>
              <br />
              <div className={styles.control}>
                <button 
                  type="submit"
                  className={toClassName(styles.button, styles.isPrimary, styles.isFullWidth)}
                >
                  Login
                </button>
              </div>
            </form>
            <hr />
            <form>
              <div className={styles.content}>  
                <p className={styles.hasTextCentered}>Or click here to sign up</p>
                <div className={styles.control}>
                  <button
                    type="submit"
                    className={toClassName(styles.button, styles.isPrimary, styles.isFullWidth)}
                    onClick={goToSignupPage}
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
    </>
  )
}
