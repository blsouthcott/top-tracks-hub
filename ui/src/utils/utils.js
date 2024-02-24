import { checkValidToken } from "./api";

export const checkToken = async (setIsAuthenticated, navigate) => {
  const validToken = await checkValidToken();
  if (validToken) {
    setIsAuthenticated(true);
  } else {
    setIsAuthenticated(false);
    if (navigate) {
      navigate("/");
    };
  };
}
