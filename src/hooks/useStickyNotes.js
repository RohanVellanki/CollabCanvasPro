import { useState } from 'react';

export const useStickyNotes = (tool, canvasRef) => {
  const [stickyNotes, setStickyNotes] = useState([]);

  const addStickyNote = (x, y) => {
    const newNote = {
      id: Date.now(),
      text: 'Double-click to edit',
      authorName: 'Author',
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
    if(tool === 'sticky-note') {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      addStickyNote(x, y);
    }
  };

  return {
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    moveStickyNote,
    deleteStickyNote,
    handleCanvasClick
  };
};
