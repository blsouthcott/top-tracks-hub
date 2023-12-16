import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";


export default function AudioPlayer ({ src, displayControls=true }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePlayPause = async () => {
    const audio = audioRef.current;

    if (playing) {
      audio.pause();
    } else {
      // Check if audio is ready to play, if not, add event listener
      if (audio.readyState < 4) {
        setIsLoading(true);
        audio.oncanplaythrough = () => {
          audio.play();
          audio.oncanplaythrough = null; // remove the event listener after it fires once
        };
      } else {
        audio.play();
      };
    }

    setPlaying(!playing);
  };

  const handleSongEnd = () => {
    setPlaying(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [playing]);

  return (
    <>
      {isLoading ? <ClipLoader /> :
        <>
        {displayControls ? 
          <audio className="audio-player" controls preload="metadata">
            <source src={src} type="audio/mpeg" />
          </audio>
        : <>
            <audio ref={audioRef} onEnded={handleSongEnd} preload="metadata">
              <source src={src} type="audio/mpeg" />
            </audio>
            {playing ? <FontAwesomeIcon className="fa-lg" icon={faPause} onClick={togglePlayPause} /> : 
            <FontAwesomeIcon className="fa-lg" icon={faPlay} onClick={togglePlayPause} /> }
          </>}
        </>
      }
    </>
  );
};
