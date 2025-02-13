export const useDrawing = ({
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
  clearCanvas,
  setTool,
  setColor,
  setLineWidth,
  drawShape,
  setDarkMode
}) => {
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    context.beginPath();
    setLastPosition({ x, y });
    setIsDrawing(true);
    if(socket) {
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
    if(tool === 'highlighter') {
      context.globalAlpha = 0.5;
      context.lineWidth = lineWidth * 2.5;
    } else if(tool === 'pen') {
      context.globalAlpha = 1;
      context.lineWidth = lineWidth;
    }
    context.strokeStyle = tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : color;
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.stroke();
    setLastPosition({ x, y });
    if(socket) {
      socket.emit('drawing', { x, y, color, lineWidth, opacity, tool });
    }
    autoSave();
  };

  const stopDrawing = () => {
    if(isDrawing) {
      setIsDrawing(false);
      saveToUndoStack();
      if(socket) {
        socket.emit('drawing-end');
      }
    }
  };

  const undo = () => {
    if(undoStack.length > 1) {
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

  const handleCommand = (command) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    switch(command.params.action) {
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
      case 'move':
        const shapeToMove = shapes.find(s => s.id === command.params.shapeId);
        if(shapeToMove) {
          context.clearRect(
            shapeToMove.x - 2,
            shapeToMove.y - 2,
            shapeToMove.width + 4 || (shapeToMove.radius * 2) + 4,
            shapeToMove.height + 4 || (shapeToMove.radius * 2) + 4
          );
          drawShape({
            ...shapeToMove,
            x: command.params.x,
            y: command.params.y
          });
        }
        break;
      case 'delete':
        const shapeToDelete = shapes.find(s => s.id === command.params.shapeId);
        if(shapeToDelete) {
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
      case 'erase':
        setTool('eraser');
        context.strokeStyle = darkMode ? '#282c34' : 'white';
        break;
      case 'clear':
        context.fillStyle = darkMode ? '#282c34' : 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        saveToUndoStack();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'download':
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = dataUrl;
        link.click();
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

  return {
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    handleCommand,
    undo,
    redo
  };
};
