import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { styles, toClassName } from "./styles";
import HeroSection from "./heroSection";
import AudioPlayer from "./audioPlayer";
import { ClipLoader } from "react-spinners";
import { spinnerStyle } from "./spinnerStyle";
import { alert } from "../utils/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { api } from "../utils/api";


const loadContent = async (navigate, setIsLoading, personalizationType, timePeriod, setArtists, setTracks) => {
  setIsLoading(true);
  const displayTestData = JSON.parse(localStorage.getItem("displayTestData"));
  let resp = await api.accountIsAuthorized();
  let data;
  if (resp.status !== 200) {
    alert.fire({title: "Unable to check Spotify account authorization status", icon: "error"});
    navigate("/");
    return;
  } else {
    data = await resp.json();
  };
  if (!data.authorized && !displayTestData) {
    alert.fire("To view your Top Spotify Content please authorize your account 🙂");
    navigate("/");
    return;
  };
  if (displayTestData) {
    resp = await fetch(`/exampleData/top_${personalizationType}_${timePeriod}.json`);
    data = await resp.json();
    personalizationType === "artists" ? setArtists(data) : setTracks(data);
  } else {
    resp = await api.getUserTopContent(timePeriod, personalizationType);
    if (resp.status === 200) {
      data = await resp.json();
      personalizationType === "artists" ? setArtists(data) : setTracks(data);
    } else {
      alert.fire(`Unable to load top ${personalizationType}`);
      navigate("/");
      return;
    };
  };
  setIsLoading(false);
}


const TopContentCard = ({ num, name, img, cardContent }) => (
  <div className={toClassName(styles.card, styles.margins.m6)}>
    <header className={toClassName(styles.cardHeader, styles.isPrimary, styles.hasBackgroundPrimary)}>
      <h2 className={toClassName(styles.cardHeaderTitle, styles.sizes.isSize4, styles.padding.p1, styles.padding.pl4, styles.hasTextWhite)}>
        {num+1}. {name}
      </h2>
    </header>
    <div className={toClassName(styles.columns, styles.isVcentered, styles.margins.m3)}>
      <div className={toClassName(styles.column, styles.isOneThird, styles.hasTextCentered)}>
        {img}
      </div>
        {cardContent}
    </div>
  </div>
)


const ArtistCard = ({ artist, num }) => {

  const img = <img src={artist.images[0].url} alt={artist.name} style={{width: "10em"}}/>
  const cardContent = (
    <div className={toClassName(styles.column, styles.isTwoThirds)}>
      <div className={styles.content}>
        <p>Popularity: <b>{artist.popularity}</b></p>
        <p>Genres: {artist.genres.join(", ")}</p>
        <Link className={toClassName(styles.button, styles.isPrimary)} to={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">Listen on Spotify&nbsp;<FontAwesomeIcon icon={faSpotify} /></Link>
      </div>
    </div>
  )

  return <TopContentCard num={num} img={img} name={artist.name} cardContent={cardContent} />
};


const TrackCard = ({ track, num }) => {

  const img = <img src={track.album.images[0].url} alt={track.name} style={{width: "10em"}}/>
  const cardContent = (
    <>
      <div className={toClassName(styles.column, styles.isOneThird, styles.hasTextCentered)}>
        <div className={styles.content}>
          <h2 className={styles.sizes.isSize4}>{track.artists[0].name}</h2>
          <p>Album: <b>{track.album.name}</b></p>
          <p>Popularity: <b>{track.popularity}</b></p>
          <Link className={toClassName(styles.button, styles.isPrimary, styles.margins.ml2)} to={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">Listen on Spotify&nbsp;<FontAwesomeIcon icon={faSpotify} /></Link>
        </div>
      </div>
      <div className={toClassName(styles.column, styles.isOneThird, styles.hasTextCentered)}>
        <p className={styles.sizes.isSize4}>Track Preview&nbsp;<FontAwesomeIcon icon={faSpotify} /></p>
        <AudioPlayer src={track.preview_url}/>
      </div>
    </>
  )

  return <TopContentCard num={num} name={track.name} img={img} cardContent={cardContent} />
}


export default function UserTopContent ({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [personalizationType, setPersonalizationType] = useState("artists");
  const [timePeriod, setTimePeriod] = useState("short_term");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    loadContent(navigate, setIsLoading, personalizationType, timePeriod, setArtists, setTracks);
  }, [personalizationType, timePeriod])

  useEffect(() => {
    api.checkToken(setIsAuthenticated);
  }, [])

  return (
    <HeroSection content={
      <>
        {isLoading && <ClipLoader size={75} cssOverride={spinnerStyle}/>}
        {!isLoading &&
          <>
            <h1 className={toClassName(styles.title, styles.sizes.isSize1, styles.margins.mt6, styles.hasTextCentered)}>Your Top {`${personalizationType[0].toUpperCase()}${personalizationType.slice(1)}`}</h1>
            
            <div className={toClassName(styles.isFlex, styles.isJustifyContentCenter)}>
              <div className={toClassName(styles.select, styles.margins.mr3)} style={{"zIndex": 1}}>
                <select value={personalizationType} onChange={e => setPersonalizationType(e.target.value)}>
                  <option value="artists">Artists</option>
                  <option value="tracks">Tracks</option>
                </select>
              </div>
              <div className={toClassName(styles.select, styles.margins.ml3)} style={{"zIndex": 1}}>
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
          </>}
      </>
    } />
  )
}
