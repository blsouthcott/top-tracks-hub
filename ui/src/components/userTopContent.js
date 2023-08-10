import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AudioPlayer from "./audioPlayer";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "./spinnerStyle";
import { getAccessToken } from "../utils/accessToken";
import { alert } from "./alert";
import Footer from "./footer";
import { accountIsAuthorized } from "../utils/accountAuth";


const ArtistCard = ({ artist, num }) => (
  <div className="card m-6">
    <div className="card-header is-primary has-background-primary">
      <p className="card-header-title is-size-4 p-1 pl-4 has-text-white">
        {num+1}. {artist.name}
      </p>
    </div>
    <div className="columns is-vcentered m-3">
      <div className="column is-one-third has-text-centered">
        <img src={artist.images[0].url} alt={artist.name} style={{width: "10em"}}/>
      </div>
      <div className="column is-two-thirds">
        <div className="content">
          <p>Popularity: <b>{artist.popularity}</b></p>
          <p>Genres: {artist.genres.join(", ")}</p>
          <Link to={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="button is-primary">Listen on Spotify</Link>
        </div>
      </div>
    </div>
  </div>
);


const TrackCard = ({ track, num }) => (
  <div className="card m-6">
    <header className="card-header has-background-primary">
      <h2 className="card-header-title is-size-4 p-1 pl-4 has-text-white">
      {num+1}. {track.name}
      </h2>
    </header>
    <div className="columns is-vcentered m-3">
      <div className="column is-one-third has-text-centered">
        <img src={track.album.images[0].url} alt={track.name} style={{width: "10em"}}/>
      </div>
      <div className="column is-one-third has-text-centered">
        <div className="content">
          <h2 className="is-size-4">{track.artists[0].name}</h2>
          <p>Album: <b>{track.album.name}</b></p>
          <p>Popularity: <b>{track.popularity}</b></p>
          <Link to={track.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="button is-primary ml-2">Listen on Spotify</Link>
        </div>
      </div>
      <div className="column is-one-third has-text-centered">
        <p className="is-size-4">Track Preview</p>
        <AudioPlayer src={track.preview_url}/>
      </div>
    </div>
  </div>
)


export default function UserTopContent ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [personalizationType, setPersonalizationType] = useState("artists");
  const [timePeriod, setTimePeriod] = useState("short_term");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);

  const loadContent = async () => {
    setIsLoading(true);
    const accessToken = getAccessToken(navigate, setIsAuthenticated);
    if (accessToken) {
      const authorized = await accountIsAuthorized(accessToken);
      if (!authorized) {
        alert.fire("To view your Top Spotify Content please authorize your account 🙂");
        navigate("/");
      };
      const resp = await fetch(`/api/personalization?time-period=${timePeriod}&personalization-type=${personalizationType}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        }
      });
      if (resp.status === 200) {
        const data = await resp.json();
        personalizationType === "artists" ? setArtists(data) : setTracks(data);
      } else {
        alert(`Unable to load top ${personalizationType}`);
        navigate("/");
      }
      setIsLoading(false);
    };
  }

  useEffect(() => {
    loadContent();
  }, [personalizationType, timePeriod])

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          {isLoading ? <ClipLoader size={75} cssOverride={spinnerStyle}/> :
          <div className="section m-6 p-2">
            <h1 className="title is-size-1 has-text-centered">Your Top {`${personalizationType[0].toUpperCase()}${personalizationType.slice(1)}`}</h1>
            <div className="is-flex is-justify-content-center">
              <div className="select mr-3">
                <select value={personalizationType} onChange={e => setPersonalizationType(e.target.value)}>
                  <option value="artists">Artists</option>
                  <option value="tracks">Tracks</option>
                </select>
              </div>
              <div className="select ml-3">
                <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)}>
                  <option value="short_term">Last 4 Weeks</option>
                  <option value="medium_term">Last 6 Months</option>
                  <option value="long_term">Last Several Years</option>
                </select>
              </div>
            </div>
            {personalizationType === "artists" ?
              artists.map((artist, cnt) => (
                <ArtistCard key={artist.id} artist={artist} num={cnt} />
              ))
            :
              tracks.map((track, cnt) => (
                <TrackCard key={track.id} track={track} num={cnt} />
              ))
            }
          </div>}
        </div>
      </div>
      <Footer />
    </section>
  )
}
