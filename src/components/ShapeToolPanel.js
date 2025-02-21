import React from 'react';
import '../styles/ShapeToolPanel.css';

const ShapeToolPanel = ({ selectedShape, setSelectedShape }) => {
  const shapes = ['circle', 'square', 'rectangle', 'star'];

  return (
    <div className="shape-tool-panel">
      <h3>Shapes</h3>
      <div className="shape-buttons">
        {shapes.map(shape => (
          <button
            key={shape}
            className={`shape-button ${selectedShape === shape ? 'selected' : ''}`}
            onClick={() => setSelectedShape(shape)}
          >
            {shape.charAt(0).toUpperCase() + shape.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShapeToolPanel;
