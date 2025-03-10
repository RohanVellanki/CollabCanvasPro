import React, { useRef, useState, useEffect } from "react";
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import "../styles/CameraPreview.css";

const CameraPreview = ({ darkMode }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.2);
  const [isPinching, setIsPinching] = useState(false);

  // Add cursor ref
  const cursorRef = useRef(null);

  // Update position ref with bounds checking
  const positionRef = useRef({
    lastX: window.innerWidth / 2,
    lastY: window.innerHeight / 2,
    bounds: {
      minX: 0,
      maxX: window.innerWidth,
      minY: 0,
      maxY: window.innerHeight
    }
  });

  const handDetectorRef = useRef(null);
  const cameraRef = useRef(null);

  // Add screen dimensions ref
  const screenRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      screenRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modified initialization useEffect
  useEffect(() => {
    let hands = null;
    let camera = null;

    const initializeHandTracking = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        setLoading(true);
        
        // First, get camera access with mirrored settings
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user',
            frameRate: 30,
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.transform = 'scaleX(-1)'; // Mirror the video
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = resolve;
          });
          await videoRef.current.play();
        }

        // Now initialize MediaPipe Hands
        hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
          }
        });

        hands.setOptions({
          selfieMode: false, // Changed to false since we're handling mirroring manually
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onHandResults);

        await hands.initialize();
        handDetectorRef.current = hands;

        // Finally setup the camera feed processing
        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handDetectorRef.current) {
              try {
                await handDetectorRef.current.send({ image: videoRef.current });
              } catch (err) {
                // Ignore frame processing errors
              }
            }
          },
          width: 640,
          height: 480
        });

        await camera.start();
        cameraRef.current = camera;
        setIsStreaming(true);
        setError(null);
        setLoading(false);

      } catch (err) {
        console.error('Setup error:', err);
        setError(`Camera setup error: ${err.message}`);
        setLoading(false);

        // Attempt to cleanup if initialization fails
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      }
    };

    initializeHandTracking();

    // Cleanup
    return () => {
      try {
        if (cameraRef.current) {
          cameraRef.current.stop();
        }
        if (handDetectorRef.current) {
          handDetectorRef.current.close();
        }
        if (videoRef.current?.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }
      setIsStreaming(false);
    };
  }, []);

  // Modified cursor initialization
  useEffect(() => {
    // Remove any existing cursors first
    const existingCursor = document.querySelector('.virtual-cursor');
    if (existingCursor) {
      existingCursor.remove();
    }

    const cursor = document.createElement('div');
    cursor.className = 'virtual-cursor';
    document.body.appendChild(cursor);
    cursorRef.current = cursor;

    // Set initial position
    cursor.style.left = `${window.innerWidth / 2}px`;
    cursor.style.top = `${window.innerHeight / 2}px`;

    return () => {
      if (cursor && document.body.contains(cursor)) {
        cursor.remove();
      }
    };
  }, []);

  const onHandResults = (results) => {
    if (!canvasRef.current || !results) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    try {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw camera feed
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiHandLandmarks?.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw hand landmarks
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

        // Handle mouse control
        handleMouseControl(landmarks);
      }

      canvasCtx.restore();
    } catch (err) {
      console.error('Canvas rendering error:', err);
    }
  };

  // Add new state for click feedback
  const [clickFeedback, setClickFeedback] = useState('');

  // Modify click threshold to be more sensitive
  const [clickThreshold, setClickThreshold] = useState(0.15);
  const lastClickTime = useRef(0);
  const CLICK_DELAY = 300; // Minimum time between clicks in ms
  const clickTimeoutRef = useRef(null);

  // Add this helper function for click handling
  const performClick = (x, y) => {
    const now = Date.now();
    if (now - lastClickTime.current < CLICK_DELAY) return;
    lastClickTime.current = now;

    const element = document.elementFromPoint(x, y);
    if (!element) return;

    // Create click events
    const events = [
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })
    ];

    // Dispatch all events
    events.forEach(event => {
      element.dispatchEvent(event);
      // Also dispatch to document for good measure
      document.dispatchEvent(event);
    });

    // Force focus on clickable elements
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  // Modified handleMouseControl function with better pinch detection
  const handleMouseControl = (landmarks) => {
    const indexFinger = landmarks[8];  // Index fingertip
    const thumb = landmarks[4];        // Thumb tip
    const indexMCP = landmarks[5];     // Index finger base
    const thumbMCP = landmarks[2];     // Thumb base

    // Map coordinates to entire screen
    const x = (1 - indexFinger.x) * screenRef.current.width;
    const y = indexFinger.y * screenRef.current.height;

    // Smooth movement with acceleration
    const dx = x - positionRef.current.lastX;
    const dy = y - positionRef.current.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust sensitivity based on movement speed
    const adaptiveSensitivity = sensitivity * (1 + distance * 0.01);

    // Update cursor position with bounds checking
    positionRef.current.lastX = Math.max(0, Math.min(
      screenRef.current.width,
      positionRef.current.lastX + dx * adaptiveSensitivity
    ));
    
    positionRef.current.lastY = Math.max(0, Math.min(
      screenRef.current.height,
      positionRef.current.lastY + dy * adaptiveSensitivity
    ));

    try {
      // Update virtual cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${positionRef.current.lastX}px`;
        cursorRef.current.style.top = `${positionRef.current.lastY}px`;
      }

      // Trigger mouse events
      const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: positionRef.current.lastX,
        clientY: positionRef.current.lastY,
        screenX: positionRef.current.lastX,
        screenY: positionRef.current.lastY
      });

      document.dispatchEvent(moveEvent);

      // Improved pinch detection
      const pinchDistance = Math.hypot(
        thumb.x - indexFinger.x,
        thumb.y - indexFinger.y
      );

      // Calculate natural hand size for adaptive threshold
      const handSize = Math.hypot(
        thumbMCP.x - indexMCP.x,
        thumbMCP.y - indexMCP.y
      );

      // Adaptive pinch threshold based on hand size
      const pinchThreshold = handSize * 0.15; // Adjust this value for sensitivity
      const newPinch = pinchDistance < clickThreshold;

      // Add visual feedback for pinch detection
      setClickFeedback(pinchDistance < pinchThreshold * 1.5 
        ? 'Almost clicking...' 
        : pinchDistance < pinchThreshold 
          ? 'Clicking!' 
          : '');

      if (newPinch !== isPinching) {
        setIsPinching(newPinch);
        if (cursorRef.current) {
          cursorRef.current.classList.toggle('clicking', newPinch);
        }

        // Clear any existing timeout
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }

        if (newPinch) {
          // Perform click when pinch is detected
          performClick(positionRef.current.lastX, positionRef.current.lastY);
          
          if (cursorRef.current) {
            cursorRef.current.classList.add('clicking');
          }
        } else {
          if (cursorRef.current) {
            cursorRef.current.classList.remove('clicking');
          }
        }
      }
    } catch (err) {
      console.error('Mouse event error:', err);
    }
  };

  // Add helper function for mouse events
  const simulateMouseEvent = (eventType) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: positionRef.current.lastX,
      clientY: positionRef.current.lastY,
      button: 0,
      buttons: eventType === 'mousedown' ? 1 : 0
    });

    // Find the element at cursor position
    const targetElement = document.elementFromPoint(
      positionRef.current.lastX,
      positionRef.current.lastY
    );

    // Dispatch event to both target element and document
    targetElement?.dispatchEvent(event);
    document.dispatchEvent(event);
  };

  // Cleanup click timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`camera-preview ${darkMode ? "dark" : ""}`}>
      <h3>✋ Hand Gesture Mouse Control</h3>
      <div className="camera-container">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{ 
            display: 'none',
            transform: 'scaleX(-1)', // Mirror the hidden video
            WebkitTransform: 'scaleX(-1)' // For Safari support
          }} 
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{
            width: '100%',
            borderRadius: '8px',
            transform: 'scaleX(-1)', // Mirror the canvas
            WebkitTransform: 'scaleX(-1)' // For Safari support
          }}
        />
        
        {loading && (
          <div className="camera-loading">
            Loading camera... Please wait and ensure camera permissions are granted.
          </div>
        )}
        
        {error && (
          <div className="camera-error">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <div className="camera-controls">
          <div className="detection-status">
            {isStreaming ? (
              <>
                ✅ Move hand to control cursor
                {clickFeedback && <div className="click-feedback">{clickFeedback}</div>}
                <div className="click-hint">
                  👌 Pinch thumb and index finger together to click
                </div>
              </>
            ) : (
              "Starting camera..."
            )}
            {isPinching && <div className="pinch-indicator">Click!</div>}
          </div>
          
          <div className="sensitivity-control">
            <label htmlFor="sensitivity">Cursor Sensitivity: </label>
            <input
              id="sensitivity"
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            />
          </div>

          <div className="click-threshold-control">
            <label htmlFor="clickThreshold">Click Sensitivity: </label>
            <input
              id="clickThreshold"
              type="range"
              min="0.05"
              max="0.3"
              step="0.01"
              value={clickThreshold}
              onChange={(e) => setClickThreshold(parseFloat(e.target.value))}
            />
            <span>{Math.round((1 - clickThreshold) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPreview;
