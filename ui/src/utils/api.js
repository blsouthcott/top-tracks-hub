import { alert } from "./alert";

const authedFetch = async (url, navigate, options={}) => {
  let resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    }
  })
  if (resp.status === 401) {
    resp = await fetch(`/api/refresh`, {
      method: "POST",
      headers: {
        "X-Auth-Method": "Cookie",
        "Content-Type": "application/json",
      }
    })
    if (resp.status === 200) {
      const data = await resp.json();
      authedFetch(url, options);
    } else {
      if (navigate) {
        alert.fire({title: "Your current login session has expired", icon: "warning"});
        navigate("/");
      };
      return resp;
    };
  } else {
    return resp;
  };
}

export const tokenIsValid = async (navigate) => {
  const resp = await authedFetch("/api/token-is-valid", navigate);
  if (resp.status === 200) {
    return true;
  };
  return false;
}

export const accountIsAuthorized = async (navigate) => {
  const resp = await authedFetch("/api/account-is-authorized", navigate);
  const data = await resp.json();
  if (!data.authorized) {
    return false;
  } else {
    return true;
  };
}

export const authorizeAccount = async (navigate) => {
  const resp = await authedFetch("/api/authorize", navigate, {
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

export const getUserTopContent = async (navigate, timePeriod, personalizationType) => {
  const resp = await authedFetch(`/api/personalization?time-period=${timePeriod}&personalization-type=${personalizationType}`, navigate, {
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const searchTrack = async (navigate, track) => {
  const resp = await authedFetch(`/api/spotify-tracks?song-name=${track.name}&artists=${track.artists.join(", ")}`, navigate);
  return resp;
}

export const addTrackId = async (navigate, trackId, spotifyTrackId) => {
  const resp = await authedFetch("/api/spotify-track-id", navigate, {
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

export const loadPlaylists = async (navigate) => {
  const resp = await authedFetch("/api/playlists", navigate, {
    headers: {
      "Content-Type": "application/json",
    }
  });
  return resp;
}

export const addTracksToPlaylist = async (navigate, selectedTrackIds, selectedPlaylistId) => {
  const resp = await authedFetch("/api/playlist-tracks", navigate, {
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