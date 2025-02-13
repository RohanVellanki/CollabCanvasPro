import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import CommandInterface from './CommandInterface';
import StickyNote from './StickyNote';
import { useStickyNotes } from './useStickyNotes';
import { useDrawing } from './useDrawing';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [tool, setTool] = useState('pen'); 
  const [darkMode, setDarkMode] = useState(false);
  const [socket, setSocket] = useState(null);
  const [cursors, setCursors] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [nextShapeId, setNextShapeId] = useState(1);
  const { stickyNotes, addStickyNote, updateStickyNote, moveStickyNote, deleteStickyNote, handleCanvasClick } = useStickyNotes(tool, canvasRef);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToUndoStack();
  }, [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataUrl;
    link.click();
  };

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
    lineWidth,
    opacity,
    tool,
    darkMode,
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
    saveToUndoStack,
    setDarkMode
  });

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
