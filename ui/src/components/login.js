import React, { useState } from "react";
import { backendUrl } from "../config";

export default function Login ({ setIsAuthenticated }) {
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
      localStorage.setItem("access_token", jwt);
      setIsAuthenticated(true);
    };
  }

  const signUp = async (e) => {
    e.preventDefault();
  }

  return (
    <div className="columns is-centered">
      <div className="column is-one-third">
        <div className="box">
          <h1 className="title has-text-centered">Login</h1>
          <form onSubmit={login}>
            <label className="label">
              Email
              <br />
              <input
                className="input"
                type="text"
                placeholder="Enter username..."
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
            <br />
            <label className="label">
              Password
              <br />
              <input
                className="input"
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </label>
            <br />
            <button 
              type="submit"
              className="button is-primary is-fullwidth"
            >
              Login
            </button>
          </form>
          <div className="section p-5">
          <form>
            
              <div className="content">  
                <p className="has-text-centered">Or click here to sign up</p>
                <button
                  type="submit"
                  className="button is-primary is-outlined is-fullwidth"
                  onClick={signUp}
                >
                  Sign up
                </button>
              </div>
            
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}
