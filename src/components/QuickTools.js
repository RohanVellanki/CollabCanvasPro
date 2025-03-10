import React, { useState } from 'react';
import { drawShapeOnCanvas } from '../utils/drawShapes';
import { HexColorPicker } from 'react-colorful'; // Add this import
import '../styles/QuickTools.css';

const QuickTools = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  opacity, 
  setOpacity, 
  selectedShape, 
  setSelectedShape,
  canvasRef 
}) => {
  const [showShapes, setShowShapes] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const quickColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  const shapes = [
    { id: 'rectangle', icon: '⬛', label: 'Rectangle' },
    { id: 'circle', icon: '⭕', label: 'Circle' },
    { id: 'triangle', icon: '△', label: 'Triangle' },
    { id: 'line', icon: '➖', label: 'Line' },
    { id: 'arrow', icon: '➡️', label: 'Arrow' },
    { id: 'star', icon: '⭐', label: 'Star' }  // Add star shape
  ];

  const handleShapeSelect = (shapeId) => {
    if (setSelectedShape) {
      setSelectedShape(shapeId);
      setTool('shape');
      
      if (canvasRef?.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const centerX = canvas.width / 2 - 50;
        const centerY = canvas.height / 2 - 50;
        
        drawShapeOnCanvas(context, {
          shape: shapeId,
          x: centerX,
          y: centerY,
          width: 100,
          height: 100,
          radius: 50,
          color: color,
          preview: true
        });
      }
      
      setShowShapes(false);
    }
  };

  return (
    <div className="quick-tools">
      <div className="quick-tools-section">
        <h4>Tools</h4>
        <div className="tools-grid">
          <button 
            className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button 
            className={`tool-button ${tool === 'highlighter' ? 'active' : ''}`}
            onClick={() => {
              setTool('highlighter');
              setOpacity(0.4);
            }}
            title="Highlighter"
          >
            🌈
          </button>
          <button 
            className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            🧽
          </button>
          <button 
            className={`tool-button ${tool === 'sticky' ? 'active' : ''}`}
            onClick={() => setTool('sticky')}
            title="Sticky Note"
          >
            📝
          </button>
          <div className="shapes-dropdown">
            <button 
              className={`tool-button ${tool === 'shape' ? 'active' : ''}`}
              onClick={() => setShowShapes(!showShapes)}
              title="Shapes"
            >
              📐
            </button>
            {showShapes && (
              <div className="shapes-menu-expander">
                <div className="shapes-grid">
                  {shapes.map(shape => (
                    <button
                      key={shape.id}
                      className={`shape-button ${selectedShape === shape.id ? 'active' : ''}`}
                      onClick={() => handleShapeSelect(shape.id)}
                      title={shape.label}
                    >
                      <span className="shape-icon">{shape.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="quick-tools-section">
        <h4>Width</h4>
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="width-slider"
        />
        <div className="width-preview" style={{ width: lineWidth, height: lineWidth, borderRadius: '50%' }} />
      </div>

      <div className="quick-tools-section">
        <h4>Opacity</h4>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="opacity-slider"
        />
      </div>

      <div className="quick-tools-section">
        <h4>Colors</h4>
        <div className="quick-colors">
          {quickColors.map((c) => (
            <button
              key={c}
              className={`color-button ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <button
            className="custom-color-button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            title="Custom Color"
          >
            🎨
          </button>
        </div>
        {showCustomPicker && (
          <div className="custom-color-picker">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
        )}
      </div>

      <div className={`quick-tools-section shapes-section ${showShapes ? 'active' : ''}`}>
        <div className="shapes-grid">
          {shapes.map(shape => (
            <button
              key={shape.id}
              className={`shape-button ${selectedShape === shape.id ? 'active' : ''}`}
              onClick={() => handleShapeSelect(shape.id)}
              title={shape.label}
            >
              <span className="shape-icon">{shape.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickTools;
