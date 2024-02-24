import React, { useState, useEffect, useRef } from "react";
import 'bulma/css/bulma.min.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import HeroSection from "./heroSection";
import { ClipLoader } from 'react-spinners';
import { tableHeaders } from "./tableHeaders";
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import AudioPlayer from "./audioPlayer";
import { styles, toClassName } from "./styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan,  } from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import * as api from "../utils/api";
import { checkToken } from "../utils/utils";

const mapKeysToTracks = (tracks) => {
  return tracks.map((track) => {
    return {
      ...track,
      key: track.id,
      checked: false,
    }
  });
}

const loadTracks = async (setIsLoading, setTracks, setDisplayedTracks) => {
  setIsLoading(true);
  const resp = await api.loadTracks();
  if (resp.status !== 200) {
    setIsLoading(false);
    alert.fire("Unable to load tracks data");
    return;
  };
  let tracksData = await resp.json();
  // tracksData = tracksData.filter(track => track.spotify_track_id !== null);
  tracksData = mapKeysToTracks(tracksData);
  tracksData.sort((track1, track2) => {
    if (track1["date_published"] > track2["date_published"]) { return -1; };
    if (track1["date_published"] < track2["date_published"]) { return 1; };
    return 0;
  });
  setTracks(tracksData);
  setDisplayedTracks(tracksData);
  setIsLoading(false);
}

const getSelectedTrackIds = (tracks) => {
  return tracks.filter(track => track.checked === true).map(track => track.spotify_track_id);
}

const unselectAllTracks = (tracks, setTracks) => {
  const tracksCopy = [...tracks];
  for (let track of tracksCopy) {
    if (track.checked) {
      track.checked = false;
    };
  };
  setTracks(tracksCopy);
}

const addTracksToPlaylist = async (navigate, setIsLoading, tracks, selectedPlaylistId) => {
  if (!selectedPlaylistId) {
    alert.fire("Please select a playlist and try again!");
    return;
  };
  setIsLoading(true);
  const selectedTrackIds = getSelectedTrackIds(tracks);
  const resp = await api.addTracksToPlaylist(selectedTrackIds, selectedPlaylistId);
  setIsLoading(false);
  if (resp.status === 401) {
    alert.fire({title: "Your current login session has expired", icon: "warning"});
    navigate("/");
  } else if (resp.status === 200) {
    alert.fire("Tracks successfully added to playlist!")
  } else {
    alert.fire("Error adding tracks to playlist")
  };
}

const loadPlaylists = async (navigate, setPlaylists) => {
  const resp = await api.loadPlaylists();
  if (resp.status === 401) {
    alert.fire({title: "Your current login session has expired", icon: "warning"});
    navigate("/");
  } else if (resp.status === 200) {
    const data = await resp.json();
    setPlaylists(data);
  } else {
    alert.fire("Failed to load user playlists");
  };
}

const sortTracksTable = (attr, displayedTracks, setDisplayedTracks, sortedBy, setSortedBy, orderedBy, setOrderedBy) => {
  // attr can be any column header value in tableHeaders.js
  console.log("sorting tracks...");
  const displayedCopy = [...displayedTracks];
  console.log(`sorting ${displayedCopy.length} tracks....`)
  let retVal1, retVal2, updatedOrderedBy; 
  if ((sortedBy !== attr) || (sortedBy === attr && orderedBy === "asc")) {
    retVal1 = -1;
    retVal2 = 1;
    updatedOrderedBy = "desc";
  } else {
    retVal1 = 1;
    retVal2 = -1;
    updatedOrderedBy = "asc";
  }
  displayedCopy.sort((track1, track2) => {
    if (track1[attr] < track2[attr]) {
      return retVal1;
    }
    if (track1[attr] > track2[attr]) {
      return retVal2;
    }
    return 0;
  });
  setOrderedBy(updatedOrderedBy);
  setSortedBy(attr);
  setDisplayedTracks(displayedCopy);
};

const filterTracksTable = (e, tracks, setDisplayedTracks) => {
  const searchTerm = e.target.value;
  if (!searchTerm) {
    setDisplayedTracks(tracks);
  } else {
    const filteredTracks = tracks.filter(track => {
      for (let key in track) {
        if (JSON.stringify(track[key]).indexOf(searchTerm) !== -1) {
          return true;
        }
      }
      return false;
    });
    setDisplayedTracks(filteredTracks);
  };
}

const handleCheckboxChange = (e, tracks, setTracks) => {
  console.log("event: ", e.target.checked ? "checked" : "unchecked")
  const tracksCopy = [...tracks];
  for (let track of tracksCopy) {
    if (track.key == e.target.value) {
      track.checked = e.target.checked;
      setTracks(tracksCopy);
      return;
    };
  };
}

const addToPlaylistButtonDisabled = (selectedPlaylistId, tracks) => {
  if (!selectedPlaylistId) {
    return true;
  };
  if ((getSelectedTrackIds(tracks)).length === 0) {
    return true;
  };
  return false;
}

const handlePlaylistChange = (e, setSelectedPlaylistId) => {
  console.log("playlist: ", e.target.value)
  setSelectedPlaylistId(e.target.value);
};

function TableControls ({ navigate, setIsLoading, tracks, setDisplayedTracks, playlists }) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  return (
    <>
      <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter, styles.isFlexWrapWrap, styles.isFlexDirectionColumnTouch)}>
        <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter, styles.isFlexWrapWrap, styles.isFlexDirectionColumnTouch)}>
          <div className={toClassName(styles.select, styles.margins.m1)} style={{"zIndex": 1}}>
            <select
              value={selectedPlaylistId} 
              onChange={e => handlePlaylistChange(e, setSelectedPlaylistId)}>
              <option></option>
              {playlists.map((playlist, i) => 
                <option key={i} value={playlist.id}>{playlist.name}</option>
              )}
            </select>
          </div>
          <button
            className={toClassName(styles.margins.m1, styles.button, styles.isPrimary)}
            disabled={addToPlaylistButtonDisabled(selectedPlaylistId, tracks)}
            onClick={() => addTracksToPlaylist(navigate, setIsLoading, tracks, selectedPlaylistId)}>
            Add to Spotify Playlist&nbsp;<FontAwesomeIcon icon={faSpotify} />
          </button>
          </div>
            <input
              type="search"
              className={toClassName(styles.margins.m1, styles.input, styles.search)}
              style={{maxWidth: "400px"}}
              placeholder="Filter table..."
              onChange={(e) => filterTracksTable(e, tracks, setDisplayedTracks)}
            />
        </div>
    </>
  )
}

function TracksTable ({ isMobile, newTrackId, highlightedRowRef, tracks, setTracks, displayedTracks, setDisplayedTracks }) {

  const [sortedBy, setSortedBy] = useState("date_published");
  const [orderedBy, setOrderedBy] = useState("asc");

  return (
    <table className={toClassName(styles.table, styles.fullWidth, styles.isBordered, styles.isHoverable, styles.isStriped, styles.isNarrow)}>
      <thead className={styles.stickyHeader}>
        <tr id="table-header-row">
          <th className={toClassName(styles.hasTextWhite, styles.hasBackgroundPrimary)}>
            <input
              type="checkbox"
              checked={(getSelectedTrackIds(tracks)).length > 0}
              onChange={() => unselectAllTracks(tracks, setTracks)}
            />
          </th>
          {tableHeaders.map((header, i) => {
            return (
              <th
                className={toClassName(styles.hasTextWhite, styles.hasBackgroundPrimary, styles.tableHeader)}
                onClick={() => sortTracksTable(header.value, displayedTracks, setDisplayedTracks, sortedBy, setSortedBy, orderedBy, setOrderedBy)} 
                key={i}>
                  {header.display}
                  &nbsp;
                  {header.value === sortedBy ? orderedBy === "asc" ? <span>&darr;</span> : <span>&uarr;</span> : ""}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {displayedTracks.map((track) => {
          return (
            <tr key={track.id} id={`track-${track.id}`} className={track.id == newTrackId && "highlighted-row"} ref={track.id == newTrackId ? highlightedRowRef : null}>
              {!isMobile && <td data-label="Add to Playlist">
                <input
                  type="checkbox"
                  value={track.key}
                  checked={track.checked}
                  onChange={(e) => handleCheckboxChange(e, tracks, setTracks)}
                />
              </td>}
              <td data-label="Song Name">{track.name}</td>
              <td data-label="Artists">{track.artists.join(", ")}</td>
              <td data-label="Genres">{track.genres.join(", ")}</td>
              <td data-label="Date Published">{track.date_published}</td>
              <td data-label="Link to Review"><Link to={`https://www.pitchfork.com${track.link}`} target="_blank">Pitchfork.com</Link></td>
              <td data-label="Site">{track.site_name}</td>
              <td data-label="Spotify Track ID">{track.spotify_track_id || <Link to={`/add-spotify-track-id/${track.id}`}>Add Spotify Track ID</Link>}
              </td>
              <td data-label="Preview Track">
                <div className={toClassName(styles.isFlex, styles.isClipped, styles.isJustifyContentCenter)}>
                  {track.spotify_track_id && track.preview_url && 
                    <>
                      <AudioPlayer src={track.preview_url} displayControls={false} />
                      &nbsp;<FontAwesomeIcon icon={faSpotify} />
                    </>}
                  {!track.spotify_track_id &&
                    <FontAwesomeIcon icon={faBan} />}
                </div>
              </td>
              {isMobile && <td data-label="Add to Playlist">
                <input
                  type="checkbox"
                  value={track.key}
                  checked={track.checked}
                  onChange={(e) => handleCheckboxChange(e, tracks, setTracks)}
                />
              </td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}


export default function TracksPage ({ setIsAuthenticated }) {

  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [displayedTracks, setDisplayedTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  
  const highlightedRowRef = useRef(null);
  const newTrackId = location.state?.trackId;

  useEffect(() => {
    if (highlightedRowRef.current) {
      console.log("scrolling element into view: ", `track-${newTrackId}`)
      highlightedRowRef.current.scrollIntoView({ block: "center"});
      navigate(".", { state: { ...location.state, trackId: undefined }});
    };
  }, [highlightedRowRef.current, tracks])
  
  useEffect(() => {
    checkToken(setIsAuthenticated, navigate);
    loadPlaylists(navigate, setPlaylists);
    loadTracks(setIsLoading, setTracks, setDisplayedTracks);
    const handleDeviceChange = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleDeviceChange);
    return () => window.removeEventListener("resize", handleDeviceChange);
  }, [])

  return (
    <HeroSection
      containerStyle={styles.fullWidth}
      content={
        <>
          {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
          {!isLoading &&
            <>
              <h1 className={toClassName(styles.title, styles.margins.mt6, styles.sizes.isSize2, styles.hasTextCentered)}>Recommended Tracks</h1>
              <TableControls navigate={navigate} setIsLoading={setIsLoading} tracks={tracks} setDisplayedTracks={setDisplayedTracks} playlists={playlists} />
              <div className={toClassName(styles.isScrollable, styles.margins.mt4)}>
                <TracksTable 
                  isMobile={isMobile} 
                  highlightedRowRef={highlightedRowRef} 
                  newTrackId={newTrackId} 
                  tracks={tracks}
                  setTracks={setTracks} 
                  displayedTracks={displayedTracks} 
                  setDisplayedTracks={setDisplayedTracks} 
                />
              </div>
            </>
          }
        </>
      }
    />
  )
}
