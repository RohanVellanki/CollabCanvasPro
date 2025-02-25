import React, { useState } from 'react';
import { Button, Form, Modal, Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const RoomSelection = () => {
  const [roomId, setRoomId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState('');

  const handleCreateRoom = () => {
    // Generate a 6 character random and unique code
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoomId(newRoomId);
    setShowModal(true);
  };

  const handleJoinRoom = () => {
    // Placeholder for join room functionality
    alert(`Join Room button clicked with Room ID: ${roomId}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <Container className="room-selection" style={{ marginTop: '50px', padding: '20px' }}>
      <Row className="justify-content-md-center">
        <Col md="4">
          <Card>
            <Card.Body>
              <Card.Title className="text-center">Collab Canvas</Card.Title>
              <Card.Text className="text-center">
                Create a new room or join an existing room to start collaborating.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={handleCreateRoom} className="mb-3">
                  Create Room
                </Button>
              </div>
              <Form>
                <Form.Group controlId="formRoomId">
                  <Form.Label>Enter Room ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)} 
                    placeholder="Enter Room ID" 
                  />
                </Form.Group>
                <div className="d-grid gap-2 mt-3">
                  <Button variant="success" onClick={handleJoinRoom}>
                    Join Room
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Room Created</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Your room code is: <strong>{generatedRoomId}</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoomSelection;
