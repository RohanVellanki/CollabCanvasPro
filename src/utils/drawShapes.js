export const drawShapeOnCanvas = (context, params) => {
  const { shape, x, y, width, height, color, preview } = params;

  // Save the current context state
  context.save();
  
  context.beginPath();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 2;
  
  if (preview) {
    context.setLineDash([5, 5]);
  } else {
    context.setLineDash([]);
  }

  switch (shape) {
    case 'rectangle':
      context.rect(x, y, width, height);
      break;
    case 'circle':
      const radius = Math.min(Math.abs(width), Math.abs(height)) / 2;
      const circleX = x + width / 2;
      const circleY = y + height / 2;
      context.arc(circleX, circleY, radius, 0, Math.PI * 2);
      context.closePath(); // Close the path for proper filling
      break;
    case 'triangle':
      context.beginPath();
      context.moveTo(x + width / 2, y);
      context.lineTo(x + width, y + height);
      context.lineTo(x, y + height);
      context.closePath(); // Ensure triangle path is closed
      break;
    case 'line':
      context.moveTo(x, y);
      context.lineTo(x + width, y + height);
      break;
    case 'arrow':
      // Draw the line
      context.moveTo(x, y);
      context.lineTo(x + width, y + height);
      
      // Calculate arrow head
      const angle = Math.atan2(height, width);
      const headLength = 20;
      
      // Draw arrow head
      context.moveTo(x + width, y + height);
      context.lineTo(
        x + width - headLength * Math.cos(angle - Math.PI / 6),
        y + height - headLength * Math.sin(angle - Math.PI / 6)
      );
      context.moveTo(x + width, y + height);
      context.lineTo(
        x + width - headLength * Math.cos(angle + Math.PI / 6),
        y + height - headLength * Math.sin(angle + Math.PI / 6)
      );
      break;
    case 'star':
      const spikes = 5;
      const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
      const innerRadius = outerRadius * 0.4;
      const starX = x + width / 2;
      const starY = y + height / 2;
      
      context.beginPath();
      context.moveTo(starX, starY - outerRadius);
      
      for (let i = 0; i < spikes; i++) {
        const rotation = (Math.PI * 2 * i) / spikes - Math.PI / 2;
        const nextRotation = (Math.PI * 2 * (i + 0.5)) / spikes - Math.PI / 2;
        
        context.lineTo(
          starX + Math.cos(rotation) * outerRadius,
          starY + Math.sin(rotation) * outerRadius
        );
        context.lineTo(
          starX + Math.cos(nextRotation) * innerRadius,
          starY + Math.sin(nextRotation) * innerRadius
        );
      }
      context.closePath();
      break;
  }

  // Draw the shape - fill with selected color
  if (!preview && shape !== 'line' && shape !== 'arrow') {
    context.fill();
  }
  context.stroke();
  context.restore();
};
