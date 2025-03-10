const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

export const drawHand = (prediction, ctx) => {
  // Check if we have landmarks
  if (!prediction || !prediction.landmarks) return;

  // Draw dots for each landmark
  for (let i = 0; i < prediction.landmarks.length; i++) {
    const x = prediction.landmarks[i][0];
    const y = prediction.landmarks[i][1];

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 3 * Math.PI);
    ctx.fillStyle = '#00FF00';
    ctx.fill();
  }

  // Draw lines between joints
  for (let finger of Object.keys(fingerJoints)) {
    const points = fingerJoints[finger].map(idx => prediction.landmarks[idx]);
    
    // Draw path
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};
