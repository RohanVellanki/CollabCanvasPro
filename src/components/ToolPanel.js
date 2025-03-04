import React from 'react';
import { 
  Pencil,
  Highlighter,
  Eraser,
  StickyNote,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Moon,
  Sun
} from 'lucide-react';

const ToolPanel = ({
  color,
  setColor,
  lineWidth,
  setLineWidth,
  opacity,
  setOpacity,
  tool,
  setTool,
  darkMode,
  toggleDarkMode,
  undo,
  redo,
  clearCanvas,
  downloadCanvas
}) => {
  const handleToolClick = (toolName) => {
    setTool(toolName);
  };

  return (
    <div className="tools-row">
      <div className="tool-group">
        <button 
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => handleToolClick('pen')}
          title="Pen"
        >
          <Pencil size={20} />
        </button>
        <button 
          className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
          onClick={() => handleToolClick('highlighter')}
          title="Highlighter"
        >
          <Highlighter size={20} />
        </button>
        <button 
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => handleToolClick('eraser')}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
            
        <button 
          className={`tool-btn ${tool === 'sticky-note' ? 'active' : ''}`}
          onClick={() => handleToolClick('sticky-note')}
          title="Sticky Note"
        >
          <StickyNote size={20} />
        </button>
      </div>

      <div className="tool-group">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
          title="Color"
        />
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="slider"
          title="Line Width"
        />
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="slider"
          title="Opacity"
        />
      </div>

      <div className="tool-group">
        <button 
          onClick={undo} 
          className="tool-btn" 
          title="Undo"
          disabled={!undo}
        >
          <Undo2 size={20} />
        </button>
        <button 
          onClick={redo} 
          className="tool-btn" 
          title="Redo"
          disabled={!redo}
        >
          <Redo2 size={20} />
        </button>
        <button 
          onClick={clearCanvas} 
          className="tool-btn" 
          title="Clear Canvas"
        >
          <Trash2 size={20} />
        </button>
        <button onClick={downloadCanvas} className="tool-btn" title="Download">
          <Download size={20} />
        </button>
        <button onClick={toggleDarkMode} className="tool-btn" title="Toggle Theme">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ToolPanel;
