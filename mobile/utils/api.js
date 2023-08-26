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
    };
  };
  return resp;
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
  return resp;
}

export const authorizeAccount = async (baseUrl="") => {
  const resp = await authedFetch(`${baseUrl}/api/authorize`, baseUrl, {
    method: "POST",
  });
  return resp;
}

export const unauthorizeSpotifyAccount = async (baseUrl="") => {
  const resp = await authedFetch(`${baseUrl}/api/unauthorize`, baseUrl, {
    method: "POST",
  });
  return resp;
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
