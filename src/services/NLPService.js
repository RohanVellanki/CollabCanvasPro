import { drawPatterns } from '../utils/drawPatterns';

class NLPService {
  constructor() {
    this.patterns = {
      draw: /^draw\s+(?:a|an)?\s*(\w+)/i,
      location: /(?:in|at|on)\s+(?:the)?\s*(\w+)/i,
      size: /(\w+)\s+size/i,
      color: /(?:in|with)\s+(\w+)\s+color/i
    };
  }

  parseCommand(text) {
    const command = {
      action: 'drawPattern',
      pattern: null,
      location: 'center',
      size: 'medium',
      color: 'black',
    };

    // Extract pattern
    const patternMatch = text.match(this.patterns.draw);
    if (patternMatch) {
      command.pattern = patternMatch[1].toLowerCase();
    }

    // Extract location
    const locationMatch = text.match(this.patterns.location);
    if (locationMatch) {
      command.location = locationMatch[1].toLowerCase();
    }

    // Extract size
    const sizeMatch = text.match(this.patterns.size);
    if (sizeMatch) {
      command.size = sizeMatch[1].toLowerCase();
    }

    // Extract color
    const colorMatch = text.match(this.patterns.color);
    if (colorMatch) {
      command.color = colorMatch[1].toLowerCase();
    }

    return command;
  }

  validateCommand(command) {
    return drawPatterns.hasOwnProperty(command.pattern);
  }
}

export default new NLPService();
