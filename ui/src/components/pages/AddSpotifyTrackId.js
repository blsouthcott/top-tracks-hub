import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { addTrackIdTableHeaders, searchResultsTableHeaders } from "../../utils/tableHeaders";
import { ClipLoader } from "react-spinners";
import HeroSection from "../common/HeroSection";
import { styles, toClassName } from "../../utils/styles";
import { spinnerStyle } from "../../utils/spinnerStyle";
import { alert } from "../../utils/alert";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../utils/api";


const loadSearchResults = async (navigate, setIsLoading, track, setSearchResults) => {
  const resp = await api.searchTrack(track.name, track.artists.join(", "));
  if (resp.status !== 200) {
    alert.fire({title: `Unable to load information for Spotify Tracks search for track with id: ${track.id}`, icon: "error"});
    navigate("/tracks", { state: { trackId: track.id } });
  } else {
    const data = await resp.json();
    if (data.items.length === 0) {
      alert.fire({title: `No search results for ${track.name}`, icon: "warning"})
      navigate("/tracks", { state: { trackId: track.id } });
    }
    console.log("search results: ", data);
    setSearchResults(data);
  };
  setIsLoading(false);
}

const addTrackId = async (navigate, setIsLoading, trackId, spotifyTrackId) => {
  console.log(`update id for track with id: ${trackId} to Spotify id: ${spotifyTrackId}`);
  setIsLoading(true);
  const resp = await api.addTrackId(trackId.toString(), spotifyTrackId);
  if (resp.status !== 204) {
    const errMsg = await resp.text();
    alert.fire({title: `Unable to update Spotify Track ID -  -  ${errMsg}`, icon: "error"});
  } else {
    alert.fire({title: "Spotify Track ID successfully updated!", icon: "success"});
  };
  navigate("/tracks", { state: { trackId: trackId } });
}


const TrackTable = ({ navigate, setIsLoading, track, spotifyTrackId, setSpotifyTrackId }) => {
  const handleSpotifyTrackIdChange = (e) => setSpotifyTrackId(e.target.value);
  const handleAddTrackId = () => addTrackId(navigate, setIsLoading, track.id, spotifyTrackId);
  return (
    <table className={toClassName(styles.table, styles.fullWidth, styles.isBordered, styles.isHoverable, styles.isStriped, styles.isNarrow)}>
      <caption className={styles.title}>Track Info</caption>
      <thead>
        <tr>
          {addTrackIdTableHeaders.map((header, i) => {
            return (
              <th
                className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}
                key={i}>
                {header.display}
              </th>
            )
          })}
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
              onChange={handleSpotifyTrackIdChange}
              className={styles.input}
              type="text">
            </input>
          </td>
          <td>
            <input 
              className={styles.button}
              type="button" 
              value="Save"
              onClick={handleAddTrackId}>  
            </input>
          </td>
        </tr>
      </tbody>
    </table>
  )
}


const SearchResultsTable = ({ searchResults, copiedIds, setCopiedIds }) => {
  const handleCopy = (text, result) => setCopiedIds({ ...copiedIds, [text]: result });
  return (
    <table className={toClassName(styles.table, styles.fullWidth, styles.isBordered, styles.isHoverable, styles.isStriped, styles.isNarrow)}>
      <caption className={styles.title}>Spotify Search Results</caption>
      <thead>
        <tr>
          {searchResultsTableHeaders.map((header, i) => {
            return (
              <th className={toClassName(styles.hasBackgroundPrimary, styles.hasTextWhite, styles.tableHeader)}>
                {header.display}
              </th>
            )
          })}
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
                <CopyToClipboard text={result.id} onCopy={handleCopy}>
                  <p style={{cursor: "pointer"}} className={copiedIds[result.id] ? styles.flash : ""}>
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
}


const AddSpotifyTrackIdContent = ({ isLoading, setIsLoading, navigate, track, spotifyTrackId, setSpotifyTrackId, searchResults, copiedIds, setCopiedIds }) => (
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


export default function AddSpotifyTrackId () {

  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [spotifyTrackId, setSpotifyTrackId] = useState("");
  const [copiedIds, setCopiedIds] = useState({});
  const { track } = location.state;

  console.log("track: ", track)
  
  useEffect(() => {
    loadSearchResults(navigate, setIsLoading, track, setSearchResults);
  }, [])

  return (
    <HeroSection content={
      <AddSpotifyTrackIdContent
        navigate={navigate}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        track={track}
        spotifyTrackId={spotifyTrackId}
        setSpotifyTrackId={setSpotifyTrackId}
        searchResults={searchResults}
        copiedIds={copiedIds}
        setCopiedIds={setCopiedIds}/>
      }
    />
  )
}
