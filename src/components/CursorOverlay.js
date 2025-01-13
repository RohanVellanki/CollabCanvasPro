import React from 'react';

const CursorOverlay = ({ cursors }) => {
  return (
    <div className="cursor-overlay">
      {Object.entries(cursors).map(([id, cursor]) => (
        <div
          key={id}
          className="cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="cursor-pointer" />
          <span className="cursor-name">{cursor.name}</span>
        </div>
      ))}
    </div>
  );
};

export default CursorOverlay;