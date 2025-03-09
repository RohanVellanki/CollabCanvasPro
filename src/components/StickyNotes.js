import React from 'react';
import StickyNote from './StickyNote';

const StickyNotes = ({ notes, onAdd, onUpdate, onMove, onDelete, color }) => {
  return (
    <div className="sticky-notes-container">
      {notes && notes.map(note => (
        <StickyNote
          key={note.id}
          id={note.id}
          text={note.text}
          x={note.x}
          y={note.y}
          color={note.color || color}
          onMove={onMove}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default StickyNotes;
