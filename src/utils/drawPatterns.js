export const drawPatterns = {
  flower: (context, x, y, size, color) => {
    const petalSize = size === 'large' ? 30 : size === 'small' ? 10 : 20;
    context.fillStyle = color;
    
    // Draw petals
    for (let i = 0; i < 6; i++) {
      context.beginPath();
      context.ellipse(
        x + Math.cos(i * Math.PI / 3) * petalSize,
        y + Math.sin(i * Math.PI / 3) * petalSize,
        petalSize, petalSize / 2,
        i * Math.PI / 3, 0, 2 * Math.PI
      );
      context.fill();
    }

    // Draw center
    context.beginPath();
    context.arc(x, y, petalSize / 2, 0, 2 * Math.PI);
    context.fillStyle = 'yellow';
    context.fill();
  },

  house: (context, x, y, size, color) => {
    const baseSize = size === 'large' ? 100 : size === 'small' ? 40 : 70;
    context.fillStyle = color;
    
    // Draw house base
    context.beginPath();
    context.rect(x - baseSize/2, y - baseSize/2, baseSize, baseSize);
    context.fill();

    // Draw roof
    context.beginPath();
    context.moveTo(x - baseSize/2, y - baseSize/2);
    context.lineTo(x + baseSize/2, y - baseSize/2);
    context.lineTo(x, y - baseSize);
    context.closePath();
    context.fill();

    // Draw door
    context.fillStyle = 'brown';
    context.fillRect(
      x - baseSize/6,
      y,
      baseSize/3,
      baseSize/2 - 5
    );
  },

  tree: (context, x, y, size, color) => {
    const baseSize = size === 'large' ? 80 : size === 'small' ? 30 : 50;
    
    // Draw trunk
    context.fillStyle = 'brown';
    context.fillRect(
      x - baseSize/8,
      y - baseSize/2,
      baseSize/4,
      baseSize
    );

    // Draw leaves
    context.fillStyle = color || 'green';
    context.beginPath();
    context.arc(x, y - baseSize/2, baseSize/2, 0, Math.PI * 2);
    context.fill();
  }
};

export const getCanvasPosition = (location, canvas) => {
  const positions = {
    center: { x: canvas.width / 2, y: canvas.height / 2 },
    top: { x: canvas.width / 2, y: canvas.height / 4 },
    bottom: { x: canvas.width / 2, y: canvas.height * 3/4 },
    left: { x: canvas.width / 4, y: canvas.height / 2 },
    right: { x: canvas.width * 3/4, y: canvas.height / 2 },
    default: { x: canvas.width / 2, y: canvas.height / 2 }
  };

  return positions[location] || positions.default;
};
