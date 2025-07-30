import React from 'react';

const OrderDetailsModal = ({
  selectedOrder,
  onClose,
  workflowProcess,
  workflowActivities,
  renderStatusBadge,
}) => {
  if (!selectedOrder) return null;

  // Helper function for case-insensitive field matching
  const getFieldValue = (order, fieldName) => {
    const key = Object.keys(order).find((k) => k.toLowerCase() === fieldName.toLowerCase());
    return key ? order[key] : undefined;
  };

  return (
    <div className="order-details-modal">
      <div className="order-details-content">
        <div className="order-details-header">
          <h3>Order Details</h3>
          <button 
            className="order-details-close" 
            onClick={onClose}
            aria-label="Close details"
          >
            &times;
          </button>
        </div>
        <div className="order-details-body">
          <div className="order-details-summary">
            <h4>
              Order: {getFieldValue(selectedOrder, 'keyed_name') || 'Unknown Order'}
            </h4>
            <div className="order-details-status">
              Status: {renderStatusBadge(getFieldValue(selectedOrder, 'state'))}
            </div>
          </div>
          <div style={{marginBottom: 16, color: '#4a5568', fontSize: 14}}>
            <b>Note:</b> Only non-empty fields are shown below. Fields already visible in the main table (Order Name, Order ID, Status, Date Created, Last Modified) are not repeated here.
          </div>
          {/* Order Metadata Section Row */}
          <div className="order-metadata-row">
            <div className="order-details-section order-metadata-centered">
              <h4 className="order-metadata-title">Order Metadata</h4>
              <div className="order-metadata-grid">
                <div className="order-metadata-label">Created By:</div>
                <div className="order-metadata-value">{selectedOrder['created_by_id@aras.keyed_name'] || '—'}</div>
                <div className="order-metadata-label">Created On:</div>
                <div className="order-metadata-value">{selectedOrder['created_on'] ? new Date(selectedOrder['created_on']).toLocaleString() : '—'}</div>
                <div className="order-metadata-label">Modified By:</div>
                <div className="order-metadata-value">{selectedOrder['modified_by_id@aras.keyed_name'] || '—'}</div>
                <div className="order-metadata-label">Modified On:</div>
                <div className="order-metadata-value">{selectedOrder['modified_on'] ? new Date(selectedOrder['modified_on']).toLocaleString() : '—'}</div>
                <div className="order-metadata-label">Major Rev:</div>
                <div className="order-metadata-value">{selectedOrder['major_rev'] || '—'}</div>
                <div className="order-metadata-label">Generation:</div>
                <div className="order-metadata-value">{selectedOrder['generation'] || '—'}</div>
                <div className="order-metadata-label">State:</div>
                <div className="order-metadata-value">{selectedOrder['state'] || '—'}</div>
              </div>
            </div>
            <div className="order-details-section order-metadata-sidebox">
              <h4 className="order-metadata-title">Detail Info</h4>
              <div className="order-metadata-detailinfo">
                {selectedOrder['m_detail_info'] || <span style={{color:'#888'}}>No detail info provided.</span>}
              </div>
            </div>
          </div>
          {/* Procurement Workflow Diagram */}
          <div className="order-details-section" style={{margin: '0 0 24px 0', padding: '32px 32px', background: '#f0f7fa', borderRadius: 12, border: '2px solid #b6d4e2'}}>
            <h4 style={{margin: '0 0 18px 0', fontWeight: 600, fontSize: 20}}>Procurement Workflow</h4>
            <div style={{width: '100%', overflowX: 'auto', overflowY: 'hidden', position: 'relative'}}>
              {/* On Hold above Submitted with upward arrow centered */}
              <div style={{position: 'absolute', left: 255, top: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60}}>
                <div style={{padding: '2px 8px', background: '#e2e8f0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center'}}>On Hold</div>
                <span style={{fontSize: 18, color: '#4a5568', margin: '2px 0'}}>↑</span>
              </div>
              {/* On Hold above Pending Approval with upward arrow centered */}
              <div style={{position: 'absolute', left: 385, top: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100}}>
                <div style={{padding: '2px 8px', background: '#e2e8f0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center'}}>On Hold</div>
                <span style={{fontSize: 18, color: '#4a5568', margin: '2px 0'}}>↑</span>
              </div>
              {/* Cancel below Pending Approval with downward arrow */}
              <div style={{position: 'absolute', left: 385, top: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100}}>
                <span style={{fontSize: 18, color: '#a00', margin: '2px 0'}}>↓</span>
                <div style={{padding: '2px 8px', background: '#ffe0e0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center', color: '#a00'}}>Cancel</div>
              </div>
              {/* Highlight the current state in the workflow diagram */}
              {(() => {
                const workflowStates = [
                  'Start','New','Submitted','Pending Approval','Assign Shipment','Pending Invoice','Invoice','Pending Payment','Paid','Complete'
                ];
                const currentState = selectedOrder && (selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name'] || selectedOrder['state']);
                return (
                  <div style={{display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, minHeight: 160, minWidth: 1800, justifyContent: 'flex-start'}}>
                    {workflowStates.map((state, idx, arr) => (
                      <React.Fragment key={state}>
                        <div
                          style={{
                            padding: '2px 8px',
                            background: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '#dbeafe' : '#e2e8f0',
                            borderRadius: 14,
                            fontWeight: 600,
                            fontSize: 12,
                            minWidth: state.length > 8 ? 100 : 60,
                            textAlign: 'center',
                            position: 'relative',
                            border: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '2px solid #3182ce' : 'none',
                            color: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '#1e293b' : undefined,
                            boxShadow: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '0 0 0 3px #3182ce, 0 2px 8px #3182ce33' : undefined,
                            zIndex: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? 2 : 1,
                          }}
                        >
                          {state}
                        </div>
                        {idx < arr.length - 1 && (
                          <span style={{margin: '0 10px', fontSize: 18, color: '#4a5568'}}>→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
            </div>
            {/* --- Workflow Info Section --- */}
            {(workflowProcess || workflowActivities.length > 0) && (
              <div style={{marginTop: 24, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18}}>
                <h5 style={{margin: '0 0 10px 0', fontWeight: 600, fontSize: 16}}>Workflow Info</h5>
                {workflowProcess && (
                  <div style={{marginBottom: 8, fontSize: 15}}>
                    <b>Current Owner/Assignee:</b> {workflowProcess['process_owner@aras.keyed_name'] || '—'}<br/>
                    <b>Workflow Name:</b> {workflowProcess.label || workflowProcess.name || workflowProcess['label@aras.lang'] || '—'}<br/>
                    <b>Status:</b> {workflowProcess.state || workflowProcess['current_state@aras.name'] || '—'}<br/>
                    <b>Started:</b> {workflowProcess.active_date ? new Date(workflowProcess.active_date).toLocaleString() : '—'}<br/>
                    {workflowProcess.closed_date && (<><b>Closed:</b> {new Date(workflowProcess.closed_date).toLocaleString()}<br/></>)}
                  </div>
                )}
                {workflowActivities.length > 0 && (
                  <div style={{marginBottom: 8, fontSize: 15}}>
                    <b>Last Action:</b> {workflowActivities[0]['related_id@aras.keyed_name'] || '—'} by {workflowActivities[0]['created_by_id@aras.keyed_name'] || '—'} on {workflowActivities[0].created_on ? new Date(workflowActivities[0].created_on).toLocaleString() : '—'}
                  </div>
                )}
                {workflowActivities.length > 0 && (
                  <div style={{marginTop: 10}}>
                    <b>Order Timeline:</b>
                    <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'none', fontSize: 14}}>
                      {workflowActivities.slice(0, 8).map((act, i) => (
                        <li key={i} style={{marginBottom: 2}}>
                          <span style={{fontWeight: 500}}>{act['related_id@aras.keyed_name'] || '—'}</span> by <span>{act['created_by_id@aras.keyed_name'] || '—'}</span> on <span>{act.created_on ? new Date(act.created_on).toLocaleString() : '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="order-details-grid">
            {/* Only show the curated list of fields, grouped and labeled, but skip those already in the main table and those that are empty/null */}
            {/* 1. Project & Supplier */}
            {selectedOrder['m_project@aras.keyed_name'] && <div className="order-details-item"><div className="order-details-label">Project</div><div className="order-details-value">{selectedOrder['m_project@aras.keyed_name']}</div></div>}
            {selectedOrder['m_supplier@aras.keyed_name'] && <div className="order-details-item"><div className="order-details-label">Supplier</div><div className="order-details-value">{selectedOrder['m_supplier@aras.keyed_name']}</div></div>}
            {selectedOrder['m_po_num'] && <div className="order-details-item"><div className="order-details-label">PO Number</div><div className="order-details-value">{selectedOrder['m_po_num']}</div></div>}
            {selectedOrder['m_po_owner'] && <div className="order-details-item"><div className="order-details-label">PO Owner</div><div className="order-details-value">{selectedOrder['m_po_owner']}</div></div>}
            {selectedOrder['m_coordinator'] && <div className="order-details-item"><div className="order-details-label">Coordinator</div><div className="order-details-value">{selectedOrder['m_coordinator']}</div></div>}
            {/* 2. Financial & Purchase Details */}
            {selectedOrder['m_total_price'] && <div className="order-details-item"><div className="order-details-label">Total Price</div><div className="order-details-value">{selectedOrder['m_total_price']}</div></div>}
            {selectedOrder['m_currency'] && <div className="order-details-item"><div className="order-details-label">Currency</div><div className="order-details-value">{selectedOrder['m_currency']}</div></div>}
            {selectedOrder['m_purchase_type'] && <div className="order-details-item"><div className="order-details-label">Purchase Type</div><div className="order-details-value">{selectedOrder['m_purchase_type']}</div></div>}
            {selectedOrder['m_is_capex'] && <div className="order-details-item"><div className="order-details-label">Is Capex</div><div className="order-details-value">{selectedOrder['m_is_capex'] === '1' ? 'Yes' : selectedOrder['m_is_capex'] === '0' ? 'No' : ''}</div></div>}
            {selectedOrder['m_io_num'] && <div className="order-details-item"><div className="order-details-label">IO Number</div><div className="order-details-value">{selectedOrder['m_io_num']}</div></div>}
            {/* 3. Delivery & Contact */}
            {selectedOrder['m_delivery_location'] && <div className="order-details-item"><div className="order-details-label">Delivery Location</div><div className="order-details-value">{selectedOrder['m_delivery_location']}</div></div>}
            {selectedOrder['m_deliverto_msft'] && <div className="order-details-item"><div className="order-details-label">Deliver to MSFT</div><div className="order-details-value">{selectedOrder['m_deliverto_msft']}</div></div>}
            {selectedOrder['m_contact'] && <div className="order-details-item"><div className="order-details-label">Contact</div><div className="order-details-value">{selectedOrder['m_contact']}</div></div>}
            {selectedOrder['m_email'] && <div className="order-details-item"><div className="order-details-label">Email</div><div className="order-details-value">{selectedOrder['m_email']}</div></div>}
            {selectedOrder['m_email_alias'] && <div className="order-details-item"><div className="order-details-label">Email Alias</div><div className="order-details-value">{selectedOrder['m_email_alias']}</div></div>}
            {/* 4. Approval & Review */}
            {selectedOrder['m_reviewer'] && <div className="order-details-item"><div className="order-details-label">Reviewer</div><div className="order-details-value">{selectedOrder['m_reviewer']}</div></div>}
            {selectedOrder['m_invoice_approver'] !== undefined && selectedOrder['m_invoice_approver'] !== null && (
              <div className="order-details-item">
                <div className="order-details-label">Invoice Approver</div>
                <div className="order-details-value">
                  {(() => {
                    const val = selectedOrder['m_invoice_approver'];
                    if (val === 0 || val === '0') return 'PO Owner';
                    if (val === 1 || val === '1') return 'Procurement team';
                    if (val === 2 || val === '2') return selectedOrder['m_invoice_approver_other'] || 'Other';
                    if (val === 'PO Owner') return 'PO Owner';
                    if (val === 'Procurement team') return 'Procurement team';
                    if (val === 'Other') return selectedOrder['m_invoice_approver_other'] || 'Other';
                    return val;
                  })()}
                </div>
              </div>
            )}
            {selectedOrder['m_interim_approver'] && <div className="order-details-item"><div className="order-details-label">Interim Approver</div><div className="order-details-value">{selectedOrder['m_interim_approver']}</div></div>}
            {selectedOrder['m_safe_appover'] && <div className="order-details-item"><div className="order-details-label">SAFE Approver</div><div className="order-details-value">{selectedOrder['m_safe_appover']}</div></div>}
            {selectedOrder['m_is_fid'] && <div className="order-details-item"><div className="order-details-label">Is FID</div><div className="order-details-value">{selectedOrder['m_is_fid'] === '1' ? 'Yes' : selectedOrder['m_is_fid'] === '0' ? 'No' : ''}</div></div>}
            {selectedOrder['m_is_lab_tpm'] && <div className="order-details-item"><div className="order-details-label">Is Lab TPM</div><div className="order-details-value">{selectedOrder['m_is_lab_tpm'] === '1' ? 'Yes' : selectedOrder['m_is_lab_tpm'] === '0' ? 'No' : ''}</div></div>}
            {selectedOrder['m_is_msft_poc'] && <div className="order-details-item"><div className="order-details-label">Is MSFT POC</div><div className="order-details-value">{selectedOrder['m_is_msft_poc'] === '1' ? 'Yes' : selectedOrder['m_is_msft_poc'] === '0' ? 'No' : ''}</div></div>}
            {selectedOrder['m_is_po_urgent'] && <div className="order-details-item"><div className="order-details-label">Is PO Urgent</div><div className="order-details-value">{selectedOrder['m_is_po_urgent'] === '1' ? 'Yes' : selectedOrder['m_is_po_urgent'] === '0' ? 'No' : ''}</div></div>}
            {/* 5. Business Justification & Notes */}
            {/* Detail Info now appears in the right-side box above */}
            {selectedOrder['m_notes_proc'] && <div className="order-details-item"><div className="order-details-label">Notes to Procurement</div><div className="order-details-value">{selectedOrder['m_notes_proc']}</div></div>}
            {selectedOrder['m_explanation_for_wait'] && <div className="order-details-item"><div className="order-details-label">Explanation for Wait</div><div className="order-details-value">{selectedOrder['m_explanation_for_wait']}</div></div>}
            {selectedOrder['m_explanation_not_submit'] && <div className="order-details-item"><div className="order-details-label">Explanation Not Submit</div><div className="order-details-value">{selectedOrder['m_explanation_not_submit']}</div></div>}
            {selectedOrder['m_why_not_forecasted'] && <div className="order-details-item"><div className="order-details-label">Why Not Forecasted</div><div className="order-details-value">{selectedOrder['m_why_not_forecasted']}</div></div>}
            {/* 6. Workflow & Attachments */}
            {(selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name']) && <div className="order-details-item"><div className="order-details-label">Current State</div><div className="order-details-value">{selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name']}</div></div>}
            {selectedOrder['m_lineitem_options'] && <div className="order-details-item"><div className="order-details-label">Line Items</div><div className="order-details-value">{selectedOrder['m_lineitem_options']}</div></div>}
            {/* 7. Other Metadata */}
            {selectedOrder['major_rev'] && <div className="order-details-item"><div className="order-details-label">Major Rev</div><div className="order-details-value">{selectedOrder['major_rev']}</div></div>}
            {selectedOrder['generation'] && <div className="order-details-item"><div className="order-details-label">Generation</div><div className="order-details-value">{selectedOrder['generation']}</div></div>}
            {selectedOrder['is_current'] && <div className="order-details-item"><div className="order-details-label">Is Current</div><div className="order-details-value">{selectedOrder['is_current'] === '1' || selectedOrder['is_current'] === 1 ? 'Yes' : selectedOrder['is_current'] === '0' || selectedOrder['is_current'] === 0 ? 'No' : selectedOrder['is_current']}</div></div>}
            {selectedOrder['is_released'] && <div className="order-details-item"><div className="order-details-label">Is Released</div><div className="order-details-value">{selectedOrder['is_released'] === '1' || selectedOrder['is_released'] === 1 ? 'Yes' : selectedOrder['is_released'] === '0' || selectedOrder['is_released'] === 0 ? 'No' : selectedOrder['is_released']}</div></div>}
            {/* Removed: itemtype, team, files/attachments, signoff, quote */}
            {false && selectedOrder['itemtype']}
            {false && selectedOrder['permission_id@aras.keyed_name']}
            {false && selectedOrder['team_id@odata.navigationLink']}
            {false && selectedOrder['m_Procurement_Request_Files@odata.navigationLink']}
            {false && selectedOrder['m_Procurement_Request_Signoff@odata.navigationLink']}
            {false && selectedOrder['m_quote@odata.navigationLink']}
          </div>
        </div>
        <div className="order-details-footer">
          <button 
            className="order-details-button" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
