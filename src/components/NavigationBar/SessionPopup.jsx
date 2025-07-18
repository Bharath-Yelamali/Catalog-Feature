import React from 'react';

function SessionPopup({
  username,
  isAdmin,
  firstName,
  lastName,
  onClose
}) {
  return (
    <div className="session-popup-overlay" onClick={onClose}>
      <div className="session-popup" onClick={e => e.stopPropagation()}>
        <div className="session-popup-title">About my session</div>
        <div className="session-popup-fields">
          <div className="session-popup-field"><span>Login Name:</span> <span>{username || 'N/A'}</span></div>
          <div className="session-popup-field"><span>Database:</span> <span>IMSStageBharath</span></div>
          <div className="session-popup-field"><span>Admin:</span> <span>{isAdmin ? 'Yes' : 'No'}</span></div>
          <div className="session-popup-field"><span>Full Name:</span> <span>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'N/A'}</span></div>
        </div>
        <button className="session-popup-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default SessionPopup;
