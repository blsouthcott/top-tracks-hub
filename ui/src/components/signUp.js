import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import HeroSection from "./heroSection";


const signup = async (e, setIsLoading, navigate, email, password, name) => {
  e.preventDefault();
  setIsLoading(true);
  const resp = await fetch("/api/signup", {
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
    alert.fire("Please check your email for a link to verify your account. This verification link is only good for 24 hours.");
    navigate('/');
  } else if (resp.status === 409) {
    alert.fire("Email already exists in the database. Please choose a different email and try again.");
  } else {
    alert.fire("Unable to complete sign up 🙁");
    navigate("/");
  }
};

export default function Signup () {
  
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e) => signup(e, setIsLoading, navigate, email, password, name);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleNameChange = (e) => setName(e.target.value);

  return (
    <HeroSection content={
      <>
        {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
        {!isLoading &&
          <div className="columns is-flex-direction-column is-align-items-center">
            <div className="column is-one-third">
              <div className="box">
                <h2 className="title has-text-centered">Sign up</h2>
                <form onSubmit={handleSignup}>
                  <div className="field is-fullwidth">
                    <label className="label">Email</label>
                    <div className="control">
                      <input
                        className="input"
                        type="email"
                        value={email}
                        placeholder="Enter email..."
                        onChange={handleEmailChange}
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
                        onChange={handlePasswordChange}
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
                        onChange={handleNameChange}
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
          </div>
        }
      </>}
    />
  );
}
