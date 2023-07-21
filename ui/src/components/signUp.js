import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../config"
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";

export default function Signup () {
  
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const resp = await fetch(`${backendUrl}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        name: name,
        password: password,
      })
    });
    setIsLoading(false);
    if (resp.status === 200) {
      navigate('/verify-account', { state: { email: email } });
    } else {
      window.alert("Unable to complete sign up");
      navigate("/");
    }
  };

  return (
    <>
      {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
      <div className="columns is-flex-direction-column is-align-items-center">
        <div className="column is-one-third">
          <div className="box">
            <h2 className="title has-text-centered">Sign up</h2>
            <form onSubmit={signup}>
              <div className="field is-fullwidth">
                <label className="label">Email</label>
                <div className="control">
                  <input
                    className="input"
                    type="email"
                    value={email}
                    placeholder="Enter email..."
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field is-fullwidth">
                <label className="label">Password</label>
                <div className="control">
                  <input
                    className="input"
                    type="password"
                    value={password}
                    placeholder="Enter password..."
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field is-fullwidth">
                <label className="label">Name</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    value={name}
                    placeholder="Enter name..."
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="control">
                <button type="submit" className="button is-primary is-fullwidth">Sign up</button>
              </div>
            </form>
          </div>
        </div>
      </div>}
    </>
  );
}
