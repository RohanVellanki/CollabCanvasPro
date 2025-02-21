export const drawShapeOnCanvas = (context, params) => {
  const { shape, x, y, width, height, radius, color, preview } = params;
  
  context.beginPath();
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 2;

  if (preview) {
    context.setLineDash([5, 5]);
  } else {
    context.setLineDash([]);
  }

  switch (shape) {
    case 'circle':
      context.beginPath();
      context.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
      break;
      
    case 'square':
      const size = Math.min(Math.abs(width), Math.abs(height));
      context.beginPath();
      context.rect(x, y, size, size);
      break;
      
    case 'rectangle':
      context.beginPath();
      context.rect(x, y, width, height);
      break;
      
    case 'star':
      const spikes = 5;
      const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
      const innerRadius = outerRadius / 2;
      const cx = x + outerRadius;
      const cy = y + outerRadius;
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;

      context.beginPath();
      context.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        context.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        context.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
      }
      context.lineTo(cx, cy - outerRadius);
      break;
  }

  context.stroke();
  if (!preview) {
    context.fill();
  }
};
