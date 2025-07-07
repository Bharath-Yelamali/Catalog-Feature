import React from "react";

/**
 * NewPartsTable component
 * @param {Object} props
 * @param {Array} props.newParts - Array of new part objects
 */
function NewPartsTable({ newParts }) {
  if (!newParts || newParts.length === 0) return null;
  // Collect all fields that are non-empty for at least one part
  const allFields = Object.keys(newParts[0]);
  const filledFields = allFields.filter(field => newParts.some(part => part[field] && String(part[field]).trim() !== ''));
  // Limit to max 7 fields for visual containment
  const displayFields = filledFields.slice(0, 7);
  return (
    <div style={{ width: '100%', overflowX: 'auto', margin: '32px 0 0 0' }}>
      <h3 className="confirmation-summary-section">New Parts to Add</h3>
      <table className="confirmation-summary-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', margin: 0, fontSize: 13, tableLayout: 'fixed' }}>
        <thead>
          <tr className="confirmation-summary-table-header-row">
            {displayFields.map(field => (
              <th key={field} className="confirmation-summary-table-header-cell">{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {newParts.map((part, idx) => (
            <tr key={idx}>
              {displayFields.map((field, i) => (
                <td key={i} className="confirmation-summary-table-cell">{part[field] && part[field].name ? part[field].name : part[field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NewPartsTable;
