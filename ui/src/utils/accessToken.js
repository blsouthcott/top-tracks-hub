import { alert } from "../components/alert";

export const getAccessToken = (navigate, setIsAuthenticated, redirect=true) => {
  // returns the access token from local storage only if it has not yet expired
  const accessToken = localStorage.getItem("accessToken");
  let expiration = localStorage.getItem("accessTokenExpiration");
  if (!accessToken || !expiration) {
    setIsAuthenticated(false);
    redirect && navigate("/");
    return;
  };
  expiration = new Date(parseFloat(expiration));
  const currentTime = new Date();
  if (currentTime > expiration) {
    localStorage.clear();
    alert.fire("Your current login session has expired.");
    setIsAuthenticated(false);
    redirect && navigate("/");
    return;
  };
  setIsAuthenticated(true);
  return accessToken;
}
