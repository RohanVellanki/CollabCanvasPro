export const predefinedPatterns = {
  flower: (context, x, y, size = 'medium', color = 'pink') => {
    const scale = size === 'large' ? 1.5 : size === 'small' ? 0.5 : 1;
    const petalSize = 20 * scale;

    // Draw petals
    context.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      context.beginPath();
      context.ellipse(
        x + Math.cos(i * Math.PI / 4) * petalSize,
        y + Math.sin(i * Math.PI / 4) * petalSize,
        petalSize, petalSize / 2,
        i * Math.PI / 4, 0, 2 * Math.PI
      );
      context.fill();
    }

    // Draw center
    context.beginPath();
    context.arc(x, y, petalSize / 2, 0, 2 * Math.PI);
    context.fillStyle = 'yellow';
    context.fill();
  },

  house: (context, x, y, size = 'medium', color = 'brown') => {
    const scale = size === 'large' ? 1.5 : size === 'small' ? 0.5 : 1;
    const baseSize = 80 * scale;

    // Draw house base
    context.fillStyle = color;
    context.fillRect(x - baseSize/2, y - baseSize/2, baseSize, baseSize);

    // Draw roof
    context.beginPath();
    context.moveTo(x - baseSize/2 - 20, y - baseSize/2);
    context.lineTo(x + baseSize/2 + 20, y - baseSize/2);
    context.lineTo(x, y - baseSize - 40);
    context.closePath();
    context.fillStyle = 'red';
    context.fill();

    // Draw door and windows
    context.fillStyle = '#4a2800';
    context.fillRect(x - 15, y, 30, 40); // door
    context.fillStyle = 'skyblue';
    context.fillRect(x - 30, y - 20, 20, 20); // left window
    context.fillRect(x + 10, y - 20, 20, 20); // right window
  },

  tree: (context, x, y, size = 'medium', color = 'green') => {
    const scale = size === 'large' ? 1.5 : size === 'small' ? 0.5 : 1;
    const baseSize = 100 * scale;

    // Draw trunk
    context.fillStyle = '#4a2800';
    context.fillRect(x - 10 * scale, y - 20 * scale, 20 * scale, 60 * scale);

    // Draw leaves
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y - 50 * scale, 40 * scale, 0, Math.PI * 2);
    context.fill();
  }
};

export const getPatternPosition = (location, canvas) => {
  const positions = {
    center: { x: canvas.width / 2, y: canvas.height / 2 },
    top: { x: canvas.width / 2, y: canvas.height * 0.25 },
    bottom: { x: canvas.width / 2, y: canvas.height * 0.75 },
    left: { x: canvas.width * 0.25, y: canvas.height / 2 },
    right: { x: canvas.width * 0.75, y: canvas.height / 2 },
    topleft: { x: canvas.width * 0.25, y: canvas.height * 0.25 },
    topright: { x: canvas.width * 0.75, y: canvas.height * 0.25 },
    bottomleft: { x: canvas.width * 0.25, y: canvas.height * 0.75 },
    bottomright: { x: canvas.width * 0.75, y: canvas.height * 0.75 }
  };

  return positions[location] || positions.center;
};
