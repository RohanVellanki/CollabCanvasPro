// src/components/Whiteboard.js

import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';

// Components
import Canvas from './Canvas';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import CommandInterface from './CommandInterface';
import StickyNote from './StickyNote';

// Hooks
import { useStickyNotes } from '../hooks/useStickyNotes';
import { useDrawing } from '../hooks/useDrawing';

const Whiteboard = () => {
  // Canvas refs and state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Drawing settings
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [tool, setTool] = useState('pen');
  const [darkMode, setDarkMode] = useState(false);
  
  // Collaboration state
  const [socket, setSocket] = useState(null);
  const [cursors, setCursors] = useState({});
  
  // History state
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  // Shapes state
  const [shapes, setShapes] = useState([]);
  const [nextShapeId, setNextShapeId] = useState(1);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Initialize canvas background
  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.fillStyle = darkMode ? '#282c34' : 'white';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToUndoStack();
    }
  }, [darkMode]);

  // Auto-save functionality
  const autoSave = debounce(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      localStorage.setItem('whiteboard-state', dataUrl);
    }
  }, 1000);

  const saveToUndoStack = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setUndoStack(prev => [...prev, dataUrl]);
      setRedoStack([]);
    }
  };

  // Sticky notes functionality
  const { 
    stickyNotes, 
    addStickyNote, 
    updateStickyNote, 
    moveStickyNote, 
    deleteStickyNote, 
    handleCanvasClick 
  } = useStickyNotes(tool, canvasRef);

  // Drawing functionality
  const { 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas, 
    handleCommand, 
    undo, 
    redo 
  } = useDrawing({
    canvasRef,
    isDrawing,
    setIsDrawing,
    lastPosition,
    setLastPosition,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    opacity,
    tool,
    setTool,
    darkMode,
    setDarkMode,
    socket,
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    shapes,
    setShapes,
    nextShapeId,
    setNextShapeId,
    autoSave,
    saveToUndoStack
  });

  // Theme toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Canvas download
  const downloadCanvas = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = dataUrl;
      link.click();
    }
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
        <Canvas
          ref={canvasRef}
          width={1500}
          height={800}
          darkMode={darkMode}
          onClick={handleCanvasClick}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        {stickyNotes.map(note => (
          <StickyNote
            key={note.id}
            id={note.id}
            text={note.text}
            authorName={note.authorName}
            x={note.x}
            y={note.y}
            onMove={moveStickyNote}
            onUpdate={updateStickyNote}
            onDelete={deleteStickyNote}
          />
        ))}
        
        <CursorOverlay cursors={cursors} />
        
        <CommandInterface 
          onCommandExecute={handleCommand}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
