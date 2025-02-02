import React, { useEffect, forwardRef } from 'react';

const Canvas = forwardRef(({ width, height, darkMode }, ref) => {
    useEffect(() => {
        const canvas = ref.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Set the fill style to the desired color
            ctx.fillStyle = darkMode ? '#282c34' : '#FFFFFF'; // Example: Red color
            
            // Fill the entire canvas
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
        />
    );
});

export default Canvas;