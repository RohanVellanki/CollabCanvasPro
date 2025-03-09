import React, { useRef, useEffect, useState } from 'react';

const CameraPreview = ({ darkMode }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // Add this to keep track of the stream
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream; // Store the stream reference
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError('Could not access camera');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      // Stop all tracks in the stream
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      
      // Clear the video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <div className={`camera-preview ${darkMode ? 'dark' : ''}`}>
      <h3>Camera Preview</h3>
      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0',
            display: isStreaming ? 'block' : 'none' // Hide video when not streaming
          }}
        />
        {!isStreaming && !error && (
          <div className="camera-placeholder" style={{
            backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
          }}>
            📷 Camera Off
          </div>
        )}
        {error && <div className="camera-error">{error}</div>}
        <div className="camera-controls">
          <button
            onClick={isStreaming ? stopCamera : startCamera}
            className={`camera-button ${isStreaming ? 'stop' : 'start'}`}
          >
            {isStreaming ? '📴 Stop Camera' : '📹 Start Camera'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraPreview;
