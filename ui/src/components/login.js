import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alert } from "./alert";
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";


export default function Login ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = async (e) => {
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
      },
    })
    setIsLoading(false);
    if (resp.status !== 200) {
      alert.fire("Unable to login");
    } else {
      const respData = await resp.json();
      const jwt = respData.access_token;
      const expiration = respData.expiration;
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("accessTokenExpiration", expiration);
      const displayTestData = email === "test_user@test.com";
      localStorage.setItem("displayTestData", JSON.stringify(displayTestData));
      setIsAuthenticated(true);
      alert.fire(`Welcome, ${respData.name}!`);
    };
  }

  const goToSignupPage = () => {
    navigate("/signup");
  }

  return (
    isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
    <div className="columns is-centered">
      <div className="column is-one-third">
        <div className="box">
          <h1 className="title has-text-centered">Login</h1>
          <form onSubmit={login}>
            <label className="label">Email</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="test_user@test.com ..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            
            <br />
            <label className="label">Password</label>
              <div className="control">
                <input
                  className="input"
                  type="password"
                  placeholder="testing123 ..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            <br />
            <div className="control">
              <button 
                type="submit"
                className="button is-primary is-fullwidth"
              >
                Login
              </button>
            </div>
          </form>
          <div className="section p-5">
            <form>
              <div className="content">  
                <p className="has-text-centered">Or click here to sign up</p>
                <div className="control">
                  <button
                    type="submit"
                    className="button is-primary is-fullwidth"
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
    </div>
  )
}
