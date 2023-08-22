import * as SecureStorage from "expo-secure-store";

const authedFetch = async (url, baseUrl, options={}) => {
  const accessToken = await SecureStorage.getItemAsync("accessToken");
  let resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }
  })
  if (resp.status === 401) {
    const refreshToken = await SecureStorage.getItemAsync("refreshToken");
    resp = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      }
    })
    if (resp.status === 200) {
      data = await resp.json();
      const newAccessToken  = data.accessToken;
      await SecureStorage.setItemAsync("accessToken", newAccessToken);
      authedFetch(url, baseUrl, newAccessToken, options);
    } else {
      // go to login screen somehow
    };
  } else {
    return resp;
  };
}


export const login = async (email, password, baseUrl="") => {
  const resp = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    body: JSON.stringify({
      email: email,
      password: password
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
  return resp;
}

export const spotifyAccountIsAuthorized = async (baseUrl="") => {
  const resp = await authedFetch(`${baseUrl}/api/account-is-authorized`, baseUrl);
  if (resp.status !== 200) {
    return false;
  }
  const data = await resp.json();
  if (!data.authorized) {
    return false;
  } else {
    return true;
  };
}

export const authorizeAccount = async (baseUrl="") => {
  const resp = await authedFetch(`${baseUrl}/api/authorize`, baseUrl, {
    method: "POST",
  });
  if (resp.status !== 307) {
    return undefined;
  }
  const data = await resp.json();
  return data.redirect_url;
}

export const unauthorizeSpotifyAccount = async (baseUrl="") => {
  const resp = await authedFetch(`${baseUrl}/api/unauthorize`, baseUrl, {
    method: "POST",
  });
  if (resp.status === 200) {
    return true;
  };
  return false;
}

export const signup = async (email, password, name, baseUrl="") => {
  const resp = await fetch(`${baseUrl}/api/signup`, {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      name: name,
      password: password,
    })
  });
  return resp;
};
