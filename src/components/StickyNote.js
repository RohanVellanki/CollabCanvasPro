import React, { useState, useRef, useEffect } from "react";
import "../styles/StickyNote.css";

const StickyNote = ({ id, text: initialText, x, y, color, onMove, onUpdate, onDelete }) => {
  const [text, setText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colors = ['#ffeb3b', '#ff9800', '#f44336', '#4caf50', '#2196f3', '#9c27b0'];
  const noteRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target === noteRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - x,
        y: e.clientY - y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      onMove(id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    onUpdate(id, e.target.value, color);
  };

  const handleColorChange = (newColor) => {
    onUpdate(id, text, newColor);
    setShowColorPicker(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={noteRef}
      className="sticky-note"
      style={{
        left: x,
        top: y,
        backgroundColor: color || '#ffeb3b', // Default yellow color
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <button className="delete-button" onClick={() => onDelete(id)}>×</button>
      <button 
        className="color-picker-button"
        onClick={() => setShowColorPicker(!showColorPicker)}
        title="Change Color"
      >
        🎨
      </button>
      {showColorPicker && (
        <div className="color-picker-popup">
          {colors.map(c => (
            <button
              key={c}
              className="color-option"
              style={{ backgroundColor: c }}
              onClick={() => handleColorChange(c)}
            />
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type your note..."
        className="sticky-note-textarea"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default StickyNote;
