import React, { useState, useEffect } from "react";
import 'bulma/css/bulma.min.css';
import { ClipLoader } from 'react-spinners';
import { spinnerStyle } from "../spinnerStyle";

const url = "http://localhost:5000/api"

export default function Tracks () {

  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [sortedBy, setSortedBy] = useState("name");
  const [orderedBy, setOrderedBy] = useState('asc');

  const fetchTracks = async () => {
    const resp = await fetch(`${url}/songs`);
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
    tracksData = mapKeysToTracks(tracksData);
    console.log("tracks data: ", tracksData);
    setTracks(tracksData);
    setIsLoading(false);
  }

  const tableHeaders = [
    {
      value: "name",
      display: "Song Name"
    },
    {
      value: "artists",
      display: "Artists"
    },
    {
      value: "genres",
      display: "Genres"
    },
    {
      value: "site",
      display: "Site"
    },
    // {
    //   value: "spotify_track_id",
    //   display: "Spotify Track ID"
    // }
  ];

  const handleCheckboxChange = (e) => {
    const tracksCopy = [...tracks];
    for (let track of tracksCopy) {
      if (track.key == e.target.value) {
        track.checked = e.target.checked;
      };
    }
    setTracks(tracksCopy);
  }

  function sortTracksTable(attr) {
    console.log('sorting data...');
    const tracksCopy = [...tracks];
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
    setTracks(tracksCopy);
};
  
  useEffect(() => {
    loadTracks();
  }, [])

  return (
    <>
      {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
        <div className="section">
          <div className="container">
            <table className="table is-bordered is-hoverable is-striped is-narrow">
              <caption className="title">Pitchfork Top Tracks</caption>
              <thead className="sticky-header">
                <tr id='table-header-row'>
                  <th className="has-background-primary has-text-white"></th>
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
                {tracks.map((track, i) => {
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
                      <td>{track.artists}</td>
                      <td>{track.genres}</td>
                      <td>{track.site_name}</td>
                      {/* <td>{track.spotify_track_id}</td> */}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      }
    </>
  )
}
