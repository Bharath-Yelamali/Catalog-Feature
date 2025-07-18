/**
 * ExpandedModal Component
 * ------------------------
 * Displays a modal overlay with a read-only textarea for expanded content viewing.
 *
 * - Shows when `open` is true, otherwise renders nothing.
 * - Clicking outside the modal or the close button triggers `onClose`.
 * - The textarea auto-selects its content on focus for easy copying.
 *
 * @fileoverview Modal for displaying expanded text content in the parts table.
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {string} props.label - Header label for the modal
 * @param {string} props.value - Text content to display in the textarea
 * @param {Function} props.onClose - Handler to close the modal
 * @returns {JSX.Element|null}
 */
import React from 'react';


/**
 * Modal overlay for displaying expanded text content.
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {string} props.label - Header label for the modal
 * @param {string} props.value - Text content to display
 * @param {Function} props.onClose - Handler to close the modal
 */
function ExpandedModal({ open, label, value, onClose }) {
  if (!open) return null; // Don't render if not open
  return (
    <div className="expanded-modal-overlay" onClick={onClose}>
      {/* Prevent click inside modal from closing it */}
      <div className="expanded-modal-content" onClick={e => e.stopPropagation()}>
        <div className="expanded-modal-header">{label}</div>
        <textarea
          value={value}
          readOnly
          className="expanded-modal-textarea"
          onFocus={e => e.target.select()} // Auto-select text on focus
        />
        <button className="expanded-modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ExpandedModal;
