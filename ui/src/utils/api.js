import { alert } from "./alert";

const authedFetch = async (url, options={}) => {
  let resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    }
  });
  if (resp.status === 401) {
    resp = await fetch("/api/refresh", {
      method: "POST",
      headers: {
        "X-Auth-Method": "Cookie",
        "Content-Type": "application/json",
      }
    })
    if (resp.status === 200) {
      return await authedFetch(url, options);
    } else {
      return resp;
    };
  } else {
    return resp;
  };
}

export const checkValidToken = async (navigate) => {
  const resp = await tokenIsValid();
  if (resp.status === 401) {
    if (navigate) {
      alert.fire({title: "Your current login session has expired", icon: "warning"});
      navigate("/");
    };
  } else if (resp.status !== 200) {
    if (navigate) {
     alert.fire({title: "Unable to check token validity. Please try signing out and singning again.", icon: "warning"});
      navigate("/");
    };
  } else {
    return true;
  };
}

export const tokenIsValid = async () => {
  const resp = await authedFetch("/api/token-is-valid");
  return resp;
}

export const accountIsAuthorized = async () => {
  const resp = await authedFetch("/api/account-is-authorized");
  return resp;
}

export const authorizeAccount = async () => {
  const resp = await authedFetch("/api/authorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const unauthorizeAccount = async () => {
  const resp = await fetch("/api/unauthorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const getUserTopContent = async (timePeriod, personalizationType) => {
  const resp = await authedFetch(`/api/personalization?time-period=${timePeriod}&personalization-type=${personalizationType}`, {
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const searchTrack = async (track) => {
  const resp = await authedFetch(`/api/spotify-tracks?song-name=${track.name}&artists=${track.artists.join(", ")}`, );
  return resp;
}

export const addTrackId = async (trackId, spotifyTrackId) => {
  const resp = await authedFetch("/api/spotify-track-id", {
    method: "PATCH",
    body: JSON.stringify({
      "song-id": trackId,
      "spotify-track-id": spotifyTrackId
    }),
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const loadPlaylists = async () => {
  const resp = await authedFetch("/api/playlists", {
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const addTracksToPlaylist = async (selectedTrackIds, selectedPlaylistId) => {
  const resp = await authedFetch("/api/playlist-tracks", {
    method: "POST",
    body: JSON.stringify({
      "spotify-track-ids": selectedTrackIds,
      "spotify-playlist-id": selectedPlaylistId,
    }),
    headers: {
      "Content-Type": "application/json",
    }
  })
  return resp;
}