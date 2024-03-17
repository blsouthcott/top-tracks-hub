import React, { useState, useEffect } from "react";
import { styles } from "../../utils/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";


const togglePlayPause = async (setIsLoading, audioRef, trackSrc, playing, setPlaying, setCurrSrc) => {
  const audio = audioRef.current;
  if (audio.src !== trackSrc) {
    audio.src = trackSrc;
    setCurrSrc(trackSrc);
  }
  if (playing) {
    audio.pause();
  } else {
    // Check if audio is ready to play, if not, add the event listener
    if (audio.readyState < 4) {
      setIsLoading(true);
      audio.oncanplaythrough = () => {
        setIsLoading(false);
        audio.play();
        audio.oncanplaythrough = null;  // remove the event listener after it fires once
      };
    } else {
      audio.play();
    };
  }
  setPlaying(!playing);
}


export const PlayPauseButton = ({ audioRef, trackSrc, currSrc, setCurrSrc, songEnded, setSongEnded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [srcIsPlaying, setSrcIsPlaying] = useState(false);
  
  const handleTogglePlayPause = () => togglePlayPause(setIsLoading, audioRef, trackSrc, srcIsPlaying, setSrcIsPlaying, setCurrSrc);
  
  useEffect(() => {
    if (currSrc !== trackSrc) {
      setSrcIsPlaying(false);
    };
  }, [currSrc])

  useEffect(() => {
    if (songEnded) {
      setSrcIsPlaying(false);
      setSongEnded(false);
    };
  }, [songEnded])

  return (
    <>
      {isLoading && <ClipLoader size={20}/>}
      {!isLoading &&
        <>
          {srcIsPlaying && <FontAwesomeIcon className={styles.faLg} icon={faPause} onClick={handleTogglePlayPause} />} 
          {!srcIsPlaying && <FontAwesomeIcon className={styles.faLg} icon={faPlay} onClick={handleTogglePlayPause} />}
        </>
      }
    </>
  )
}


export default function AudioPlayer ({ audioRef, src, setSongEnded, visible=false, displayControls=false }) {
  const handleSongEnd = () => setSongEnded(true);
  return (
    <audio ref={audioRef} onEnded={handleSongEnd} preload="auto" controls={displayControls || undefined} style={visible ? {"width": "100%"} : {"display": "none"}}>
      <source src={src} type="audio/mpeg" />
    </audio>
          
  )
}
