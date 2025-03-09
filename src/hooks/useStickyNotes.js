import { useState } from 'react';

export const useStickyNotes = () => {
  const [stickyNotes, setStickyNotes] = useState([]);
  const [nextId, setNextId] = useState(1);

  const addStickyNote = ({ x, y, text, color }) => {
    const newNote = {
      id: nextId,
      x,
      y,
      text: text || '',
      color: color || '#ffeb3b' // Use provided color or default to yellow
    };
    setStickyNotes(prev => [...prev, newNote]);
    setNextId(prev => prev + 1);
  };

  const updateStickyNote = (id, text, color) => {
    setStickyNotes(prev =>
      prev.map(note =>
        note.id === id 
          ? { ...note, text: text || note.text, color: color || note.color }
          : note
      )
    );
  };

  const moveStickyNote = (id, x, y) => {
    setStickyNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, x, y } : note
      )
    );
  };

  const deleteStickyNote = (id) => {
    setStickyNotes(prev =>
      prev.filter(note => note.id !== id)
    );
  };

  return {
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    moveStickyNote,
    deleteStickyNote
  };
};
