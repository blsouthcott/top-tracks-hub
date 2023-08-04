import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";


export default function AudioPlayer ({ src, displayControls=true }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);

  const togglePlayPause = async () => {
    const audio = audioRef.current;

    if (playing) {
      audio.pause();
    } else {
      // Check if audio is ready to play, if not, add event listener
      if (audio.readyState < 4) {
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
    <div>
      {displayControls ? 
        <audio controls>
          <source src={src} type="audio/mpeg" />
        </audio>
      : <>
          <audio ref={audioRef} onEnded={handleSongEnd}>
            <source src={src} type="audio/mpeg" />
          </audio>
          {playing ? <FontAwesomeIcon className="fa-lg" icon={faPause} onClick={togglePlayPause} /> : <FontAwesomeIcon className="fa-lg" icon={faPlay} onClick={togglePlayPause} /> }
        </>}
    </div>
  );
};
