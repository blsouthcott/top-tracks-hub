import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from './components/home';
import Tracks from './components/tracks';
import Navbar from './components/navBar';
import About from './components/about';
import Contact from './components/contact';
import ReportAnIssue from './components/reportAnIssue';
import AddSpotifyTrackId from './components/addSpotifyTrackId';
import Signup from './components/signUp';
import VerifyAccount from './components/verifyAccount';
import UserTopContent from './components/userTopContent';
import Footer from './components/footer';


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
            <Route path="/signup" exact element={<Signup />}></Route>
            <Route path="/verify-account" exact element={<VerifyAccount />}></Route>
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
