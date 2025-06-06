import React, { useState } from 'react';

function RequiredFields({ selected, quantities, goBack }) {
  // Example required fields for a preq
  const [preqFields, setPreqFields] = useState({
    title: '',
    poNumber: '',
    poOwnerAlias: '',
    project: '',
    supplier: '',
    coordinator: '',
    purchaseType: '',
    currency: '',
    capex: false,
    ioCc: '',
    deliveryContactEmail: '',
    emailAlias: '',
    deliveryContactPhone: '',
    deliveryLocation: '',
    deliverToMsftPoc: '',
    deliverToMsftAlias: '',
    fid: false,
    fidNumber: '',
    reviewedByLabTpm: false,
    reviewer: '',
    businessJustificationProject: '',
    businessJustificationLocation: '',
    businessJustificationWhat: '',
    businessJustificationWhy: '',
    businessJustificationImpact: '',
    businessJustificationNotes: '',
    interimApproverAlias: '',
    safeApprover: '',
    ccListAlias: '',
    shippingComments: '',
    invoiceApprover: '',
    urgent: false,
  });

  const [showParts, setShowParts] = useState(false);
  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [newPartFields, setNewPartFields] = useState({
    itemNumber: '',
    mfgPartNumber: '',
    mfgName: '',
    inventoryDescription: '',
    // Add more fields as needed for a new part
  });

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setPreqFields(prev => ({ ...prev, [name]: value }));
  };

  const handleNewPartFieldChange = (e) => {
    const { name, value } = e.target;
    setNewPartFields(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewPart = () => {
    // Here you would send newPartFields to the backend or add to selection
    setShowNewPartForm(false);
    // Optionally clear fields or show a success message
  };

  // Helper to check if all required fields are filled
  const requiredFields = [
    'poOwnerAlias', 'project', 'supplier', 'purchaseType', 'deliveryContactEmail',
    'deliverToMsftAlias', 'deliveryContactPhone', 'deliveryLocation', 'fidNumber',
    'reviewer', 'invoiceApprover',
    // Business Justification required fields
    'businessJustificationProject', 'businessJustificationLocation', 'businessJustificationWhat',
    'businessJustificationWhy', 'businessJustificationImpact', 'businessJustificationNotes'
  ];
  const requiredBooleans = ['capex', 'fid', 'reviewedByLabTpm'];
  const allRequiredFilled = requiredFields.every(f => preqFields[f] && preqFields[f].toString().trim() !== '') && requiredBooleans.every(f => preqFields[f]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', paddingBottom: 60 }}>
      <div style={{ display: 'flex', width: '100vw', height: '94vh', position: 'fixed', left: 0, top: 0, right: 0, zIndex: 1 }}>
        <div style={{ flex: 1, background: '#f0f4fa', margin: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', paddingTop: 90, overflowY: 'auto' }}>
          <div style={{ width: '90%', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <button
                onClick={() => setShowParts(v => !v)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#e3e8f0',
                  border: '1px solid #bfc8d9',
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <span>Selected Parts</span>
                <span style={{ fontSize: 22, marginLeft: 12 }}>{showParts ? '▾' : '▸'}</span>
              </button>
              {showParts && (
                <div style={{ marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', margin: '0 auto' }}>
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
                </div>
              )}
            </div>
            <button
              onClick={() => setShowNewPartForm(true)}
              style={{
                width: '100%',
                background: '#2d72d9',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: 14,
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12,
                zIndex: 1,
                position: 'relative',
                transition: 'margin-top 0.2s',
                marginTop: 0
              }}
            >
              + Add New Part (Not in Database)
            </button>
            {showNewPartForm && (
              <div style={{
                background: '#fff',
                border: '1px solid #bbb',
                borderRadius: 10,
                padding: 24,
                margin: '16px 0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                width: '93%'
              }}>
                <h3 style={{marginTop:0}}>Add New Part</h3>
                <label style={{ fontWeight: 500 }}>Inventory Item Number <span style={{color:'red'}}>*</span>
                  <input type="text" name="itemNumber" value={newPartFields.itemNumber} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Inventory Item Number" />
                </label>
                <label style={{ fontWeight: 500 }}>Manufacturer Part # <span style={{color:'red'}}>*</span>
                  <input type="text" name="mfgPartNumber" value={newPartFields.mfgPartNumber} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Manufacturer Part #" />
                </label>
                <label style={{ fontWeight: 500 }}>Manufacturer Name <span style={{color:'red'}}>*</span>
                  <input type="text" name="mfgName" value={newPartFields.mfgName} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Manufacturer Name" />
                </label>
                <label style={{ fontWeight: 500 }}>Inventory Description <span style={{color:'red'}}>*</span>
                  <input type="text" name="inventoryDescription" value={newPartFields.inventoryDescription} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Inventory Description" />
                </label>
                {/* Add more required fields as needed */}
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button
                    onClick={handleAddNewPart}
                    style={{ background: '#2d72d9', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  >
                    Add Part
                  </button>
                  <button
                    onClick={() => setShowNewPartForm(false)}
                    style={{ background: '#eee', color: '#222', border: '1px solid #bbb', borderRadius: 6, padding: '10px 22px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {/* Filler to match right box height */}
            <div style={{ flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1, background: '#f0f4fa', margin: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100vh' }}>
          <div style={{
            width: '80%',
            margin: '90px auto 45px auto', // Increased top margin, added bottom margin for buffer
            background: '#fff',
            borderRadius: 12,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            maxWidth: 'none'
          }}>
            <h2 style={{ margin: 0, marginBottom: 12, fontWeight: 700, fontSize: 24 }}>Purchase Request</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 500 }}>Title
                  <input type="text" name="title" value={preqFields.title} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Title" />
                </label>
                <label style={{ fontWeight: 500 }}>PO Number #
                  <input type="text" name="poNumber" value={preqFields.poNumber} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PO Number" />
                </label>
                <label style={{ fontWeight: 500 }}>PO Owner Alias <span style={{color:'red'}}>*</span>
                  <input type="text" name="poOwnerAlias" value={preqFields.poOwnerAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PO Owner Alias" />
                </label>
                <label style={{ fontWeight: 500 }}>Project <span style={{color:'red'}}>*</span>
                  <input type="text" name="project" value={preqFields.project} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Project" />
                </label>
                <label style={{ fontWeight: 500 }}>Supplier <span style={{color:'red'}}>*</span>
                  <input type="text" name="supplier" value={preqFields.supplier} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Supplier" />
                </label>
                <label style={{ fontWeight: 500 }}>Coordinator
                  <input type="text" name="coordinator" value={preqFields.coordinator} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Coordinator" />
                </label>
                <label style={{ fontWeight: 500 }}>Purchase Type <span style={{color:'red'}}>*</span>
                  <input type="text" name="purchaseType" value={preqFields.purchaseType} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Purchase Type" />
                </label>
                <label style={{ fontWeight: 500 }}>Currency
                  <input type="text" name="currency" value={preqFields.currency} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Currency" />
                </label>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <label style={{ fontWeight: 500, marginBottom: 2 }}>Capex <span style={{color:'red'}}>*</span></label>
                    <input type="checkbox" name="capex" checked={preqFields.capex} onChange={e => setPreqFields(prev => ({ ...prev, capex: e.target.checked }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <label style={{ fontWeight: 500, marginBottom: 2 }}>FID Y/N <span style={{color:'red'}}>*</span></label>
                    <input type="checkbox" name="fid" checked={preqFields.fid} onChange={e => setPreqFields(prev => ({ ...prev, fid: e.target.checked }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <label style={{ fontWeight: 500, marginBottom: 2 }}>Reviewed By a Lab TPM <span style={{color:'red'}}>*</span></label>
                    <input type="checkbox" name="reviewedByLabTpm" checked={preqFields.reviewedByLabTpm} onChange={e => setPreqFields(prev => ({ ...prev, reviewedByLabTpm: e.target.checked }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <label style={{ fontWeight: 500, marginBottom: 2 }}>Is the PO urgent?</label>
                    <input type="checkbox" name="urgent" checked={preqFields.urgent} onChange={e => setPreqFields(prev => ({ ...prev, urgent: e.target.checked }))} />
                  </div>
                </div>
                <label style={{ fontWeight: 500 }}>IO/CC#
                  <input type="text" name="ioCc" value={preqFields.ioCc} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="IO/CC#" />
                </label>
                <label style={{ fontWeight: 500 }}>Delivery Contact Email Address <span style={{color:'red'}}>*</span>
                  <input type="email" name="deliveryContactEmail" value={preqFields.deliveryContactEmail} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Contact Email Address" />
                </label>
                <label style={{ fontWeight: 500 }}>Deliver to MSFT Alias <span style={{color:'red'}}>*</span>
                  <input type="text" name="deliverToMsftAlias" value={preqFields.deliverToMsftAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Deliver to MSFT Alias" />
                </label>
              </div>
              <div style={{ flex: 1, minWidth: 260, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 500 }}>Deliver to (MSFT POC)
                  <input type="text" name="deliverToMsftPoc" value={preqFields.deliverToMsftPoc} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Deliver to (MSFT POC)" />
                </label>
                <label style={{ fontWeight: 500 }}>Deliver to MSFT Alias
                  <input type="text" name="deliverToMsftAlias" value={preqFields.deliverToMsftAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Deliver to MSFT Alias" />
                </label>
                <label style={{ fontWeight: 500 }}>Email Alias
                  <input type="text" name="emailAlias" value={preqFields.emailAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Email Alias" />
                </label>
                <label style={{ fontWeight: 500 }}>Delivery Contact Phone Number <span style={{color:'red'}}>*</span>
                  <input type="text" name="deliveryContactPhone" value={preqFields.deliveryContactPhone} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Contact Phone Number" />
                </label>
                <label style={{ fontWeight: 500 }}>Delivery Location <span style={{color:'red'}}>*</span>
                  <input type="text" name="deliveryLocation" value={preqFields.deliveryLocation} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Location" />
                </label>
                <label style={{ fontWeight: 500 }}>FID # <span style={{color:'red'}}>*</span>
                  <input type="text" name="fidNumber" value={preqFields.fidNumber} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="FID #" />
                </label>
                <label style={{ fontWeight: 500 }}>Who / Reviewer <span style={{color:'red'}}>*</span>
                  <input type="text" name="reviewer" value={preqFields.reviewer} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Who / Reviewer" />
                </label>
                <label style={{ fontWeight: 500 }}>Interim Approver Alias
                  <input type="text" name="interimApproverAlias" value={preqFields.interimApproverAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Interim Approver Alias" />
                </label>
                <label style={{ fontWeight: 500 }}>Safe Approver (if not using default)
                  <input type="text" name="safeApprover" value={preqFields.safeApprover} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Safe Approver" />
                </label>
                <label style={{ fontWeight: 500 }}>CC List Alias
                  <input type="text" name="ccListAlias" value={preqFields.ccListAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="CC List Alias" />
                </label>
                <label style={{ fontWeight: 500 }}>Shipping Comments
                  <textarea name="shippingComments" value={preqFields.shippingComments} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Shipping Comments" />
                </label>
                <label style={{ fontWeight: 500 }}>Invoice Approver <span style={{color:'red'}}>*</span>
                  <input type="text" name="invoiceApprover" value={preqFields.invoiceApprover} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Invoice Approver" />
                </label>
              </div>
            </div>
            <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginTop: 0, marginBottom: 0, width: '94%' }}>
              <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Business Justification</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 0 }}>
                <label style={{ fontWeight: 500 }}>Which project? <span style={{color:'red'}}>*</span>
                  <input type="text" name="businessJustificationProject" value={preqFields.businessJustificationProject} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Which project?" />
                </label>
                <label style={{ fontWeight: 500 }}>Which location? <span style={{color:'red'}}>*</span>
                  <input type="text" name="businessJustificationLocation" value={preqFields.businessJustificationLocation} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Which location?" />
                </label>
                <label style={{ fontWeight: 500 }}>What are we purchasing? <span style={{color:'red'}}>*</span>
                  <input type="text" name="businessJustificationWhat" value={preqFields.businessJustificationWhat} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="What are we purchasing?" />
                </label>
                <label style={{ fontWeight: 500 }}>Why do we need it? <span style={{color:'red'}}>*</span>
                  <input type="text" name="businessJustificationWhy" value={preqFields.businessJustificationWhy} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Why do we need it?" />
                </label>
                <label style={{ fontWeight: 500, gridColumn: '1 / -1' }}>Impact if not approved? <span style={{color:'red'}}>*</span>
                  <input type="text" name="businessJustificationImpact" value={preqFields.businessJustificationImpact} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Impact if not approved?" />
                </label>
                <label style={{ fontWeight: 500, gridColumn: '1 / -1' }}>Notes to procurement team <span style={{color:'red'}}>*</span>
                  <textarea name="businessJustificationNotes" value={preqFields.businessJustificationNotes} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Notes to procurement team" />
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
      <button
        className="back-fixed-btn"
        onClick={goBack}
        style={{ position: 'fixed', bottom: 0, left: 0 }}
      >
        Back
      </button>
      <button
        className="next-fixed-btn"
        disabled={!allRequiredFilled}
        style={{ position: 'fixed', bottom: 0, right: 0 }}
        onClick={() => {/* TODO: handle next step, e.g., submit or go to review */}}
      >
        Next
      </button>
    </div>
  );
}

export default RequiredFields;
