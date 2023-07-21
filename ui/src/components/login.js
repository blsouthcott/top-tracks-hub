import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../config";

export default function Login ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async (e) => {
    e.preventDefault();
    const resp = await fetch(`${backendUrl}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (resp.status !== 200) {
      window.alert("unable to login");
    } else {
      const respData = await resp.json();
      const jwt = respData.access_token;
      const expiration = respData.expiration;
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("accessTokenExpiration", expiration);
      setIsAuthenticated(true);
    };
  }

  const goToSignupPage = () => {
    navigate("/signup");
  }

  return (
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
                  placeholder="Enter username..."
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
                  placeholder="Enter password..."
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
                    className="button is-primary is-outlined is-fullwidth"
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
