import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Modal, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// ... existing imports ...
import './RoomSelection.css';
const RoomSelection = () => {
  const [roomId, setRoomId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoomId(newRoomId);
    setShowModal(true);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/${roomId.trim().toUpperCase()}`);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const enterRoom = () => {
    navigate(`/${generatedRoomId}`);
  };

  return (
    <Container fluid className="room-selection-container min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="main-card border-0">
              <Card.Body className="p-4">
                <h1 className="text-center mb-4 title">
                  Collab Canvas
                </h1>
                <p className="text-center subtitle mb-4">
                  Create a new room or join an existing one to start collaborating
                </p>
                
                <div className="d-grid gap-3">
                  <Button 
                    variant="primary"
                    size="lg" 
                    onClick={handleCreateRoom}
                    className="create-room-btn py-3"
                  >
                    Create New Room
                  </Button>

                  <div className="text-center">
                    <span className="divider">or</span>
                  </div>

                  <Form onSubmit={handleJoinRoom}>
                    <Form.Group className="mb-3">
                      <Form.Control 
                        type="text" 
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter Room ID"
                        className="room-input text-center"
                        maxLength={6}
                      />
                    </Form.Group>
                    <div className="d-grid">
                      <Button 
                        variant="success"
                        size="lg" 
                        type="submit"
                        className="join-room-btn py-3"
                        disabled={!roomId.trim()}
                      >
                        Join Room
                      </Button>
                    </div>
                  </Form>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal 
        show={showModal} 
        centered
        backdrop="static"
        keyboard={false}
        className="room-modal"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="w-100 text-center modal-title">Room Created!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <div className="mb-4">
            <p className="mb-2">Your room code is:</p>
            <h2 className="room-code">
              {generatedRoomId}
            </h2>
          </div>
          
          {copied && (
            <Alert variant="success" className="copy-alert py-2">
              Room ID copied to clipboard!
            </Alert>
          )}

          <Button 
            variant="outline-primary"
            onClick={copyToClipboard}
            className="copy-btn mb-3 w-100"
          >
            Copy Room ID
          </Button>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button 
            variant="primary"
            size="lg" 
            onClick={enterRoom}
            className="enter-room-btn px-5"
          >
            Enter Room
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};


// Add the export default statement
export default RoomSelection;







 
