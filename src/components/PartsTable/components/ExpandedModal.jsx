import React from 'react';

function ExpandedModal({ open, label, value, onClose }) {
  if (!open) return null;
  return (
    <div className="expanded-modal-overlay" onClick={onClose}>
      <div className="expanded-modal-content" onClick={e => e.stopPropagation()}>
        <div className="expanded-modal-header">{label}</div>
        <textarea
          value={value}
          readOnly
          className="expanded-modal-textarea"
          onFocus={e => e.target.select()}
        />
        <button className="expanded-modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ExpandedModal;
