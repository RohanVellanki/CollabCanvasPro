import React, { useState } from 'react';

const RoomSelection = () => {
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = () => {
    // Placeholder for create room functionality
    alert('Create Room button clicked');
  };

  const handleJoinRoom = () => {
    // Placeholder for join room functionality
    alert(`Join Room button clicked with Room ID: ${roomId}`);
  };

  return (
    <div className="room-selection">
      <button onClick={handleCreateRoom}>Create Room</button>
      <div>
        <input 
          type="text" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          placeholder="Enter Room ID" 
        />
        <button onClick={handleJoinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default RoomSelection;
