import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import CommandInterface from './CommandInterface';
import StickyNote from './StickyNote';
import { useStickyNotes } from '../hooks/useStickyNotes';
import { useDrawing } from './useDrawing';
import TemplateSelector from './TemplateSelector';
import { useShapeDrawing } from '../hooks/useShapeDrawing';
import { drawShapeOnCanvas } from '../utils/drawShapes';
import CanvasDrawingService from '../services/CanvasDrawingService';
import '../styles/Whiteboard.css';
import { drawPatterns, getCanvasPosition } from '../utils/drawPatterns';
import CollaboratorsPanel from './CollaboratorsPanel';
import QuickTools from './QuickTools';
import StickyNotes from './StickyNotes';
import RightSidebar from './RightSidebar';

const Whiteboard = (canvasWidth, canvasHeight) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000'); // Default black
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
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const { stickyNotes, addStickyNote, updateStickyNote, moveStickyNote, deleteStickyNote } = useStickyNotes();
  const [stickyNoteMode, setStickyNoteMode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });
  const { roomId } = useParams();
  const [collaborators, setCollaborators] = useState(0);

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
    setTool('shape');
  };

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    if (roomId) {
      newSocket.emit('join-room', roomId);
    }


// Listen for room data (initial state)
newSocket.on('room-data', (data) => {
  const canvas = canvasRef.current;
  const context = canvas.getContext('2d');

  // Clear canvas first
  context.fillStyle = darkMode ? '#282c34' : 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // If there's a current state, draw it
  if (data.currentState) {
    const img = new Image();
    img.src = data.currentState;
    img.onload = () => {
      context.drawImage(img, 0, 0);
    };
  }

  // Then apply any new strokes
  if (data.strokes) {
    data.strokes.forEach(stroke => {
      if (stroke.type === 'start') {
        context.beginPath();
        context.moveTo(stroke.x, stroke.y);
        context.strokeStyle = stroke.tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : stroke.color;
        context.lineWidth = stroke.lineWidth;
        context.globalAlpha = stroke.opacity;
      } else if (stroke.type === 'draw') {
        context.lineTo(stroke.x, stroke.y);
        context.stroke();
              }
            });
          }
        });








    newSocket.on('canvas-state-update', (dataUrl) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        context.drawImage(img, 0, 0);
      };
    });

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

        // Add these new listeners
        newSocket.on('user-joined', (count) => {
          setCollaborators(count);
        });
      
        newSocket.on('user-left', (count) => {
          setCollaborators(count);
        });
      
        newSocket.on('canvas-undo-update', ({ lastState, undoStack: newUndoStack, redoStack: newRedoStack }) => {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          // Clear canvas first
          context.fillStyle = darkMode ? '#282c34' : 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the previous state
          const img = new Image();
          img.src = lastState;
          img.onload = () => {
            context.drawImage(img, 0, 0);
            // Update local stacks
            setUndoStack(newUndoStack);
            setRedoStack(newRedoStack);
          };
        });
      
        newSocket.on('canvas-redo-update', ({ nextState, undoStack: newUndoStack, redoStack: newRedoStack }) => {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          // Clear canvas first
          context.fillStyle = darkMode ? '#282c34' : 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the next state
          const img = new Image();
          img.src = nextState;
          img.onload = () => {
            context.drawImage(img, 0, 0);
            // Update local stacks
            setUndoStack(newUndoStack);
            setRedoStack(newRedoStack);
          };
        });
      

    return () => newSocket.disconnect();
  }, [darkMode, roomId]);

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
    // Sync canvas state with other users
    if (socket && roomId) {
      socket.emit('canvas-state', { roomId, dataUrl });
    }
  };

  const {
    selectedShape,
    setSelectedShape,
    isDrawingShape: isDrawingShapeHook,
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

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        // Get the actual container dimensions
        const containerWidth = container.clientWidth - 40; // Account for padding
        const containerHeight = container.clientHeight - 40;

        // Set canvas size to match container while maintaining aspect ratio
        setCanvasSize({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    // Initial size update
    updateCanvasSize();
    
    // Add resize listener
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    const container = document.querySelector('.canvas-container');
    if (container) {
      resizeObserver.observe(container);
    }

    // Cleanup
    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
      resizeObserver.disconnect();
    };
  }, []);

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

  // Modify the undo function
  const undo = () => {
    if (undoStack.length > 1 && socket && roomId) {
      const lastState = undoStack[undoStack.length - 2];
      const currentState = undoStack[undoStack.length - 1];
      
      // Emit the undo action to all users in the room
      socket.emit('canvas-undo', {
        roomId,
        lastState,
        currentState,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, currentState]
      });
    }
  };

  // Modify the redo function
  const redo = () => {
    if (redoStack.length > 0 && socket && roomId) {
      const nextState = redoStack[redoStack.length - 1];
      
      // Emit the redo action to all users in the room
      socket.emit('canvas-redo', {
        roomId,
        nextState,
        undoStack: [...undoStack, nextState],
        redoStack: redoStack.slice(0, -1)
      });
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
    drawShape,
    roomId
  });

  const handleToolChange = (newTool) => {
    setTool(newTool);
    setStickyNoteMode(newTool === 'sticky');
    // Set color to yellow when switching to sticky notes, black for other tools
    setColor(newTool === 'sticky' ? '#ffeb3b' : '#000000');
    if (selectedShape) {
      setSelectedShape(null);
    }
  };

  const handleMouseDown = (e) => {
    if (tool === 'shape' && selectedShape) {
      const rect = canvasRef.current.getBoundingClientRect();
      setShapeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDrawingShape(true);
      return;
    }
    if (tool === 'sticky') {
      // Don't start drawing when using sticky notes
      return;
    }
    if (selectedShape) {
      handleShapeMouseDown(e);
    } else {
      startDrawing(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingShape && selectedShape) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Clear the canvas and redraw the previous state
      const lastState = undoStack[undoStack.length - 1];
      const img = new Image();
      img.src = lastState;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);

      // Draw the shape preview
      drawShapeOnCanvas(context, {
        shape: selectedShape,
        x: shapeStart.x,
        y: shapeStart.y,
        width: currentX - shapeStart.x,
        height: currentY - shapeStart.y,
        color: color,
        preview: true
      });
      return;
    }
    if (tool === 'sticky') {
      // Don't draw when using sticky notes
      return;
    }
    if (selectedShape) {
      handleShapeMouseMove(e);
    } else {
      draw(e);
    }
  };

  const handleMouseUp = (e) => {
    if (isDrawingShape && selectedShape) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      drawShapeOnCanvas(context, {
        shape: selectedShape,
        x: shapeStart.x,
        y: shapeStart.y,
        width: currentX - shapeStart.x,
        height: currentY - shapeStart.y,
        color: color,
        preview: false
      });

      setIsDrawingShape(false);
      saveToUndoStack();
      return;
    }
    if (selectedShape) {
      handleShapeMouseUp(e);
    } else {
      stopDrawing(e);
    }
  };

  const handleClick = (e) => {
    if (tool === 'sticky') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addStickyNote({ 
        x, 
        y, 
        text: '', 
        color: '#ffeb3b' // Always use yellow for sticky notes
      });
    }
  };

  const handleCommandExecute = (command) => {
    // Handle pattern drawing commands
    if (command.action === 'drawPattern') {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const pos = getCanvasPosition(command.location, canvas);
      
      if (drawPatterns[command.pattern]) {
        drawPatterns[command.pattern](
          context,
          pos.x,
          pos.y,
          command.size,
          command.color
        );
        saveToUndoStack();
      }
      return;
    }

    // Handle basic shape and drawing commands
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    switch(command.params?.action) {
      case 'draw':
        if(command.params.tool === 'pen') {
          setTool('pen');
          context.globalAlpha = 1;
        }
        if(command.params.color) {
          setColor(command.params.color);
          context.strokeStyle = command.params.color;
        }
        if(command.params.width) {
          setLineWidth(command.params.width);
          context.lineWidth = command.params.width;
        }
        break;
      case 'drawShape':
        drawShape(command.params);
        break;
      case 'highlight':
        setTool('highlighter');
        context.globalAlpha = command.params.opacity || 0.5;
        if (command.params.color) {
          setColor(command.params.color);
          context.strokeStyle = command.params.color;
        }
        break;
      case 'erase':
        setTool('eraser');
        context.strokeStyle = darkMode ? '#282c34' : 'white';
        break;
      case 'clear':
        clearCanvas();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'theme':
        if(command.params.mode === 'dark' && !darkMode) {
          setDarkMode(true);
        } else if(command.params.mode === 'light' && darkMode) {
          setDarkMode(false);
        }
        break;
      case 'error':
        console.error('Command error:', command.params.message);
        break;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-section">
          <h1 className="logo">CollabCanvas</h1>
          <button 
            className="theme-toggle tool-button"
            onClick={toggleDarkMode}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="room-info">
      <span className="room-id">Room: {roomId}</span>
      <span className="collaborators-count">
        <svg 
          className="collaborators-icon" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        {collaborators}
      </span>
    </div>
        <div className="header-actions">
          <button className="action-button" onClick={undo} disabled={undoStack.length <= 1}>
            ↩️ Undo
          </button>
          <button className="action-button" onClick={redo} disabled={redoStack.length === 0}>
            ↪️ Redo
          </button>
          <button className="action-button" onClick={downloadCanvas}>
            💾 Save
          </button>
        </div>
      </header>

      <aside className="tools-section">
        <QuickTools
          tool={tool}
          setTool={handleToolChange}
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          opacity={opacity}
          setOpacity={setOpacity}
          selectedShape={selectedShape}
          setSelectedShape={handleShapeSelect}
          canvasRef={canvasRef}
        />
      </aside>

      <main className="canvas-section">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ 
              backgroundColor: darkMode ? '#333333' : 'white',
              borderRadius: '8px',
              width: '100%',
              height: '100%'
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <CursorOverlay cursors={cursors} />
          <StickyNotes
            notes={stickyNotes}
            onAdd={addStickyNote}
            onUpdate={updateStickyNote}
            onMove={moveStickyNote}
            onDelete={deleteStickyNote}
            color={color}
          />
        </div>
      </main>

      <RightSidebar 
        collaborators={[]} // Pass your collaborators data here
        loadTemplate={loadTemplate}
        onCommandExecute={handleCommandExecute}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Whiteboard;
