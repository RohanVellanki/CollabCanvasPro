import { useState } from 'react';
import { drawShapeOnCanvas } from '../utils/drawShapes';

export const useShapeDrawing = (canvasRef, color, undoStack, setShapes, setNextShapeId, nextShapeId, saveToUndoStack) => {
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartPos, setShapeStartPos] = useState({ x: 0, y: 0 });

  const handleShapeMouseDown = (e) => {
    if (!selectedShape) return; // Only handle if shape is selected
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setShapeStartPos({ x, y });
    setIsDrawingShape(true);
  };

  const handleShapeMouseMove = (e) => {
    if (!selectedShape || !isDrawingShape) return; // Only handle if shape is selected

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvasRef.current.getContext('2d');
    
    const img = new Image();
    img.src = undoStack[undoStack.length - 1];
    img.onload = () => {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.drawImage(img, 0, 0);
      
      drawShapeOnCanvas(context, {
        shape: selectedShape,
        x: shapeStartPos.x,
        y: shapeStartPos.y,
        width: x - shapeStartPos.x,
        height: y - shapeStartPos.y,
        radius: Math.abs(x - shapeStartPos.x) / 2,
        color,
        preview: true
      });
    };
  };

  const handleShapeMouseUp = (e) => {
    if (!selectedShape || !isDrawingShape) return; // Only handle if shape is selected

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvasRef.current.getContext('2d');
    
    const shapeId = `${selectedShape}_${nextShapeId}`;
    const shapeParams = {
      shape: selectedShape,
      x: shapeStartPos.x,
      y: shapeStartPos.y,
      width: x - shapeStartPos.x,
      height: y - shapeStartPos.y,
      radius: Math.abs(x - shapeStartPos.x) / 2,
      color,
      id: shapeId
    };

    drawShapeOnCanvas(context, shapeParams);
    setShapes(prev => [...prev, shapeParams]);
    setNextShapeId(nextShapeId + 1);
    setIsDrawingShape(false);
    saveToUndoStack();
  };

  return {
    selectedShape,
    setSelectedShape,
    isDrawingShape,
    handleShapeMouseDown,
    handleShapeMouseMove,
    handleShapeMouseUp
  };
};
