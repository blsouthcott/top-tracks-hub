import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { tableHeaders } from "./tableHeaders";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import * as api from "../utils/api";


export default function AddSpotifyTrackId ({ setIsAuthenticated }) {

  const navigate = useNavigate();
  const { trackId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [spotifyTrackId, setSpotifyTrackId] = useState("");
  const [copiedIds, setCopiedIds] = useState({});

  const loadSongInfo = async () => {
    const resp = await fetch(`/api/tracks?song-id=${trackId}`);
    if (resp.status === 401) {

    }
    if (resp.status !== 200) {
      alert.fire({title: `Unable to load information for track with id: ${trackId}`, icon: "error"});
      navigate("/tracks");
    };
    const data = await resp.json();
    console.log("track data: ", data);
    setTrack(data);
    return data;
  }

  const loadSearchResults = async (track) => {
    const resp = await api.searchTrack(navigate, track);
    if (resp.status !== 200) {
      alert.fire({title: `Unable to load information for Spotify Tracks search for track with id: ${trackId}`, icon: "error"});
      navigate("/tracks", { state: { trackId: trackId } });
    } else {
      const data = await resp.json();
      if (data.length === 0) {
        alert.fire({title: `No search results for ${track.name}`, icon: "warning"})
        navigate("/tracks", { state: { trackId: trackId } });
      }
      console.log("search results: ", data);
      setSearchResults(data);
    };
  }

  const addTrackId = async () => {
    setIsLoading(true);
    const resp = await api.addTrackId(navigate, trackId, spotifyTrackId);
    if (resp.status !== 204) {
      alert.fire({title: "Unable to update Spotify Track ID", icon: "error"});
    } else {
      alert.fire({title: "Spotify Track ID successfully updated!", icon: "success"});
    };
    navigate("/tracks", { state: { trackId: trackId } });
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
                <td>
                  <CopyToClipboard 
                    text={result.id}
                    onCopy={() => setCopiedIds({ ...copiedIds, [result.id]: true })}>
                    <p 
                      style={{cursor: "pointer"}}
                      className={copiedIds[result.id] ? "flash" : ""}>
                        {result.id} <FontAwesomeIcon className={copiedIds[result.id] ? "flash" : ""} icon={faClipboard} />
                    </p>
                  </CopyToClipboard>
                </td>
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
