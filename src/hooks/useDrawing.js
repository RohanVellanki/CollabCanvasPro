// src/hooks/useDrawing.js

import { useEffect, useRef } from 'react';
import CanvasDrawingService from '../services/CanvasDrawingService';

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
  saveToUndoStack
}) => {
  const drawingServiceRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawingServiceRef.current = new CanvasDrawingService(canvasRef.current);
    }
  }, [canvasRef]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingServiceRef.current.setStyle({
      strokeStyle: color,
      lineWidth,
      globalAlpha: opacity,
      tool,
      darkMode
    });
    
    drawingServiceRef.current.startPath(x, y);
    setLastPosition({ x, y });
    setIsDrawing(true);

    if(socket) {
      socket.emit('drawing-start', { x, y, color, lineWidth, opacity, tool });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingServiceRef.current.continuePath(x, y);
    setLastPosition({ x, y });

    if(socket) {
      socket.emit('drawing', { x, y, color, lineWidth, opacity, tool });
    }
    autoSave();
  };

  const drawShape = (params) => {
    drawingServiceRef.current.drawShape(params);
    const shapeId = `${params.shape}_${nextShapeId}`;
    setShapes([...shapes, { id: shapeId, ...params }]);
    setNextShapeId(nextShapeId + 1);
    saveToUndoStack();
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

  const clearCanvas = () => {
    drawingServiceRef.current.clearCanvas(darkMode);
    saveToUndoStack();
  };

  const undo = async () => {
    if(undoStack.length > 1) {
      const lastState = undoStack[undoStack.length - 2];
      await drawingServiceRef.current.loadImageData(lastState);
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, undoStack[undoStack.length - 1]]);
    }
  };

  const redo = async () => {
    if(redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      await drawingServiceRef.current.loadImageData(nextState);
      setUndoStack(prev => [...prev, nextState]);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleCommand = (command) => {
    const drawingService = drawingServiceRef.current;
    
    switch(command.params.action) {
      case 'draw':
        if(command.params.tool === 'pen') {
          setTool('pen');
          drawingService.setStyle({
            globalAlpha: 1,
            strokeStyle: command.params.color,
            lineWidth: command.params.width
          });
        }
        break;
        
      case 'drawShape':
        drawShape(command.params);
        break;
        
      case 'highlight':
        setTool('highlighter');
        drawingService.setStyle({
          globalAlpha: command.params.opacity || 0.5,
          strokeStyle: command.params.color
        });
        break;
        
      case 'move':
        const shapeToMove = shapes.find(s => s.id === command.params.shapeId);
        if(shapeToMove) {
          drawingService.clearRect(
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
          drawingService.clearRect(
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
        drawingService.setStyle({ tool: 'eraser', darkMode });
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
        
      case 'download':
        const dataUrl = drawingService.getImageData();
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
    redo,
    drawShape
  };
};