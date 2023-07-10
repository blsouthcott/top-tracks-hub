import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { backendUrl } from "../config";
import { tableHeaders } from "./tableHeaders";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "./spinnerStyle";


export default function AddSpotifyTrackId ({ match }) {

  const navigate = useNavigate();
  const { trackId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState({});

  const loadSongInfo = async () => {
    const resp = await fetch(`${backendUrl}/tracks?song-id=${trackId}`);
    if (resp.status !== 200) {
      window.alert(`Unable to load information for track with id: ${trackId}`)
      navigate("/tracks");
    };
    const trackData = await resp.json();
    console.log("track data: ", trackData);
    setTrack(trackData);
    setIsLoading(false);
  }
  
  useEffect(() => {
    loadSongInfo();
  }, [])

  return (
    <>
    {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/>
    :
      <table className="table full-width is-bordered is-hoverable is-striped is-narrow">
        <thead>
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
        </thead>
        <tbody>
          <tr>
            <td>{track.name}</td>
            <td>{track.artists.join(", ")}</td>
            <td>{track.genres.join(", ")}</td>
            <td>{track.date_published}</td>
            <td><Link to={`https://www.pitchfork.com${track.link}`} target="_blank">Pitchfork.com</Link></td>
            <td>{track.site_name}</td>
            <td><input className="input" type="text"></input></td>
            <td><input className="button" type="button" value="Save"></input></td>
          </tr>
        </tbody>
      </table>
    }
    </>
  )
}
