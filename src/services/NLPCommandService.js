class NLPCommandService {
  constructor() {
    this.patterns = {
      draw: /^draw\s+(?:a|an)?\s*(\w+)/i,
      location: /(?:in|at|on)\s+(?:the)?\s*(\w+)/i,
      size: /(\w+)\s+size/i,
      color: /(?:in|with)\s+(\w+)\s+color/i
    };

    this.predefinedShapes = {
      flower: true,
      house: true,
      tree: true,
      sun: true,
      cloud: true,
      mountain: true,
      car: true,
      bird: true
    };
  }

  isPredefinedShape(text) {
    const drawMatch = text.match(this.patterns.draw);
    if (!drawMatch) return false;
    return this.predefinedShapes.hasOwnProperty(drawMatch[1].toLowerCase());
  }

  parseNLPCommand(text) {
    const command = {
      action: 'drawPattern',
      pattern: null,
      location: 'center',
      size: 'medium',
      color: 'black',
    };

    const drawMatch = text.match(this.patterns.draw);
    if (drawMatch) {
      command.pattern = drawMatch[1].toLowerCase();
    }

    const locationMatch = text.match(this.patterns.location);
    if (locationMatch) {
      command.location = locationMatch[1].toLowerCase();
    }

    const sizeMatch = text.match(this.patterns.size);
    if (sizeMatch) {
      command.size = sizeMatch[1].toLowerCase();
    }

    const colorMatch = text.match(this.patterns.color);
    if (colorMatch) {
      command.color = colorMatch[1].toLowerCase();
    }

    return command;
  }
}

export default new NLPCommandService();
