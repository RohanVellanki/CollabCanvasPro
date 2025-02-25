import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoomSelection from './components/RoomSelection';
import Whiteboard from './components/whiteboard'; // Ensure this matches the exact case of the filename
import './App.css';

const App = () => {
  const [canvasWidth, setCanvasWidth] = useState(1500);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);

  const renderWhiteboard = () => {
    if (!isCanvasInitialized) {
      return (
        <div className="canvas-size-controls-container">
          <div className="canvas-size-controls">
            <h2>Welcome to Collab Canvas</h2>
            <p>Set your canvas dimensions and start collaborating!</p>
            <label>
              Width (px):
              <input 
                type="number" 
                value={canvasWidth} 
                onChange={(e) => setCanvasWidth(e.target.value)} 
              />
            </label>
            <label>
              Height (px):
              <input 
                type="number" 
                value={canvasHeight} 
                onChange={(e) => setCanvasHeight(e.target.value)} 
              />
            </label>
            <button onClick={() => setIsCanvasInitialized(true)}>Initialize Canvas</button>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <Whiteboard canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/start" element={<RoomSelection />} />
        <Route path="/" element={renderWhiteboard()} />
      </Routes>
    </Router>
  );
};

export default App;
