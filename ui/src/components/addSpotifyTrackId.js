import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { tableHeaders } from "./tableHeaders";
import { ClipLoader } from "react-spinners";
import { styles, toClassName } from "./styles";
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import * as api from "../utils/api";


const loadSongInfo = async (navigate, trackId, setTrack) => {
  const resp = await api.loadTrack(trackId)
  if (resp.status === 401) {
    alert.fire({title: "Your current login session has expired", icon: "warning"});
    navigate("/");
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

const loadSearchResults = async (navigate, track, trackId, setSearchResults) => {
  const resp = await api.searchTrack(track.name, track.artists.join(", "));
  if (resp.status === 401) {
    alert.fire({title: "Your current login session has expired", icon: "warning"});
    navigate("/");
  } else if (resp.status !== 200) {
    alert.fire({title: `Unable to load information for Spotify Tracks search for track with id: ${trackId}`, icon: "error"});
    navigate("/tracks", { state: { trackId: trackId } });
  } else {
    const data = await resp.json();
    if (data.items.length === 0) {
      alert.fire({title: `No search results for ${track.name}`, icon: "warning"})
      navigate("/tracks", { state: { trackId: trackId } });
    }
    console.log("search results: ", data);
    setSearchResults(data);
  };
}

const addTrackId = async (navigate, setIsLoading, trackId, spotifyTrackId) => {
  setIsLoading(true);
  const resp = await api.addTrackId(trackId, spotifyTrackId);
  if (resp.status === 401) {
    alert.fire({title: "Your current login session has expired", icon: "warning"});
    navigate("/");
  } else if (resp.status !== 204) {
    alert.fire({title: "Unable to update Spotify Track ID", icon: "error"});
  } else {
    alert.fire({title: "Spotify Track ID successfully updated!", icon: "success"});
  };
  navigate("/tracks", { state: { trackId: trackId } });
}


const TrackTable = ({ navigate, setIsLoading, track, trackId, spotifyTrackId, setSpotifyTrackId }) => (
  <table className={toClassName(styles.table, styles.fullWidth, styles.isBordered, styles.isHoverable, styles.isStriped, styles.isNarrow)}>
    <caption className={styles.title}>Track Info</caption>
    <thead>
      <tr>
        {tableHeaders.map((header, i) => {
          return (
            <th
              className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}
              key={i}>
              {header.display}
            </th>
          )
        })}
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}></th>
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
            className={styles.input}
            type="text">
          </input>
        </td>
        <td>
          <input 
            className={styles.button}
            type="button" 
            value="Save"
            onClick={() => addTrackId(navigate, setIsLoading, trackId, spotifyTrackId)}
          ></input>
        </td>
      </tr>
    </tbody>
  </table>
)


const SearchResultsTable = ({ searchResults, copiedIds, setCopiedIds }) => (
  <table className={toClassName(styles.table, styles.fullWidth, styles.isBordered, styles.isHoverable, styles.isStriped, styles.isNarrow)}>
    <caption className={styles.title}>Spotify Search Results</caption>
    <thead>
      <tr>
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
          Name
        </th>
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
          Album
        </th>
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
          Artists
        </th>
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
          Link
        </th>
        <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
          Spotify Track ID
        </th>
      </tr>
    </thead>
    <tbody>
      {searchResults.items.map((result) => {
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
                  className={copiedIds[result.id] ? styles.flash : ""}>
                    {result.id} <FontAwesomeIcon className={copiedIds[result.id] ? styles.flash : ""} icon={faClipboard} />
                </p>
              </CopyToClipboard>
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>
)


export default function AddSpotifyTrackId () {

  const navigate = useNavigate();
  const { trackId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [spotifyTrackId, setSpotifyTrackId] = useState("");
  const [copiedIds, setCopiedIds] = useState({});
  
  useEffect(() => {
    loadSongInfo(navigate, trackId, setTrack).then(loadedTrack => {
      loadSearchResults(navigate, loadedTrack, trackId, setSearchResults).then(() => {
        setIsLoading(false);
      })
    })
  }, [])

  return (
    <>
      {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
      {!isLoading &&
        <div className={styles.section}>
          <TrackTable navigate={navigate} setIsLoading={setIsLoading} track={track} spotifyTrackId={spotifyTrackId} setSpotifyTrackId={setSpotifyTrackId} />
          <SearchResultsTable searchResults={searchResults} copiedIds={copiedIds} setCopiedIds={setCopiedIds} />
        </div>
      }
      </>
  )
}
