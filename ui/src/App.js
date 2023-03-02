import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './components/home';
import Tracks from './components/tracks';
import Navbar from './components/navBar';
import About from './components/about';
import Contact from './components/contact';
import ReportAnIssue from './components/reportAnIssue';

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
      <>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" exact element={<Home isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}/>} />
            <Route path="/tracks" exact element={<Tracks />} />
            <Route path="/about" exact element={<About />} />
            <Route path="/contact" exact element={<Contact />} />
            <Route path="/report-an-issue" exact element={<ReportAnIssue />} />
          </Routes>
        </Router>
      </>
  );
}

export default App;
