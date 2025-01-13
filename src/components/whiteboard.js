import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
// The debounce function limits how often a function runs
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';

const Whiteboard = () => {
  // canvasRef allows interaction with the canvas API for drawing.
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [tool, setTool] = useState('pen'); // pen, highlighter, eraser
  const [darkMode, setDarkMode] = useState(false);
  const [socket, setSocket] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cursors, setCursors] = useState({});

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // For smoother drawing
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state
    saveToUndoStack();
  }, [darkMode]);

  // Auto-save functionality
  const autoSave = debounce(() => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    localStorage.setItem('whiteboard-state', dataUrl);
  }, 1000);

  const saveToUndoStack = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setUndoStack(prev => [...prev, dataUrl]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 1) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const lastState = undoStack[undoStack.length - 2];
      
      const img = new Image();
      img.src = lastState;
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };

      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, undoStack[undoStack.length - 1]]);
    }
  };

  const redo = () => {
    if(redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      
      setUndoStack(prev => [...prev, nextState]);
      setRedoStack(prev => prev.slice(0, -1));
      
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    // Converts mouse coordinates (clientX, clientY) to canvas coordinates using getBoundingClientRect()
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    context.beginPath();
    setLastPosition({ x, y });
    setIsDrawing(true);
    if(socket) 
    {
      // emit: Sends the start position to the server
      socket.emit('drawing-start', { x, y, color, lineWidth, opacity, tool });
    }
  };

  const draw = (e) => {
    if(!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    if(tool === 'highlighter') 
    {
      context.globalAlpha = 0.05;
      context.lineWidth = lineWidth * 2.5;
    } 
    else 
    {
      context.globalAlpha = opacity;
      context.lineWidth = lineWidth;
    }
    context.strokeStyle = tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : color;
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.stroke();
    setLastPosition({ x, y });
    if(socket) 
    {
      socket.emit('drawing', { x, y, color, lineWidth, opacity, tool });
    }
    autoSave();
  };

  const stopDrawing = () => {
    if(isDrawing) {
      setIsDrawing(false);
      saveToUndoStack();
      
      // Emit drawing end event
      if(socket) {
        socket.emit('drawing-end');
      }
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataUrl;
    link.click();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToUndoStack();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`whiteboard-container ${darkMode ? 'dark' : ''}`}>
      <h2>Collab Canvas</h2>
      
      <ToolPanel
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        opacity={opacity}
        setOpacity={setOpacity}
        tool={tool}
        setTool={setTool}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        undo={undo}
        redo={redo}
        clearCanvas={clearCanvas}
        downloadCanvas={downloadCanvas}
      />
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={1500}
          height={800}
          style={{ 
            border: '1px solid #e0e0e0',
            backgroundColor: darkMode ? '#282c34' : 'white',
            borderRadius: '8px',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <CursorOverlay cursors={cursors} />
      </div>
    </div>
  );
};

export default Whiteboard;
