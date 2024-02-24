import React, { useRef, useState, useEffect } from "react";
import { styles } from "./styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";


const togglePlayPause = async (setIsLoading, audioRef, playing, setPlaying) => {
  const audio = audioRef.current;
  if (playing) {
    audio.pause();
  } else {
    // Check if audio is ready to play, if not, add the event listener
    if (audio.readyState < 4) {
      setIsLoading(true);
      audio.oncanplaythrough = () => {
        audio.play();
        audio.oncanplaythrough = null;  // remove the event listener after it fires once
      };
    } else {
      audio.play();
    };
  }
  setPlaying(!playing);
}


export default function AudioPlayer ({ src, displayControls=true }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {isLoading && <ClipLoader />}
      {!isLoading &&
        <>
          {displayControls &&
            <audio className={styles.audioPlayer} controls preload="metadata">
              <source src={src} type="audio/mpeg" />
            </audio>
          }
          {!displayControls &&
            <>
              <audio ref={audioRef} onEnded={() => setPlaying(false)} preload="metadata">
                <source src={src} type="audio/mpeg" />
              </audio>
              {playing && <FontAwesomeIcon className={styles.faLg} icon={faPause} onClick={() => togglePlayPause(setIsLoading, audioRef, playing, setPlaying)} />} 
              {!playing && <FontAwesomeIcon className={styles.faLg} icon={faPlay} onClick={() => togglePlayPause(setIsLoading, audioRef, playing, setPlaying)} />}
            </>
          }
        </>
      }
    </>
  )
}
