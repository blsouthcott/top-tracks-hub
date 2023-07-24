import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { alert } from "./alert";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const verifyAccount = async (e) => {
    e.preventDefault();
    const resp = await fetch("/api/verify-account", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        verification_code: verificationCode,
      })
    });

    if (resp.status === 200) {
      console.log("account verification successful...");
      const respData = await resp.json();
      const jwt = respData.access_token;
      const expiration = respData.expiration;
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("accessTokenExpiration", expiration);
      alert.fire("Account verification successful!");
      navigate("/");
    } else {
      const errMsg = await resp.text();
      alert.fire(errMsg);
    };
  };

  useEffect(() => {
    if(!location.state?.email) {
      alert.fire("We were unable to determine the email used to sign up");
      navigate("/");
    } else {
      setEmail(location.state.email);
    };
  }, [])

  return (
    <div className="columns is-flex-direction-column is-align-items-center">
      <div className="column is-half">
        <div className="box">
          <h2 className="title">Verify Account</h2>
          <form onSubmit={verifyAccount}>
            <div className="field is-fullwidth">
              <label className="label">Email</label>
              <div className="control">
                <input
                  className="input"
                  type="email"
                  value={email}
                  disabled
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field is-fullwidth">
              <label className="label">Verification Code</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="control">
              <button type="submit" className="button is-primary is-fullwidth">Verify</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
