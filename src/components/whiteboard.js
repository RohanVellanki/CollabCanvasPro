import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import CommandInterface from './CommandInterface';
import StickyNote from './StickyNote';

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
  const [stickyNotes, setStickyNotes] = useState([]);

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

  const undo = () => {
    if(undoStack.length > 1) 
    {
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
    if(redoStack.length > 0) 
    {
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
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    context.beginPath();
    setLastPosition({ x, y });
    setIsDrawing(true);
    if(socket) 
    {
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
      context.globalAlpha = 0.5;
      context.lineWidth = lineWidth * 2.5;
    } 
    else if(tool === 'pen') 
    {
      context.globalAlpha = 1;
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
    if(isDrawing) 
    {
      setIsDrawing(false);
      saveToUndoStack();
      if(socket) 
      {
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

  // params, which contains shape details like color, position, and size
  const drawShape = (params) => {
    const canvas = canvasRef.current;
    // allows us to draw on the canvas
    const context = canvas.getContext('2d');
    // Creates a unique ID for the shape
    const shapeId = `${params.shape}_${nextShapeId}`;
    context.beginPath();
    context.fillStyle = params.color;
    context.strokeStyle = params.color;
    context.lineWidth = 2;
    switch(params.shape) 
    {
      // arc() -> to draw circle with req radius, stroke() -> border, fill() -> fill color
      case 'circle':
        context.beginPath();
        context.arc(params.x, params.y, params.radius, 0, Math.PI * 2);
        context.stroke();
        context.fill();
        break;
      case 'rectangle':
        context.beginPath();
        context.rect(params.x, params.y, params.width, params.height);
        context.stroke();
        context.fill();
        break;
    }
    // Adds the new shape to the shapes list
    setShapes([...shapes, { id: shapeId, ...params }]);
    // Increases the shape ID counter for the next shape
    setNextShapeId(nextShapeId + 1);
    saveToUndoStack();
  };

  // processes different user actions like drawing, deleting, and moving shapes
  const handleCommand = (command) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    switch(command.params.action) 
    {
      // If the action is "draw" and the tool is "pen", it sets the drawing tool to pen mode.
      case 'draw':
        if(command.params.tool === 'pen') 
        {
          setTool('pen');
          context.globalAlpha = 1;
        }
        // updates the pen color
        if(command.params.color) 
        {
          setColor(command.params.color);
          context.strokeStyle = command.params.color;
        }
        // updates the pen thickness
        if(command.params.width) 
        {
          setLineWidth(command.params.width);
          context.lineWidth = command.params.width;
        }
        break;
      // to draw a new shape on the canvas
      case 'drawShape':
        drawShape(command.params);
        break;
      // calls highlighter and sets color
      case 'highlight':
        setTool('highlighter');
        context.globalAlpha = command.params.opacity || 0.5;
        if (command.params.color) {
          setColor(command.params.color);
          context.strokeStyle = command.params.color;
        }
        break;
      // Finds the shape that the user wants to move
      case 'move':
        const shapeToMove = shapes.find(s => s.id === command.params.shapeId);
        if(shapeToMove) 
        {
          // Clear the area where the shape was
          context.clearRect(
            shapeToMove.x - 2,
            shapeToMove.y - 2,
            shapeToMove.width + 4 || (shapeToMove.radius * 2) + 4,
            shapeToMove.height + 4 || (shapeToMove.radius * 2) + 4
          );
          // Draw the shape at new position
          drawShape({
            ...shapeToMove,
            x: command.params.x,
            y: command.params.y
          });
        }
        break;
      // Finds the shape to be deleted
      case 'delete':
        const shapeToDelete = shapes.find(s => s.id === command.params.shapeId);
        if(shapeToDelete) 
        {
          context.clearRect(
            shapeToDelete.x - 2,
            shapeToDelete.y - 2,
            shapeToDelete.width + 4 || (shapeToDelete.radius * 2) + 4,
            shapeToDelete.height + 4 || (shapeToDelete.radius * 2) + 4
          );
          setShapes(shapes.filter(s => s.id !== command.params.shapeId));
          saveToUndoStack();
        }
        break;
      // Uses "destination-out" mode to make brush strokes act as an eraser
      case 'erase':
        setTool('eraser');
        context.strokeStyle = darkMode ? '#282c34' : 'white';
        break;
      // Clears the entire canvas and resets all stacks
      case 'clear':
        context.fillStyle = darkMode ? '#282c34' : 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        saveToUndoStack();
        break;
      // Loads the second-last state from undoStack, redraws it, and updates redoStack
      case 'undo':
        if(undoStack.length > 1) 
        {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          const lastState = undoStack[undoStack.length - 2];
          const img = new Image();
          img.src = lastState;
          img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
            setUndoStack(prev => prev.slice(0, -1));
            setRedoStack(prev => [...prev, undoStack[undoStack.length - 1]]);
          };
        }
        break;
      // Loads image from redoStack, redraws it, updates undoStack
      case 'redo':
        if(redoStack.length > 0) 
        {
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
        break;
        // Downloads the drawing as an image
        case 'download':
          downloadCanvas();
          break;
        // Toggles between dark mode and light mode
        case 'theme':
          if(command.params.mode === 'dark' && !darkMode) 
          {
            toggleDarkMode();
          } 
          else if(command.params.mode === 'light' && darkMode) 
          {
            toggleDarkMode();
          }
          break;
        case 'error':
          console.error('Command error:', command.params.message);
          break;
    }
  };

  // === Sticky Notes Functions ===
  const addStickyNote = (x, y) => {
    const newNote = {
      id: Date.now(),
      text: 'Double-click to edit',
      authorName: 'Author',  // Default author name
      x,
      y,
    };
    setStickyNotes([...stickyNotes, newNote]);
  };

  const updateStickyNote = (id, newText) => {
    setStickyNotes(stickyNotes.map(note =>
      note.id === id ? { ...note, text: newText } : note
    ));
  };

  const moveStickyNote = (id, x, y) => {
    setStickyNotes(stickyNotes.map(note =>
      note.id === id ? { ...note, x, y } : note
    ));
  };

  const deleteStickyNote = (id) => {
    setStickyNotes(stickyNotes.filter(note => note.id !== id));
  };

  const handleCanvasClick = (e) => {
    if (tool === 'sticky-note') {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      addStickyNote(x, y);
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
        /* Render Sticky Notes */
        {stickyNotes.map(note => (
          <StickyNote
            key={note.id}
            id={note.id}
            text={note.text}
            authorName={note.authorName}  // Pass the authorName prop
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
