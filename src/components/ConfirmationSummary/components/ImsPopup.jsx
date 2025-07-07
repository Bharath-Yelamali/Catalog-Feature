import React from "react";

/**
 * IMS Submission Info Popup
 * @param {Object} props
 * @param {boolean} props.open - Whether the popup is visible.
 * @param {string|null} props.imsPrId - The IMS Purchase Request ID.
 * @param {function} props.onClose - Function to close the popup.
 */
function ImsPopup({ open, imsPrId, onClose }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        padding: 36,
        maxWidth: 480,
        textAlign: 'center',
        fontSize: 18,
        color: '#222',
      }}>
        <h3 style={{marginBottom: 16, color: '#3182ce'}}>Congratulations! Your Purchase Request is Uploaded</h3>
        <p style={{marginBottom: 18}}>
          <b>Your Purchase Request (PR) has been successfully uploaded to IMS.</b><br/><br/>
          The final step: <b>Click the link below and upload your quote file to complete your request.</b>
        </p>
        {imsPrId && (
          <div style={{marginBottom: 18}}>
            <a
              href={`https://chievmimsiiss01/IMSStage/?StartItem=m_Procurement_Request:${imsPrId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3182ce', fontWeight: 'bold', wordBreak: 'break-all' }}
            >
              View this PR in IMS
            </a>
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            padding: '8px 24px',
            fontSize: 16,
            borderRadius: 6,
            background: '#3182ce',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default ImsPopup;
