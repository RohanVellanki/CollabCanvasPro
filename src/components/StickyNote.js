import React, { useState, useRef, useEffect } from "react";
import "../App.css"; // Import CSS

const StickyNote = ({ id, text, authorName, x, y, onMove, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const textAreaRef = useRef(null);
  const stickyNoteRef = useRef(null);

  const startDrag = (e) => {
    if (isEditing) return; // Prevent dragging while editing
    setDragging(true);
    setOffset({ x: e.clientX - x, y: e.clientY - y });
  };

  const onDrag = (e) => {
    if (!dragging) return;
    onMove(id, e.clientX - offset.x, e.clientY - offset.y);
  };

  const stopDrag = () => setDragging(false);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      // Reset height to auto before setting it to the scroll height
      textAreaRef.current.style.height = "auto"; 
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px"; 
      
      // Adjust the sticky note height based on textarea height
      if (stickyNoteRef.current) {
        stickyNoteRef.current.style.height = textAreaRef.current.scrollHeight + 50 + "px"; // Add some padding
      }
    }
  }, [text, isEditing]);

  return (
    <div
      className="sticky-note"
      ref={stickyNoteRef}
      style={{ left: x, top: y }}
      onMouseDown={startDrag}
      onMouseMove={onDrag}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <button className="delete-button" onClick={() => onDelete(id)}>✖</button>

      {isEditing ? (
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => onUpdate(id, e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="sticky-note-textarea"
          onInput={(e) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = e.target.scrollHeight + "px"; // Adjust height dynamically
            // Adjust sticky note height based on textarea size
            if (stickyNoteRef.current) {
              stickyNoteRef.current.style.height = e.target.scrollHeight + 50 + "px"; // Add some padding
            }
          }}
        />
      ) : (
        <div onDoubleClick={() => setIsEditing(true)} className="sticky-note-text">
          {text}
        </div>
      )}

      <div className="sticky-note-footer">{authorName}</div>
    </div>
  );
};

export default StickyNote;
