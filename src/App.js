import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Analysis from './components/Analysis';
import QuestionsPattern from './components/questions_pattern';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/questions" element={<QuestionsPattern />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
