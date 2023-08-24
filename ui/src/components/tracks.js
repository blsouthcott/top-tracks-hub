import React, { useState, useEffect, useRef } from "react";
import 'bulma/css/bulma.min.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { tableHeaders } from "./tableHeaders";
import { spinnerStyle } from "./spinnerStyle";
import { getAccessToken } from "../utils/accessToken";
import { alert } from "./alert";
import AudioPlayer from "./audioPlayer";
import Footer from "./footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan,  } from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";


export default function Tracks ({ setIsAuthenticated }) {

  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [allowDbUpdate, setAllowDbUpdate] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [displayedTracks, setDisplayedTracks] = useState([]);
  const [sortedBy, setSortedBy] = useState("date_published");
  const [orderedBy, setOrderedBy] = useState("asc");
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const highlightedRowRef = useRef(null);
  const trackId = location.state?.trackId;

  const handlePlaylistChange = (e) => {
    setSelectedPlaylistId(e.target.value);
  };

  const loadPlaylists = async () => {
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch("/api/playlists", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      }
    });
    if (resp.status === 200) {
      const data = await resp.json();
      setPlaylists(data);
    } else {
      alert.fire("Failed to load user playlists");
    }
  }

  const mapKeysToTracks = (tracks) => {
    const mappedTracks = tracks.map((track, i) => {
      return {
        ...track,
        key: i,
        checked: false,
      }
    });
    return mappedTracks;
  }

  const loadTracks = async () => {
    setIsLoading(true);
    const resp = await fetch("/api/tracks");
    if (resp.status !== 200) {
      setIsLoading(false);
      alert.fire("Unable to load tracks data");
      return;
    };
    let tracksData = await resp.json();
    // tracksData = tracksData.filter(track => track.spotify_track_id !== null);
    tracksData = mapKeysToTracks(tracksData);
    tracksData.sort((a, b) => {
      if (a["date_published"] > b["date_published"]) { return -1; };
      if (a["date_published"] < b["date_published"]) { return 1; };
      return 0;
    });
    setTracks(tracksData);
    setDisplayedTracks(tracksData);
    setIsLoading(false);
  }

  const addTracksToPlaylist = async () => {
    if (!selectedPlaylistId) {
      alert.fire("Please select a playlist and try again!");
      return;
    };
    setIsLoading(true);
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch("/api/playlist-tracks", {
      method: "POST",
      body: JSON.stringify({
        "spotify-track-ids": selectedTrackIds,
        "spotify-playlist-id": selectedPlaylistId,
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      }
    })
    setIsLoading(false);
    if (resp.status === 200) {
      alert.fire("Tracks successfully added to playlist!")
    } else {
      alert.fire("Error adding tracks to playlist")
    };
  }

  const handleCheckboxChange = (e) => {
    console.log("selected Track IDs: ", selectedTrackIds);
    console.log("event: ", e.target.checked ? "checked" : "unchecked")
    const tracksCopy = [...tracks];
    for (let track of tracksCopy) {
      if (track.key == e.target.value) {
        track.checked = e.target.checked;
        if (track.spotify_track_id) {
          let selectedTrackIdsCopy = [...selectedTrackIds];
          if (e.target.checked) {
            console.log(`pushing ${track.spotify_track_id} to playlist track IDs`)
            selectedTrackIdsCopy.push(track.spotify_track_id);
          } else {
            console.log(`removing ${track.spotify_track_id} from playlist track IDs`)
            selectedTrackIdsCopy = selectedTrackIdsCopy.filter(trackId => trackId !== track.spotify_track_id);
          }
          setSelectedTrackIds(selectedTrackIdsCopy);
        };
        setTracks(tracksCopy);
        return;
      };
    };
  }

  const unselectAllTracks = () => {
    const tracksCopy = [...tracks];
    for (let track of tracksCopy) {
      if (track.checked) {
        track.checked = false;
      };
    };
    setTracks(tracksCopy);
    setSelectedTrackIds([]);
  }

  const sortTracksTable = (attr) => {
    // attr can be any column header value in tableHeaders.js
    console.log('sorting data...');
    const tracksCopy = [...displayedTracks];
    console.log(`sorting ${tracksCopy.length} tracks....`)
    if ((sortedBy !== attr) || (sortedBy === attr && orderedBy === "asc")) {
        tracksCopy.sort((a, b) => {
            if (a[attr] < b[attr]) {
                return -1;
            }
            if (a[attr] > b[attr]) {
                return 1;
            }
            return 0;
        });
        setOrderedBy("desc");
    } else if (sortedBy === attr && orderedBy === "desc") {
        tracksCopy.sort((a, b) => {
            if (a[attr] < b[attr]) {
                return 1;
            }
            if (a[attr] > b[attr]) {
                return -1;
            }
            return 0;
        });
        setOrderedBy("asc");
    };
    setSortedBy(attr);
    setDisplayedTracks(tracksCopy);
  };

  const filterTracksTable = (e) => {
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
    }
  }

  useEffect(() => {
    if (highlightedRowRef.current) {
      console.log("scrolling element into view: ", `track-${trackId}`)
      highlightedRowRef.current.scrollIntoView({ block: "center"});
      navigate(".", { state: { ...location.state, trackId: undefined }});
    };
  }, [highlightedRowRef.current, tracks])
  
  useEffect(() => {
    getAccessToken(navigate, setIsAuthenticated);
    loadPlaylists();
    loadTracks();
    const handleDeviceChange = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleDeviceChange);
    return () => window.removeEventListener("resize", handleDeviceChange);
  }, [])

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container full-width">
          {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
            <>            
              <h1 className="title mt-6 is-size-1 has-text-centered">Recommended Tracks</h1>
              <div className="is-flex is-justify-content-center is-flex-wrap-wrap is-flex-direction-column-touch">
                <div className="is-flex is-justify-content-center is-flex-wrap-wrap is-flex-direction-column-touch">
                  <div className="select m-1" style={{"zIndex": 1}}>
                    <select
                      value={selectedPlaylistId} 
                      onChange={handlePlaylistChange}>
                      <option></option>
                      {playlists.map((playlist, i) => 
                        <option key={i} value={playlist.id}>{playlist.name}</option>
                      )}
                    </select>
                  </div>
                    <button
                      className="m-1 button is-primary"
                      disabled={selectedTrackIds.length === 0 || playlists.length < 1}
                      onClick={addTracksToPlaylist}>
                      Add to Spotify Playlist&nbsp;<FontAwesomeIcon icon={faSpotify} />
                    </button>
                  </div>
                    <input
                      type="search"
                      className="m-1 input search"
                      style={{maxWidth: "400px"}}
                      placeholder="Filter table..."
                      onChange={filterTracksTable}/>
                </div>
                <div className="is-scrollable mt-4">
                  <table className="table full-width is-bordered is-hoverable is-striped is-narrow">
                    <thead className="sticky-header">
                      <tr id='table-header-row'>
                        <th className="has-background-primary has-text-white">
                          <input
                            type="checkbox"
                            checked={selectedTrackIds.length > 0}
                            onChange={unselectAllTracks}
                          />
                        </th>
                        {tableHeaders.map((header, i) => {
                          return (
                            <th
                              className="has-background-primary has-text-white table-header"
                              onClick={() => sortTracksTable(header.value)} 
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
                      {displayedTracks.map((track, i) => {
                        return (
                          <tr key={track.id} id={`track-${track.id}`} className={track.id == trackId && "highlighted-row"} ref={track.id == trackId ? highlightedRowRef : null}>
                            {!isMobile && <td data-label="Add to Playlist">
                              <input
                                type="checkbox"
                                value={track.key}
                                checked={track.checked}
                                onChange={handleCheckboxChange}
                              />
                            </td>}
                            <td data-label="Song Name">{track.name}</td>
                            <td data-label="Artists">{track.artists.join(", ")}</td>
                            <td data-label="Genres">{track.genres.join(", ")}</td>
                            <td data-label="Date Published">{track.date_published}</td>
                            <td data-label="Link to Review"><Link to={`https://www.pitchfork.com${track.link}`} target="_blank">Pitchfork.com</Link></td>
                            <td data-label="Site">{track.site_name}</td>
                            <td data-label="Spotify Track ID">{track.spotify_track_id ? 
                                track.spotify_track_id
                                : <Link to={`/add-spotify-track-id/${track.id}`}>Add Spotify Track ID</Link>}
                            </td>
                            <td data-label="Preview Track">
                              <div className="is-flex is-clipped is-justify-content-center">{track.spotify_track_id && track.preview_url ? <><AudioPlayer src={track.preview_url} displayControls={false} />&nbsp;<FontAwesomeIcon icon={faSpotify} /></> : <FontAwesomeIcon icon={faBan} />}</div>
                            </td>
                            {isMobile && <td data-label="Add to Playlist">
                              <input
                                type="checkbox"
                                value={track.key}
                                checked={track.checked}
                                onChange={handleCheckboxChange}
                              />
                            </td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
          }
        </div>
      </div>
      <Footer />
    </section>
  )
}
