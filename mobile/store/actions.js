import * as SecureStorage from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseUrl } from "../config";
import * as api from "../utils/api";

export const checkUserIsAuthenticated = () => {
  return async function (dispatch) {
    dispatch(setIsLoading(true));
    const refreshToken = await SecureStorage.getItemAsync("refreshToken");
    if (refreshToken) {
      const isAuthorized = await api.spotifyAccountIsAuthorized(baseUrl);
      dispatch(setUserIsAuthenticated(true, isAuthorized));
    } else {
      dispatch(setUserIsAuthenticated(false));
    }
    dispatch(setIsLoading(false));
  }
}

const setUserIsAuthenticated = (isAuthenticated, spotifyAccountIsAuthorized=false) => {
  return {
    type: "SET_USER_IS_AUTHENTICATED",
    payload: {
      isAuthenticated: isAuthenticated,
      spotifyAccountIsAuthorized: spotifyAccountIsAuthorized,
    }
  }
}

export const login = (email, password) => {
  return async function (dispatch) {
    dispatch(setIsLoading(true));
    const resp = await api.login(email, password, baseUrl);
    if (resp.status !== 200) {
      dispatch(loginFailure());
    } else {
      const data = await resp.json();
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      await SecureStorage.setItemAsync("accessToken", accessToken);
      await SecureStorage.setItemAsync("refreshToken", refreshToken);
      const name = data.name;
      await AsyncStorage.setItem("name", name);
      const isAuthorized = await api.spotifyAccountIsAuthorized(baseUrl);
      dispatch(loginSuccess(name, isAuthorized));
    };
    dispatch(setIsLoading(false));
  }
}

const loginSuccess = (name, accountIsAuthorized) => {
  return {
    type: "LOGIN_SUCCESS",
    payload: {
      isAuthenticated: true,
      spotifyAccountIsAuthorized: accountIsAuthorized,
      name: name,
    }
  }
}

const loginFailure = () => {
  return {
    type: "LOGIN_FAILURE",
    payload: {
      isAuthenticated: false,
    }
  }
} 

export const checkSpotifyAccountAuthorization = () => {
  return async function (dispatch) {
    const accountIsAuthorized = api.spotifyAccountIsAuthorized(baseUrl);
    dispatch(spotifyAccountAuthorized(accountIsAuthorized));
  }
}

const spotifyAccountAuthorized = (isAuthorized) => {
  return {
    type: "SPOTIFY_ACCOUNT_AUTHORIZED",
    payload: {
      spotifyAccountIsAuthorized: isAuthorized,
    }
  }
}

export const authorizeSpotifyAccount = () => {
  return async function (dispatch) {
    const redirectUrl = await api.authorizeAccount(baseUrl);
    if (redirectUrl) {
      dispatch(accountAuthorizationRedirectSuccess(redirectUrl));
    } else {
      dispatch(accountAuthorizationRedirectFailure());
    }
  }
}

const accountAuthorizationRedirectSuccess = (redirectUrl) => {
  return {
    type: "ACCOUNT_AUTHORIZATION_REDIRECT_SUCCESS",
    payload: {
      redirectUrl: redirectUrl
    }
  }
}

const accountAuthorizationRedirectFailure = () => {
  return {
    type: "ACCOUNT_AUTHORIZATION_REDIRECT_FAILURE",
    payload: {}
  }
}

export const unauthorizeSpotifyAccount = () => {
  return async function (dispatch) {
    const accountRemoved = await api.unauthorizeSpotifyAccount(baseUrl);
    accountRemoved ? dispatch(spotifyAccountRemovedSuccess()) : dispatch(spotifyAccountRemovedFailure);
  }
}

const spotifyAccountRemovedSuccess = () => {
  return {
    type: "SPOTIFY_ACCOUNT_REMOVED_SUCCESS",
  }
}

const spotifyAccountRemovedFailure = () => {
  return {
    type: "SPOTIFY_ACCOUNT_REMOVED_FAILURE",
  }
}

const signup = (email, password, name) => {
  return async function () {
    dispatch(setIsLoading(true));
    const resp = await api.signup(email, password, name, baseUrl);
    dispatch(setIsLoading(false));
    if (resp.status === 200) {
      dispatch(signupSuccess());
    } else if (resp.status === 409) {
      dispatch(signupFailure("Email already exists in the database. Please choose a different email and try again."));
    } else {
      dispatch(signupFailure("Unable to complete sign up 🙁", "Home"));
    };
  }
}

const signupSuccess = () => {
  return {
    type: "SIGNUP_SUCCESS",
  }
}

const signupFailure = (msg, redirectTo="") => {
  return {
    type: "SIGNUP_FAILURE",
    payload: {
      msg: msg,
    }
  }
}


const setIsLoading = (isLoading) => {
  return {
    type: "SET_IS_LOADING",
    payload: {
      isLoading: isLoading
    }
  }
}