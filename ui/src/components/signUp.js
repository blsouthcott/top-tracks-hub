import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import HeroSection from "./heroSection";
import { styles, toClassName } from "./styles";
import { Field, SubmitButton } from "./formComponents";
import { api } from "../utils/api";

const signup = async (e, setIsLoading, navigate, email, password, name) => {
  e.preventDefault();
  setIsLoading(true);
  const resp = api.signup(email, password, name);
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
          <div className={toClassName(styles.columns, styles.isFlexDirectionColumn, styles.isAlignItemsCenter)}>
            <div className={toClassName(styles.column, styles.isOneThird)}>
              <div className={styles.box}>
                <h2 className={toClassName(styles.title, styles.hasTextCentered)}>Sign up</h2>
                <form onSubmit={handleSignup}>
                  <Field labelName={"Email"} fieldType={"email"} fieldVal={email} placeholderText={"Enter email..."} onChange={handleEmailChange} requiredField={true} />
                  <Field labelName={"Password"} fieldType={"password"} fieldVal={password} placeholderText={"Enter password..."} onChange={handlePasswordChange} requiredField={true} />
                  <Field labelName={"Name"} fieldType={"text"} fieldVal={name} placeholderText={"Enter name..."} onChange={handleNameChange} requiredField={true} />
                  <hr />
                  <SubmitButton title={"Sign up"} />
                </form>
              </div>
            </div>
          </div>
        }
      </>}
    />
  );
}
