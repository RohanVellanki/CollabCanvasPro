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
import TemplateSelector from './TemplateSelector';
import { useShapeDrawing } from '../hooks/useShapeDrawing';
import { drawShapeOnCanvas } from '../utils/drawShapes';
import CanvasDrawingService from '../services/CanvasDrawingService';
import '../styles/Whiteboard.css';

const Whiteboard = ({ canvasWidth, canvasHeight }) => {
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
  const [drawingService, setDrawingService] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [nextShapeId, setNextShapeId] = useState(1);
  const { stickyNotes, addStickyNote, updateStickyNote, moveStickyNote, deleteStickyNote, handleCanvasClick } = useStickyNotes(tool, canvasRef);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('drawing-start', ({ x, y, color, lineWidth, opacity, tool }) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.beginPath();
      context.moveTo(x, y);
      context.strokeStyle = tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : color;
      context.lineWidth = lineWidth;
      context.globalAlpha = opacity;
    });

    newSocket.on('drawing', ({ x, y, color, lineWidth, opacity, tool }) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.lineTo(x, y);
      context.stroke();
    });

    newSocket.on('drawing-end', () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.closePath();
    });

    return () => newSocket.disconnect();
  }, [darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const service = new CanvasDrawingService(canvas);
    setDrawingService(service);
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToUndoStack();
  }, [darkMode, canvasWidth, canvasHeight]);

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

  const {
    selectedShape,
    setSelectedShape,
    isDrawingShape,
    handleShapeMouseDown,
    handleShapeMouseMove,
    handleShapeMouseUp
  } = useShapeDrawing(canvasRef, color, undoStack, setShapes, setNextShapeId, nextShapeId, saveToUndoStack);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToUndoStack();
  }, [darkMode]);

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

  const loadTemplate = (templateName) => {
    if (drawingService) {
      drawingService.loadTemplate(templateName).then(() => {
        saveToUndoStack();
      });
    }
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

  const undo = () => {
    if (undoStack.length > 1) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const lastState = undoStack[undoStack.length - 2];
      const currentState = undoStack[undoStack.length - 1];
      
      const img = new Image();
      img.src = lastState;
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, currentState]);
      };
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const nextState = redoStack[redoStack.length - 1];
      
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        setUndoStack(prev => [...prev, nextState]);
        setRedoStack(prev => prev.slice(0, -1));
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setShapes([]); // Clear shapes array
    saveToUndoStack(); // Save the cleared state
  };

  const { 
    startDrawing, 
    draw, 
    stopDrawing, 
    handleCommand 
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
    setOpacity,
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
    saveToUndoStack,
    drawShape
  });

  const handleToolChange = (newTool) => {
    setTool(newTool);
    if (selectedShape) {
      setSelectedShape(null);
    }
  };

  const handleMouseDown = (e) => {
    if (selectedShape) {
      handleShapeMouseDown(e);
    } else {
      startDrawing(e);
    }
  };

  const handleMouseMove = (e) => {
    if (selectedShape) {
      handleShapeMouseMove(e);
    } else {
      draw(e);
    }
  };

  const handleMouseUp = (e) => {
    if (selectedShape) {
      handleShapeMouseUp(e);
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
          setTool={handleToolChange}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          undo={undo}
          redo={redo}
          clearCanvas={clearCanvas}
          downloadCanvas={downloadCanvas}
        />
        <ShapeToolPanel
          selectedShape={selectedShape}
          setSelectedShape={(shape) => {
            setSelectedShape(shape);
            setTool('shape');
          }}
        />
      </div>

      <TemplateSelector loadTemplate={loadTemplate} />
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
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
