import React from "react";

/**
 * AttachmentsList component
 * @param {Object} props
 * @param {Array} props.attachments - Array of File objects
 * @param {Function} props.onAttachmentsChange - Callback to update attachments
 */
function AttachmentsList({ attachments, onAttachmentsChange }) {
  return (
    <div className="confirmation-summary-attachments">
      <h4>Attachments</h4>
      <ul style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, listStyle: 'none', width: '100%' }}>
        {attachments && attachments.length > 0 ? (
          attachments.map((file, idx) => (
            <li key={idx} style={{display:'flex',alignItems:'center',gap:8, justifyContent:'center', width: '100%'}}>
              {file.name}
              <button
                type="button"
                style={{marginLeft:8,padding:'2px 8px',fontSize:12,borderRadius:4,border:'1px solid #ccc',background:'#f8f8f8',cursor:'pointer'}}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm) {
                    if (!window.confirm(`Remove attachment '${file.name}'?`)) return;
                  }
                  if (typeof onAttachmentsChange === 'function') {
                    const newAttachments = attachments.slice(0, idx).concat(attachments.slice(idx + 1));
                    onAttachmentsChange(newAttachments);
                  }
                }}
              >
                Remove
              </button>
            </li>
          ))
        ) : (
          <li className="confirmation-summary-detail-empty" style={{textAlign:'center', width:'100%'}}>No attachments uploaded.</li>
        )}
      </ul>
    </div>
  );
}

export default AttachmentsList;
