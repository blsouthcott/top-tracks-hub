import React, { useState } from "react";
import { useNavigate } from "react-router-dom"

export default function Login ({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    // do some stuff here to authenticate
    setIsAuthenticated(true);
  }

  return (
    <div className="columns is-centered">
      <div className="column is-one-third">
        <div className="box">
          <h1 className="title has-text-centered">Login</h1>
          <form onSubmit={login}>
            <label className="label">
              Username
              <br />
              <input
                className="input"
                type="text"
                placeholder="Enter username..."
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </label>
            <br />
            <label className="label">
              Password
              <br />
              <input
                className="input"
                type="text"
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
        </div>
      </div>
    </div>
  )
}
