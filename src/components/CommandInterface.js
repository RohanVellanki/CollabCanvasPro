import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Terminal } from 'lucide-react';

const CommandInterface = ({ onCommandExecute, darkMode }) => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showCommandBox, setShowCommandBox] = useState(true);
  const recognitionRef = useRef(null);

  const parseCommand = (cmdString) => {
    const tokens = cmdString.toLowerCase().split(' ');
    
    const command = {
      action: tokens[0],
      params: {}
    };

    try {
      switch (command.action) {
        case 'draw':
          if (tokens[1] === 'with' && tokens.length >= 3) {
            command.params.action = 'draw';
            command.params.color = tokens[2];
            if (tokens[3] === 'width' && tokens.length >= 5) {
              command.params.width = parseInt(tokens[4]);
            }
          }
          break;
        case 'highlight':
          if (tokens[1] === 'with' && tokens.length >= 3) {
            command.params.action = 'highlight';
            command.params.color = tokens[2];
            if (tokens[3] === 'opacity' && tokens.length >= 5) {
              command.params.opacity = parseFloat(tokens[4]);
            }
          }
          break;
        case 'erase':
          command.params.action = 'erase';
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
    } catch (error) {
      return { action: 'error', params: { message: 'Invalid command format' } };
    }
  };

  const handleCommandSubmit = (e) => {
    if (e) e.preventDefault();
    const parsedCommand = parseCommand(command);
    onCommandExecute(parsedCommand);
    setCommand('');
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
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
    } else {
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
            placeholder="Enter command (e.g., 'draw with red width 5')"
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