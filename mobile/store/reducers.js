const initialState = {
  isAuthenticated: false,
  name: "",
  spotifyAccountIsAuthorized: false,
  alertMsg: undefined,
  authRedirectUrl: "",
  redirectTo: undefined,
  isLoading: false,
  error: undefined,
}

export const reducer = (state=initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case "SET_USER_IS_AUTHENTICATED":
      return {
        ...state,
        isAuthenticated: payload.isAuthenticated,
        spotifyAccountIsAuthorized: payload.spotifyAccountIsAuthorized,
      }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: payload.isAuthenticated,
        spotifyAccountIsAuthorized: payload.spotifyAccountIsAuthorized,
        name: payload.name,
        alertMsg: `Welcome ${payload.name}!`,
      }
    case "LOGIN_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        alertMsg: "Unable to login",
      }
    case "REFRESH_TOKEN_EXPIRED":
      return {
        ...state,
        error: "Your current login session has expired",
        redirectTo: "Home",
      }
    case "SPOTIFY_ACCOUNT_AUTHORIZED":
      return {
        ...state,
        spotifyAccountIsAuthorized: payload.isAuthorized,
      }
    case "ACCOUNT_AUTHORIZATION_REDIRECT_SUCCESS":
      return {
        ...state,
        authRedirectUrl: redirectUrl,
      }
      case "ACCOUNT_AUTHORIZATION_REDIRECT_FAILURE":
        return {
          ...state,
          alertMsg: "There was a problem authorizing your account."
        }
      case "SPOTIFY_ACCOUNT_REMOVED_SUCCESS":
        return {
          ...state,
          alertMsg: "Your Spotify account has been removed",
          spotifyAccountIsAuthorized: false,
        }
      case "SPOTIFY_ACCOUNT_REMOVED_FAILURE":
        return {
          ...state,
          alertMsg: "There was a problem removing your Spotify Account",
        }
      case "SIGNUP_SUCCESS":
        return {
          ...state,
          alertMsg: "Please check your email for a link to verify your account. This verification link is only good for 24 hours.",
          redirectTo: "Home",
        }
      case "SIGNUP_FAILURE":
        if (payload.redirectTo) {
          return {
            ...state,
            alertMsg: payload.msg,
            redirectTo: payload.redirectTo,
          }
        };
        return {
          ...state,
          alertMsg: payload.msg,
        }
      case "SET_IS_LOADING":
        return {
          ...state,
          isLoading: payload.isLoading,
        }
      case "ERROR":
        return {
          ...state,
          error: payload.msg,
        }
    default:
      return state;
  }
}