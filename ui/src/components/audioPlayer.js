import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";


const AudioPlayer = ({ src }) => {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSongEnd = () => {
    setPlaying(false);
  };

  return (
    <div>
      {/* <audio ref={audioRef} src={src} onEnded={handleSongEnd} controls /> */}
      <audio controls>
        <source src={src} type="audio/mpeg" />
      </audio>
      {/* {playing ? <FontAwesomeIcon className="fa-lg" icon={faPause} onClick={togglePlayPause} /> : <FontAwesomeIcon className="fa-lg" icon={faPlay} onClick={togglePlayPause} /> } */}
    </div>
  );
};

export default AudioPlayer;
