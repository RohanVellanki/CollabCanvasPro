class CanvasDrawingService {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.initializeContext();
  }

  initializeContext() {
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  setStyle(options = {}) {
    const {
      strokeStyle,
      fillStyle,
      lineWidth,
      globalAlpha,
      tool,
      darkMode
    } = options;

    if (strokeStyle) this.context.strokeStyle = strokeStyle;
    if (fillStyle) this.context.fillStyle = fillStyle;
    if (lineWidth) this.context.lineWidth = lineWidth;
    if (globalAlpha) this.context.globalAlpha = globalAlpha;
    
    // Handle eraser tool
    if (tool === 'eraser') {
      this.context.strokeStyle = darkMode ? '#282c34' : 'white';
    }
    
    // Handle highlighter tool
    if (tool === 'highlighter') {
      this.context.globalAlpha = 0.5;
      this.context.lineWidth = (lineWidth || this.context.lineWidth) * 2.5;
    }
  }

  startPath(x, y) {
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  continuePath(x, y) {
    this.context.lineTo(x, y);
    this.context.stroke();
  }

  drawLine(startX, startY, endX, endY) {
    this.context.beginPath();
    this.context.moveTo(startX, startY);
    this.context.lineTo(endX, endY);
    this.context.stroke();
  }

  drawShape(params) {
    const { shape, x, y, width, height, radius, color } = params;
    
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;

    switch(shape) {
      case 'circle':
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        break;
      case 'rectangle':
        this.context.rect(x, y, width, height);
        break;
    }
    
    this.context.stroke();
    this.context.fill();
  }

  clearRect(x, y, width, height) {
    this.context.clearRect(x, y, width, height);
  }

  clearCanvas(darkMode) {
    this.context.fillStyle = darkMode ? '#282c34' : 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getImageData() {
    return this.canvas.toDataURL();
  }

  loadImageData(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        this.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(img, 0, 0);
        resolve();
      };
    });
  }

  loadTemplate(templateName) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = `/templates/${templateName}.png`; // Adjust the path as needed
      img.onload = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        resolve();
      };
      img.onerror = reject;
    });
  }
}

export default CanvasDrawingService;