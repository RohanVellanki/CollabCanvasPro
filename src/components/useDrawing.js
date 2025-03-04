export const useDrawing = ({
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
  saveToUndoStack,
  drawShape
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
    context.strokeStyle = tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : color;

    if(tool === 'highlighter') {
      context.globalAlpha = 0.1; // Set fixed low opacity for highlighter
      context.lineWidth = lineWidth * 2; // Make highlighter thicker
    } else {
      context.globalAlpha = opacity;
      context.lineWidth = lineWidth;
    }

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

  return {
    startDrawing,
    draw,
    stopDrawing
  };
};
