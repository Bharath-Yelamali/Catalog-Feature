import React from 'react';

function ConfirmationSummary({ selected, quantities, preqFields, newParts, attachments, goBack, onSubmit }) {
  return (
    <div style={{ maxWidth: 900, margin: '60px auto 0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 36 }}>
      <h2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 24 }}>Confirmation Summary</h2>
      <h3 style={{ marginTop: 0 }}>Selected Parts</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Inventory Item Number</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Manufacturer Part #</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Manufacturer Name</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Inventory Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(selected).map(([itemNumber, group]) => {
            const qty = quantities[itemNumber] || '';
            const part = Array.isArray(group.instances) ? group.instances[0] : group;
            return (
              <tr key={itemNumber}>
                <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center' }}>{qty}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.m_inventory_item?.item_number || 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.m_mfg_part_number || 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.m_mfg_name || 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.m_inventory_description || part.m_description || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h3>Purchase Request Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {Object.entries(preqFields).filter(([k]) => k !== 'attachments').map(([key, value]) => (
          <div key={key} style={{ marginBottom: 6 }}>
            <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
          </div>
        ))}
      </div>
      <h3>Business Justification</h3>
      <div style={{ marginBottom: 24, background: '#f8fafc', borderRadius: 6, padding: 16, border: '1px solid #e0e0e0' }}>
        {(() => {
          const fields = preqFields || {};
          const parts = [
            fields.businessJustificationProject,
            fields.businessJustificationLocation,
            fields.businessJustificationWhat,
            fields.businessJustificationWhy,
            fields.businessJustificationImpact,
            fields.businessJustificationNotes,
          ].filter(Boolean);
          return parts.length > 0 ? parts.join('. ') + '.' : <span style={{color:'#888'}}>No business justification provided.</span>;
        })()}
      </div>
      {newParts && newParts.length > 0 && (
        <>
          <h3>New Parts to Add</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {Object.keys(newParts[0]).map(field => (
                  <th key={field} style={{ border: '1px solid #ccc', padding: 8 }}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {newParts.map((part, idx) => (
                <tr key={idx}>
                  {Object.values(part).map((val, i) => (
                    <td key={i} style={{ border: '1px solid #ccc', padding: 8 }}>{val && val.name ? val.name : val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <h3>Attachments</h3>
      <ul style={{ marginBottom: 24 }}>
        {attachments && attachments.length > 0 ? (
          attachments.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))
        ) : (
          <li>No attachments uploaded.</li>
        )}
      </ul>
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <button onClick={goBack} style={{ background: '#eee', color: '#222', border: '1px solid #bbb', borderRadius: 6, padding: '10px 22px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Back</button>
        <button onClick={onSubmit} style={{ background: '#2d72d9', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Submit</button>
      </div>
    </div>
  );
}

export default ConfirmationSummary;
