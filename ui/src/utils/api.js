import { alert } from "./alert";


class Api {
  constructor () {
    if (Api.instance instanceof Api) {
      return Api.instance;
    }

    this.instance = this;
    this.navigate = null;
    this.postOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    }
  }

  setNavigator (navigate) {
    this.navigate = navigate;
  }

  async authedFetch (url, options={}) {
    let resp = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      }
    });
    if (resp.status === 401) {
      resp = await this.refreshToken();
      if (resp.status === 401) {
        alert.fire({title: "Your current login session has expired", icon: "warning"});
        this.navigate("/");
      } else {
        return await this.authedFetch(url, options);
      };
    } else {
      return resp;
    };
  }

  async refreshToken () {
    return await fetch("/api/refresh", {
      ...this.postOptions,
      headers: {
        "X-Auth-Method": "Cookie",
        ...this.postOptions.headers
      }
    })
  }

  async checkToken (setIsAuthenticated, redirect) {
    let resp = await this.tokenIsValid();
    if (resp.status === 200) {
      setIsAuthenticated(true);
      return;
    } else if (resp.status === 401) {
      resp = await this.refreshToken();
      if (resp.status === 200) {
        setIsAuthenticated(true);
        return;
      }
    }
    setIsAuthenticated(false);
    if (redirect) {
      alert.fire({title: "Invalid token. Please try signing in again.", icon: "warning"});
      this.navigate("/");
    };
  }

  async tokenIsValid () {
    return await fetch("/api/token-is-valid");
  }

  async accountIsAuthorized () {
    return await this.authedFetch("/api/account-is-authorized");
  }

  async authorizeAccount () {
    return await this.authedFetch("/api/authorize", this.postOptions);
  }

  async unauthorizeAccount () {
    return await this.authedFetch("/api/unauthorize", this.postOptions);
  }

  async getUserTopContent (timePeriod, personalizationType) {
    return await this.authedFetch(`/api/personalization?time-period=${timePeriod}&personalization-type=${personalizationType}`)
  }

  async loadTrack (trackId) {
    return await this.authedFetch(`/api/tracks?song-id=${trackId}`);
  }

  async searchTrack (trackName, trackArtists) {
    return await this.authedFetch(`/api/spotify-tracks?song-name=${trackName}&artists=${trackArtists}`);
  }
  
  async addTrackId (trackId, spotifyTrackId) {
    return await this.authedFetch("/api/spotify-track-id", {
      method: "PATCH",
      body: JSON.stringify({
        "song-id": trackId,
        "spotify-track-id": spotifyTrackId
      }),
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
  
  async loadPlaylists () {
    return await this.authedFetch("/api/playlists");
  }
  
  async addTracksToPlaylist (selectedTrackIds, selectedPlaylistId) {
    return await this.authedFetch("/api/playlist-tracks", {
      ...this.postOptions,
      body: JSON.stringify({
        "spotify-track-ids": selectedTrackIds,
        "spotify-playlist-id": selectedPlaylistId,
      }),
    })
  }

  async loadTracks () {
    return await this.authedFetch("/api/tracks");
  }
}


export const api = new Api();
