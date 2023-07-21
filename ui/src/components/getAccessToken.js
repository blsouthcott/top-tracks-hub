
export const getAccessToken = (navigate, setIsAuthenticated) => {
  // returns the access token from local storage only if it has not yet expired
  const accessToken = localStorage.getItem("accessToken");
  let expiration = localStorage.getItem("accessTokenExpiration");
  if (!accessToken || !expiration) {
    setIsAuthenticated(false);
    navigate("/");
    return;
  };
  expiration = new Date(parseFloat(expiration));
  const currentTime = new Date();
  if (currentTime > expiration) {
    localStorage.clear();
    window.alert("Your current login session has expired.");
    setIsAuthenticated(false);
    navigate("/");
    return;
  };
  setIsAuthenticated(true);
  return accessToken;
}
