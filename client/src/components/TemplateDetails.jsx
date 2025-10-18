import React from 'react';
import './TemplateDetails.css';

const TemplateDetails = ({ template, onClose, onUseTemplate }) => {
  if (!template) return null;

  const handleUseTemplate = () => {
    if (onUseTemplate) {
      onUseTemplate(template);
    } else {
      onClose();
    }
  };

  const getFieldLabel = (field) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Url$/, 'URL');
  };

  return (
    <div className="template-details-overlay">
      <div className="template-details-modal">
        <div className="template-details-header">
          <div className="template-details-title">
            <h2>{template.title}</h2>
            <div className="template-details-meta">
              <span className="template-type-badge">{template.type}</span>
              <span className="template-category-badge">{template.category}</span>
            </div>
          </div>
          <button className="close-details-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="template-details-content">
          <div className="template-description-section">
            <h3>Description</h3>
            <p>{template.description}</p>
          </div>

          <div className="template-fields-section">
            <h3>Template Fields & Structure</h3>
            <div className="fields-detailed-list">
              {Object.entries(template.templateData)
                .filter(([field]) => field !== 'type')
                .map(([field, value]) => (
                  <div key={field} className="field-detailed-item">
                    <div className="field-detailed-header">
                      <h4 className="field-detailed-name">
                        {getFieldLabel(field)}
                      </h4>
                      <span className="field-type">
                        {typeof value === 'boolean' 
                          ? (value ? 'Required' : 'Optional')
                          : typeof value === 'string' && value.length > 50
                          ? 'Text Area'
                          : 'Text Field'
                        }
                      </span>
                    </div>
                    
                    {value && typeof value === 'string' && (
                      <div className="field-example">
                        <strong>Example:</strong>
                        <div className="example-text">
                          {value.length > 200 ? `${value.substring(0, 200)}...` : value}
                        </div>
                      </div>
                    )}
                    
                    {template.placeholders?.[field] && (
                      <div className="field-guidance">
                        <strong>Guidance:</strong>
                        <div className="guidance-text">
                          💡 {template.placeholders[field]}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>

          <div className="template-usage-section">
            <h3>How to Use This Template</h3>
            <div className="usage-steps">
              <div className="usage-step">
                <span className="step-number">1</span>
                <span className="step-text">Click "Use Template" to open the form</span>
              </div>
              <div className="usage-step">
                <span className="step-number">2</span>
                <span className="step-text">Fill in the required fields with your content</span>
              </div>
              <div className="usage-step">
                <span className="step-number">3</span>
                <span className="step-text">Use the provided examples and guidance as reference</span>
              </div>
              <div className="usage-step">
                <span className="step-number">4</span>
                <span className="step-text">Preview and customize the template to fit your needs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="template-details-footer">
          <button className="btn-use-template" onClick={handleUseTemplate}>
            Use This Template
          </button>
          <button className="btn-close-details" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetails;