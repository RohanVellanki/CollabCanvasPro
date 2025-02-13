import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Terminal } from 'lucide-react';

const CommandInterface = ({ onCommandExecute, darkMode }) => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showCommandBox, setShowCommandBox] = useState(true);
  const recognitionRef = useRef(null);

  const parseCoordinates = (str) => {
    const coords = str.replace('(', '').replace(')', '').split(',');
    return {
      x: parseInt(coords[0]),
      y: parseInt(coords[1])
    };
  };

  const parseCommand = (cmdString) => {
    const tokens = cmdString.toLowerCase().split(' ');
    const command = {
      action: tokens[0],
      params: {}
    };

    try {
      switch(command.action) 
      {
        case 'draw':
          if(tokens[1] === 'with') 
          { 
            command.params.action = 'draw';
            command.params.tool = 'pen';
            command.params.color = tokens[2];
            if(tokens[3] === 'width' && tokens.length >= 5) 
            {
              command.params.width = parseInt(tokens[4]);
            }
          } 
          else 
          { 
            command.params.action = 'drawShape';
            command.params.shape = tokens[1];
            const coordIndex = tokens.findIndex(t => t.startsWith('('));
            if(coordIndex !== -1) 
            {
              const coords = parseCoordinates(tokens[coordIndex]);
              command.params.x = coords.x;
              command.params.y = coords.y;
              if(command.params.shape === 'circle') 
              {
                const radiusIndex = tokens.indexOf('radius');
                if(radiusIndex !== -1) 
                {
                  command.params.radius = parseInt(tokens[radiusIndex + 1]);
                }
              } 
              else if(command.params.shape === 'rectangle') 
              {
                const widthIndex = tokens.indexOf('width');
                const heightIndex = tokens.indexOf('height');
                if(widthIndex !== -1) 
                {
                  command.params.width = parseInt(tokens[widthIndex + 1]);
                }
                if(heightIndex !== -1) 
                {
                  command.params.height = parseInt(tokens[heightIndex + 1]);
                }
              }
              const colorIndex = tokens.indexOf('color');
              if(colorIndex !== -1) 
              {
                command.params.color = tokens[colorIndex + 1];
              }
            }
          }
          break;
        case 'highlight':
          command.params.action = 'highlight';
          command.params.tool = 'highlighter';
          if(tokens[1] === 'with' && tokens.length >= 3) 
          {
            command.params.color = tokens[2];
            if(tokens[3] === 'opacity' && tokens.length >= 5) 
            {
              command.params.opacity = parseFloat(tokens[4]);
            }
          }
          break;
        case 'move':
          command.params.action = 'move';
          const shapeId = tokens[2];
          const toIndex = tokens.indexOf('to');
          if(toIndex !== -1 && tokens[toIndex + 1]) 
          {
            const coords = parseCoordinates(tokens[toIndex + 1]);
            command.params.shapeId = shapeId;
            command.params.x = coords.x;
            command.params.y = coords.y;
          }
          break;
        case 'delete':
          command.params.action = 'delete';
          command.params.shapeId = tokens[1];
          break;
        case 'erase':
          command.params.action = 'erase';
          command.params.tool = 'eraser';
          break;
        case 'clear':
          command.params.action = 'clear';
          break;
        case 'undo':
          command.params.action = 'undo';
          break;
        case 'redo':
          command.params.action = 'redo';
          break;
        case 'download':
          command.params.action = 'download';
          break;
        case 'theme':
          command.params.action = 'theme';
          command.params.mode = tokens[1];
          break;
        default:
          throw new Error('Unknown command');
      }
      return command;
    } 
    catch(error) 
    {
      return { action: 'error', params: { message: 'Invalid command format' } };
    }
  };

  const handleCommandSubmit = (e) => {
    if(e) e.preventDefault();
    const parsedCommand = parseCommand(command);
    onCommandExecute(parsedCommand);
    setCommand('');
  };

  const startVoiceRecognition = () => {
    if('webkitSpeechRecognition' in window) 
    {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice command received:', transcript);
        setCommand(transcript);
        const parsedCommand = parseCommand(transcript);
        onCommandExecute(parsedCommand);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognitionRef.current.start();
      setIsListening(true);
    } 
    else 
    {
      alert('Speech recognition is not supported in this browser.');
    }
  };
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  return (
    <div className={`command-interface ${darkMode ? 'dark' : ''}`}>
      <div className="command-controls">
        <button
          onClick={() => setShowCommandBox(!showCommandBox)}
          className="command-btn"
          title="Toggle Command Box"
        >
          <Terminal size={20} />
        </button>
        <button
          onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
          className={`command-btn ${isListening ? 'recording' : ''}`}
          title={isListening ? 'Stop Recording' : 'Start Recording'}
        >
          {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
        </button>
      </div>
      
      {showCommandBox && (
        <form onSubmit={handleCommandSubmit} className="command-form">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command (e.g., 'draw circle (100,100) radius 50 color blue')"
            className="command-input"
          />
          <button type="submit" className="command-submit">
            Execute
          </button>
        </form>
      )}
    </div>
  );
};

export default CommandInterface;