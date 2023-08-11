import React, { useState, useEffect } from "react";
import 'bulma/css/bulma.min.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { tableHeaders } from "./tableHeaders";
import { spinnerStyle } from "./spinnerStyle";
import { getAccessToken } from "../utils/accessToken";
import { alert } from "./alert";
import AudioPlayer from "./audioPlayer";
import Footer from "./footer";


export default function Tracks ({ setIsAuthenticated }) {

  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [displayedTracks, setDisplayedTracks] = useState([]);
  const [sortedBy, setSortedBy] = useState("date_published");
  const [orderedBy, setOrderedBy] = useState("asc");
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [trackId, setTrackId] = useState(location.state?.trackId);

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

  const fetchTracks = async () => {
    const resp = await fetch("/api/tracks");
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
      alert.fire("Unable to load tracks data");
      return;
    };
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

  const updateTopTracksDb = async () => {
    setIsLoading(true);
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    const resp = await fetch("/api/pitchfork-tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({max_page_num: 25}),
    });
    setIsLoading(false);
    if (resp.status === 200) {
      const data = await resp.json();
      loadTracks();
      alert.fire(`${data.num_new_tracks} new ${data.num_new_tracks == 1 ? "track" : "tracks"} added to database!`);
    } else {
      alert.fire("Error updating database");
    };
  }
  
  useEffect(() => {
    getAccessToken(navigate, setIsAuthenticated);
    loadPlaylists();
    loadTracks().then(() => {
      if (trackId) {
        console.log("scrolling element into view: ", `track-${trackId}`)
        document.getElementById(`track-${trackId}`).scrollIntoView({ block: "center"});
        navigate(".", { state: { ...location.state, trackId: undefined }});
      };
    })
  }, [])

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
          <div className="section m-6 p-2">
            <h1 className="title is-size-1 has-text-centered">Pitchfork Top Tracks</h1>
              <div className="is-flex is-justify-content-space-evenly">
                <div className="is-flex">
                  <div className="select mr-2">
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
                        className="button is-primary"
                        disabled={selectedTrackIds.length === 0 || playlists.length < 1}
                        onClick={addTracksToPlaylist}>
                          Add to Spotify Playlist
                      </button>
                    </div>
                    <input
                      type="search"
                      className="input search"
                      style={{maxWidth: "400px"}}
                      placeholder="Filter table..."
                      onChange={filterTracksTable}/>
                    <button
                        className="button is-primary"
                        onClick={updateTopTracksDb}>
                      Update Top Tracks Database
                    </button>
                  </div>
                  <div className="container is-scrollable mt-4">
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
                            <tr key={track.id} id={`track-${track.id}`} className={track.id == trackId && "highlighted-row"}>
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
                              {/* <td>{track.spotify_track_id ? 
                                  track.spotify_track_id
                                  : <Link to={`/add-spotify-track-id/${track.id}`}>Add Spotify Track ID</Link>}
                              </td> */}
                              <td>
                                {track.spotify_track_id && track.preview_url && <AudioPlayer src={track.preview_url} displayControls={false} />}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
          }
        </div>
      </div>
      <Footer />
    </section>
  )
}
