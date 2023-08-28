import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alert } from "../utils/alert";
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
