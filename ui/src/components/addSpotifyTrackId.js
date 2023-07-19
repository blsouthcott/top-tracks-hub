import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { backendUrl } from "../config";
import { tableHeaders } from "./tableHeaders";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "./spinnerStyle";
import { getAccessToken } from "./getAccessToken";


export default function AddSpotifyTrackId ({ setIsAuthenticated }) {

  const navigate = useNavigate();
  const { trackId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [spotifyTrackId, setSpotifyTrackId] = useState("");

  const loadSongInfo = async () => {
    const resp = await fetch(`${backendUrl}/tracks?song-id=${trackId}`);
    if (resp.status !== 200) {
      window.alert(`Unable to load information for track with id: ${trackId}`)
      navigate("/tracks");
    };
    const trackData = await resp.json();
    console.log("track data: ", trackData);
    setTrack(trackData);
    return trackData;
  }

  const loadSearchResults = async (track) => {
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch(`${backendUrl}/spotify-tracks?song-name=${track.name}&artists=${track.artists.join(", ")}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      }
    })
    if (resp.status !== 200) {
      window.alert(`Unable to load information for Spotify Tracks search for track with id: ${trackId}`)
      navigate("/tracks");
    };
    const data = await resp.json();
    if (data.length === 0) {
      window.alert(`No search results for ${track.name}`)
      navigate("/tracks");
    }
    console.log("search results: ", data);
    setSearchResults(data);
  }

  const addTrackId = async () => {
    setIsLoading(true);
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch(`${backendUrl}/spotify-track-id`, {
      method: "PATCH",
      body: JSON.stringify({
        "song-id": trackId,
        "spotify-track-id": spotifyTrackId
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      }
    });
    if (resp.status !== 204) {
      window.alert("Unable to update Spotify Track ID");
    } else {
      window.alert("Spotify Track ID successfully updated!");
    };
    navigate("/tracks");
  }
  
  useEffect(() => {
    loadSongInfo().then(loadedTrack => {
      loadSearchResults(loadedTrack).then(() => {
        setIsLoading(false);
      })
    })
  }, [])

  return (
    <>
    {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/>
    :
    <div className="section">
      <table className="table full-width is-bordered is-hoverable is-striped is-narrow">
        <caption className="title">Track Info</caption>
        <thead>
          <tr>
            {tableHeaders.map((header, i) => {
              return (
                <th
                  className="has-background-primary has-text-white table-header"
                  key={i}>
                  {header.display}
                </th>
              )
            })}
            <th className="has-background-primary has-text-white table-header"></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{track.name}</td>
            <td>{track.artists.join(", ")}</td>
            <td>{track.genres.join(", ")}</td>
            <td>{track.date_published}</td>
            <td><Link to={`https://www.pitchfork.com${track.link}`} target="_blank">Pitchfork.com</Link></td>
            <td>{track.site_name}</td>
            <td>
              <input 
                value={spotifyTrackId}
                onChange={e => setSpotifyTrackId(e.target.value)}
                className="input" 
                type="text">
              </input>
            </td>
            <td>
              <input 
                className="button" 
                type="button" 
                value="Save"
                onClick={addTrackId}
              ></input>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table full-width is-bordered is-hoverable is-striped is-narrow">
        <caption className="title">Spotify Search Results</caption>
        <thead>
          <tr>
            <th className="has-background-primary has-text-white table-header">Name</th>
            <th className="has-background-primary has-text-white table-header">Album</th>
            <th className="has-background-primary has-text-white table-header">Artists</th>
            <th className="has-background-primary has-text-white table-header">Link</th>
            <th className="has-background-primary has-text-white table-header">Spotify Track ID</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((result, i) => {
            return (
              <tr>
                <td>{result.name}</td>
                <td>{result.album.name}</td>
                <td>{result.album.artists.map(artist => artist.name).join(", ")}</td>
                <td><Link to={result.external_urls.spotify} target="_blank">Spotify</Link></td>
                {/* // TODO: allow copying id to clipboard */}
                <td>{result.id}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    }
    </>
  )
}