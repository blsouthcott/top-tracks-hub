import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from './components/home';
import Tracks from './components/tracks';
import Navbar from './components/navBar';
import About from './components/about';
import Contact from './components/contact';
import ReportAnIssue from './components/reportAnIssue';
import AddSpotifyTrackId from './components/addSpotifyTrackId';
import { backendUrl } from './config';
import { getAccessToken } from './components/getAccessToken';

function App () {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return (
      <>
        <Router>
          <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          <Routes>
            <Route path="/" exact element={
              <Home 
                isAuthenticated={isAuthenticated} 
                setIsAuthenticated={setIsAuthenticated}
              />
            }/>
            <Route path="/tracks" exact element={<Tracks setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/add-spotify-track-id/:trackId" exact element={<AddSpotifyTrackId setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/about" exact element={<About />} />
            <Route path="/contact" exact element={<Contact />} />
            <Route path="/report-an-issue" exact element={<ReportAnIssue />} />
          </Routes>
        </Router>
      </>
  );
}

export default App;
