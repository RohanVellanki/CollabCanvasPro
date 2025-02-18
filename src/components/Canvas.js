import React, { useEffect, forwardRef } from 'react';

const Canvas = forwardRef(({ 
  width, 
  height, 
  darkMode,
  onClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave 
}, ref) => {
  useEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = darkMode ? '#282c34' : '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [darkMode, ref]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ 
        border: '1px solid #e0e0e0',
        backgroundColor: darkMode ? '#282c34' : 'white',
        borderRadius: '8px',
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    />
  );
});

export default Canvas;