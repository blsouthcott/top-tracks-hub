import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alert } from "../utils/alert";
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";
import { styles, toClassName } from "./styles";
import { Field, SubmitButton } from "./formComponents";
import { api } from "../utils/api";


const login = async (e, setIsLoading, email, password, setIsAuthenticated) => {
  e.preventDefault();
  setIsLoading(true);
  const resp = await api.login(email, password);
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
              <Field labelName={"Email"} fieldType={"text"} fieldVal={email} placeholderText={"test_user@test.com ..."} onChange={handleEmailChange} requiredField={true} />
              <Field labelName={"Password"} fieldType={"password"} fieldVal={password} placeholderText={"testing123 ..."} onChange={handlePasswordChange} requiredField={true} />
              <SubmitButton title={"Login"} />
            </form>
            <hr />
            <div className={styles.content}>  
              <p className={styles.hasTextCentered}>Or click here to sign up</p>
              <div className={styles.control}>
                <button onClick={goToSignupPage} className={toClassName(styles.button, styles.isPrimary, styles.isFullWidth)}>
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
    </>
  )
}
