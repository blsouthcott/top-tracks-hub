import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from './components/pages/Home';
import Account from './components/pages/Account';
import Tracks from './components/pages/Tracks';
import Navbar from './components/common/Navbar';
import About from "./components/pages/About";
import Contact from './components/pages/Contact';
import ReportAnIssue from './components/pages/ReportAnIssue';
import AddSpotifyTrackId from './components/pages/AddSpotifyTrackId';
import Signup from './components/pages/SignUp';
import UserTopContent from './components/pages/UserTopContent';


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
            <Route path="/account" exact element={
              <Account 
                isAuthenticated={isAuthenticated} 
                setIsAuthenticated={setIsAuthenticated}
              />
            }/>
            <Route path="/signup" exact element={<Signup />} />
            <Route path="/tracks" exact element={<Tracks setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/add-spotify-track-id/:trackId" exact element={<AddSpotifyTrackId setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/personalization" exact element={<UserTopContent setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/about" exact element={<About setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/contact" exact element={<Contact setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/report-an-issue" exact element={<ReportAnIssue setIsAuthenticated={setIsAuthenticated} />} />
          </Routes>
        </Router>
      </>
  );
}

export default App;
