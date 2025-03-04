import React from 'react';

const TemplateSelector = ({ loadTemplate }) => {
    const templates = {
        template1: 'WebChart',
        template2: 'SWOT Analysis',
        template3: 'Template 3'
    };

    return (
        <div className="template-selector">
            <h3>Templates</h3>
            <div className="template-buttons">
                {Object.keys(templates).map(template => (
                    <button
                        key={template}
                        onClick={() => loadTemplate(template)}
                    >
                        {templates[template]}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TemplateSelector;
