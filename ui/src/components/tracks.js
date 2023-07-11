import React, { useState, useEffect } from "react";
import 'bulma/css/bulma.min.css';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { backendUrl } from "../config";
import { tableHeaders } from "./tableHeaders";
import { spinnerStyle } from "./spinnerStyle";


export default function Tracks () {

  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [displayedTracks, setDisplayedTracks] = useState([]);
  const [sortedBy, setSortedBy] = useState("name");
  const [orderedBy, setOrderedBy] = useState('asc');
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);

  const fetchTracks = async () => {
    const resp = await fetch(`${backendUrl}/tracks`);
    if (resp.status !== 200) {
      return;
    };
    const respData = await resp.json();
    return respData;
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
    let tracksData = await fetchTracks();
    if (!tracksData) {
      setIsLoading(false);
      window.alert("unable to load tracks data");
      return;
    };
    // tracksData = tracksData.filter(track => track.spotify_track_id !== null);
    tracksData = mapKeysToTracks(tracksData);
    console.log("tracks data: ", tracksData);
    setTracks(tracksData);
    setDisplayedTracks(tracksData);
    setIsLoading(false);
  }

  const addTracksToPlaylist = async () => {
    setIsLoading(true);
    const access_token = localStorage.getItem("access_token");
    const resp = await fetch(`${backendUrl}/playlist-tracks`, {
      method: "POST",
      body: JSON.stringify({spotify_track_ids: selectedTrackIds}),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      }
    })
    setIsLoading(false);
    if (resp.status === 200) {
      window.alert("Tracks successfully added to playlist")
    } else {
      window.alert("Error adding tracks to playlist")
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
        // console.log("selected Track IDs: ", selectedTrackIds);
        return;
      };
    }
    
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

  function sortTracksTable(attr) {
    console.log('sorting data...');
    const tracksCopy = [...displayedTracks];
    if ((sortedBy !== attr) || (sortedBy === attr && orderedBy === "desc")) {
        tracksCopy.sort((a, b) => {
            if (a[attr] < b[attr]) {
                return -1;
            }
            if (a[attr] > b[attr]) {
                return 1;
            }
            return 0;
        });
        setOrderedBy("asc");
    } else if (sortedBy === attr && orderedBy === "asc") {
        tracksCopy.sort((a, b) => {
            if (a[attr] < b[attr]) {
                return 1;
            }
            if (a[attr] > b[attr]) {
                return -1;
            }
            return 0;
        });
        setOrderedBy("desc");
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
    loadTracks();
  }, [])

  return (
    <>
      {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
        <div className="section">
          <div className="columns is-centered">
            <div className="is-half">
              <h1 className="title">Pitchfork Top Tracks</h1>
            </div>
          </div>
            <div className="section p-2">
                <div className="columns is-centered m-2 ml-6 mr-6">
                  <div className="column is-one-third">
                    <button
                      className="button is-primary"
                      disabled={selectedTrackIds.length === 0}
                      onClick={addTracksToPlaylist}
                    >
                        Add to Spotify Playlist
                    </button>
                  </div>
                  <div className="column is-one-third">
                    <input
                      type="search"
                      className="input m-1 search"
                      placeholder="Filter table..."
                      onChange={filterTracksTable}
                    />
                  </div>
                  <div className="column is-one-third ">
                    {/* <button
                      className="button is-primary p-0"
                      onClick={() => console.log("click")}
                    >Add Tracks to Spotify Playlist</button> */}
                  </div>
                </div>
              <div className="container is-scrollable">
                <table className="table full-width is-bordered is-hoverable is-striped is-narrow">
                  {/* <caption className="title">Pitchfork Top Tracks</caption> */}
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
                        <tr key={i} >
                          <td>
                            <input
                              type="checkbox"
                              value={track.key}
                              checked={track.checked}
                              onChange={handleCheckboxChange}
                            />
                          </td>
                          <td>{track.name}</td>
                          <td>{track.artists.join(", ")}</td>
                          <td>{track.genres.join(", ")}</td>
                          <td>{track.date_published}</td>
                          <td><Link to={`https://www.pitchfork.com${track.link}`} target="_blank">Pitchfork.com</Link></td>
                          <td>{track.site_name}</td>
                          <td>{track.spotify_track_id ? 
                              track.spotify_track_id
                              : <Link to={`/add-spotify-track-id/${track.id}`}>Add Spotify Track ID</Link>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      }
    </>
  )
}
