import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import CommandInterface from './CommandInterface';
import StickyNote from './StickyNote';
import { useStickyNotes } from './useStickyNotes';
import { useDrawing } from './useDrawing';
import ShapeToolPanel from './ShapeToolPanel';

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
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartPos, setShapeStartPos] = useState({ x: 0, y: 0 });

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

  const drawShape = (params) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const shapeId = `${params.shape}_${nextShapeId}`;
    context.beginPath();
    context.fillStyle = params.color;
    context.strokeStyle = params.color;
    context.lineWidth = 2;

    if (params.preview) {
      context.setLineDash([5, 5]);
    } else {
      context.setLineDash([]);
    }

    switch(params.shape) {
      case 'circle':
        context.beginPath();
        context.arc(params.x + params.radius, params.y + params.radius, params.radius, 0, Math.PI * 2);
        break;
      case 'square':
        const size = Math.min(Math.abs(params.width), Math.abs(params.height));
        context.beginPath();
        context.rect(params.x, params.y, size, size);
        break;
      case 'rectangle':
        context.beginPath();
        context.rect(params.x, params.y, params.width, params.height);
        break;
      case 'star':
        const spikes = 5;
        const outerRadius = Math.min(Math.abs(params.width), Math.abs(params.height)) / 2;
        const innerRadius = outerRadius / 2;
        const cx = params.x + outerRadius;
        const cy = params.y + outerRadius;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        context.beginPath();
        context.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          context.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
          rot += step;
          context.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
          rot += step;
        }
        context.lineTo(cx, cy - outerRadius);
        break;
    }
    
    context.stroke();
    if (!params.preview) {
      context.fill();
    }

    if (!params.preview) {
      setShapes([...shapes, { id: shapeId, ...params }]);
      setNextShapeId(nextShapeId + 1);
      saveToUndoStack();
    }
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
    setColor, // Add this line
    lineWidth,
    setLineWidth, // Add this line
    opacity,
    setOpacity, // Add this line
    tool,
    setTool, // Add this line
    darkMode,
    setDarkMode, // Add this line
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
    drawShape
  });

  const handleMouseDown = (e) => {
    if (selectedShape) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setShapeStartPos({ x, y });
      setIsDrawingShape(true);
    } else {
      startDrawing(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingShape && selectedShape) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const context = canvasRef.current.getContext('2d');
      
      // Clear the canvas and redraw from saved state
      const img = new Image();
      img.src = undoStack[undoStack.length - 1];
      img.onload = () => {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        context.drawImage(img, 0, 0);
        
        // Draw the shape preview
        drawShape({
          shape: selectedShape,
          x: shapeStartPos.x,
          y: shapeStartPos.y,
          width: x - shapeStartPos.x,
          height: y - shapeStartPos.y,
          radius: Math.abs(x - shapeStartPos.x) / 2,
          color: color,
          preview: true
        });
      };
    } else {
      draw(e);
    }
  };

  const handleMouseUp = (e) => {
    if (isDrawingShape && selectedShape) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      drawShape({
        shape: selectedShape,
        x: shapeStartPos.x,
        y: shapeStartPos.y,
        width: x - shapeStartPos.x,
        height: y - shapeStartPos.y,
        radius: Math.abs(x - shapeStartPos.x) / 2,
        color: color
      });
      
      setIsDrawingShape(false);
      saveToUndoStack();
    } else {
      stopDrawing(e);
    }
  };

  return (
    <div className={`whiteboard-container ${darkMode ? 'dark' : ''}`}>
      <h2>Collab Canvas</h2>
      <div className="toolbar">
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
        <ShapeToolPanel
          selectedShape={selectedShape}
          setSelectedShape={setSelectedShape}
        />
      </div>
      
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
