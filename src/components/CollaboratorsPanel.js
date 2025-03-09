import React from 'react';

const CollaboratorsPanel = () => {
  const dummyCollaborators = [
    { id: 1, name: 'John Doe', color: '#FF5733', active: true },
    { id: 2, name: 'Jane Smith', color: '#33FF57', active: true },
    { id: 3, name: 'Mike Johnson', color: '#5733FF', active: false },
  ];

  return (
    <div className="collaborators-panel">
      <h3>Collaborators</h3>
      <div className="collaborators-list">
        {dummyCollaborators.map(collaborator => (
          <div key={collaborator.id} className="collaborator-item">
            <div 
              className="collaborator-avatar"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.name[0]}
            </div>
            <div className="collaborator-info">
              <span className="collaborator-name">{collaborator.name}</span>
              <span className={`status ${collaborator.active ? 'active' : 'idle'}`}>
                {collaborator.active ? 'Active' : 'Idle'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaboratorsPanel;
