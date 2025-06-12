import React, { useState } from 'react';
import '../App.css'; // Import the CSS file for class-based styling

function RequiredFields({ selected, quantities, goBack, setPage, setPreqFields, preqFields, newParts, setNewParts }) {
  const [showParts, setShowParts] = useState(false);
  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [newPartFields, setNewPartFields] = useState({
    itemNumber: '',
    mfgPartNumber: '',
    mfgName: '',
    inventoryDescription: '',
    category: '',
    unitOfMeasure: '',
    estimatedUnitPrice: '',
    currency: '',
    supplierName: '',
    supplierPartNumber: '',
    datasheet: '',
    // Add more fields as needed for a new part
  });

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setPreqFields(prev => ({ ...prev, [name]: value }));
  };

  const handleNewPartFieldChange = (e) => {
    const { name, value } = e.target;
    setNewParts(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], [name]: value };
      return updated;
    });
  };

  const handleAddNewPart = () => {
    setNewParts(prev => [...prev, { ...newPartFields }]);
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
  const requiredBooleans = ['capex', 'fid', 'reviewedByLabTpm', 'deliverToMsftPoc'];
  const allRequiredFilled = requiredFields.every(f => preqFields[f] && preqFields[f].toString().trim() !== '') && requiredBooleans.every(f => preqFields[f] !== undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', padding: '40px 0 80px 0', background: '#f0f4fa' }}>
      {/* Selected Parts Section */}
      <div style={{ width: '99%', maxWidth: 1700, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
        <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22 }}>Selected Parts</h2>
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
          <span>Show/Hide Parts Table</span>
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
            width: '100%'
          }}>
            <h3 style={{marginTop:0}}>Add New Part</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 12
            }}>
              <label style={{ fontWeight: 500, gridColumn: '1 / 2' }}>Part Number <span style={{color:'red'}}>*</span>
                <input type="text" name="partNumber" value={newPartFields.partNumber || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Part Number" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '2 / 3' }}>Classification <span style={{color:'red'}}>*</span>
                <select name="classification" value={newPartFields.classification || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                  <option value="">Select Classification</option>
                  <option value="IMS">IMS</option>
                  <option value="OnePDM">OnePDM</option>
                  <option value="Variscale">Variscale</option>
                </select>
              </label>
              <label style={{ fontWeight: 500 }}>U Height
                <input type="text" name="uHeight" value={newPartFields.uHeight || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="U Height" />
              </label>
              <label style={{ fontWeight: 500 }}>Manufacturer Name <span style={{color:'red'}}>*</span>
                <input type="text" name="mfgName" value={newPartFields.mfgName || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Manufacturer Name" />
              </label>
              <label style={{ fontWeight: 500 }}>Manufacturer Part Number <span style={{color:'red'}}>*</span>
                <input type="text" name="mfgPartNumber" value={newPartFields.mfgPartNumber || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Manufacturer Part Number" />
              </label>
              <label style={{ fontWeight: 500 }}>Select Category <span style={{color:'red'}}>*</span>
                <select name="category" value={newPartFields.category || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                  <option value="">Select Category</option>
                  <option value="SSD">SSD</option>
                  <option value="IN-RACK POWER">IN-RACK POWER</option>
                  <option value="RACK">RACK</option>
                  <option value="BIOS">BIOS</option>
                  <option value="SUPPLIES">SUPPLIES</option>
                  <option value="CASE">CASE</option>
                  <option value="STORAGE">STORAGE</option>
                  <option value="LAB">LAB</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="SAMPLE">SAMPLE</option>
                  <option value="CABLE">CABLE</option>
                  <option value="TEST">TEST</option>
                  <option value="FPGA">FPGA</option>
                  <option value="GROMMET">GROMMET</option>
                  <option value="BAD">BAD</option>
                  <option value="MISC">MISC</option>
                  <option value="CM">CM</option>
                  <option value="CPU">CPU</option>
                  <option value="MEMORY">MEMORY</option>
                  <option value="NULL">NULL</option>
                  <option value="LABEL">LABEL</option>
                  <option value="SKU1B">SKU1B</option>
                  <option value="HOLD">HOLD</option>
                  <option value="POWER">POWER</option>
                  <option value="CABES">CABES</option>
                  <option value="PCB">PCB</option>
                  <option value="IC">IC</option>
                  <option value="Rack-mountable">Rack-mountable</option>
                  <option value="M.2">M.2</option>
                  <option value="BOX">BOX</option>
                  <option value="SERVER">SERVER</option>
                  <option value="TESTER">TESTER</option>
                  <option value="Lot">Lot</option>
                  <option value="PWR">PWR</option>
                  <option value="RASSY">RASSY</option>
                  <option value="POWER CORD">POWER CORD</option>
                  <option value="Card">Card</option>
                  <option value="Heatsink">Heatsink</option>
                  <option value="PCBA">PCBA</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="DECOM">DECOM</option>
                  <option value="PCBA+MECH">PCBA+MECH</option>
                  <option value="FPGA">FPGA</option>
                  <option value="NETWORKING">NETWORKING</option>
                  <option value="COOKBOOK">COOKBOOK</option>
                  <option value="DIMMS">DIMMS</option>
                  <option value="FPGA CARD">FPGA CARD</option>
                  <option value="Rackmount Chassis">Rackmount Chassis</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label style={{ fontWeight: 500 }}>ECCN
                <input type="text" name="eccn" value={newPartFields.eccn || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="ECCN" />
              </label>
              <label style={{ fontWeight: 500 }}>HTS
                <input type="text" name="hts" value={newPartFields.hts || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="HTS" />
              </label>
              <label style={{ fontWeight: 500 }}>PPU
                <input type="text" name="ppu" value={newPartFields.ppu || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PPU" />
              </label>
              <label style={{ fontWeight: 500 }}>COO
                <input type="text" name="coo" value={newPartFields.coo || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="COO" />
              </label>
              <label style={{ fontWeight: 500 }}>OnePDM Revision
                <input type="text" name="onepdmRevision" value={newPartFields.onepdmRevision || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="OnePDM Revision" />
              </label>
              <label style={{ fontWeight: 500 }}>Maturity
                <input type="text" name="maturity" value={newPartFields.maturity || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Maturity" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1' }}>Description <span style={{color:'red'}}>*</span>
                <input type="text" name="description" value={newPartFields.description || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Description" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1' }}>AKA References
                <input type="text" name="akaReferences" value={newPartFields.akaReferences || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="AKA References" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1' }}>Part Image Attachment
                <input
                  type="file"
                  name="partImage"
                  accept="image/*"
                  onChange={e => setNewPartFields(prev => ({ ...prev, partImage: e.target.files[0] }))}
                  style={{ marginTop: 8 }}
                />
              </label>
            </div>
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
      </div>

      {/* Purchase Request Section */}
      <div style={{ width: '99%', maxWidth: 1700, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
        <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22 }}>Purchase Request Details</h2>
        {/* Requester Info */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Requester Info</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>Title
              <input type="text" name="title" value={preqFields.title} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Title" />
            </label>
            <label style={{ fontWeight: 500 }}>PO Number
              <input type="text" name="poNumber" value={preqFields.poNumber} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PO Number" />
            </label>
            <label style={{ fontWeight: 500 }}>PO Owner Alias <span style={{color:'red'}}>*</span>
              <input type="text" name="poOwnerAlias" value={preqFields.poOwnerAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PO Owner Alias" />
            </label>
            <label style={{ fontWeight: 500 }}>Coordinator
              <input type="text" name="coordinator" value={preqFields.coordinator} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Coordinator" />
            </label>
            <label style={{ fontWeight: 500 }}>Email Alias
              <input type="text" name="emailAlias" value={preqFields.emailAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Email Alias" />
            </label>
          </div>
        </fieldset>
        {/* Project & Supplier */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Project & Supplier</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>Project <span style={{color:'red'}}>*</span>
              <input type="text" name="project" value={preqFields.project} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Project" />
            </label>
            <label style={{ fontWeight: 500 }}>Supplier <span style={{color:'red'}}>*</span>
              <input type="text" name="supplier" value={preqFields.supplier} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Supplier" />
            </label>
            <label style={{ fontWeight: 500 }}>Purchase Type <span style={{color:'red'}}>*</span>
              <select name="purchaseType" value={preqFields.purchaseType} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} required>
                <option value="">Select Purchase Type</option>
                <option value="Commodities">Commodities</option>
                <option value="Extention">Extention</option>
                <option value="Freight / shipping">Freight / shipping</option>
                <option value="Lab Consumables">Lab Consumables</option>
                <option value="Lab Test Equipment">Lab Test Equipment</option>
                <option value="NRE">NRE</option>
                <option value="NRE/ Services">NRE/ Services</option>
                <option value="NRE/ Tooling">NRE/ Tooling</option>
                <option value="Production HW">Production HW</option>
                <option value="Proto DEV HW">Proto DEV HW</option>
                <option value="Support HW / Infrastructure">Support HW / Infrastructure</option>
                <option value="Other">Other</option>
              </select>
              {preqFields.purchaseType === 'Other' && (
                <input type="text" name="purchaseTypeOther" value={preqFields.purchaseTypeOther || ''} onChange={e => setPreqFields(prev => ({ ...prev, purchaseTypeOther: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Please specify other purchase type" required />
              )}
            </label>
            <label style={{ fontWeight: 500 }}>Currency <span style={{color:'red'}}>*</span>
              <select name="currency" value={preqFields.currency} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select Currency</option>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="TWD">TWD</option>
                <option value="Other">Other</option>
              </select>
              {preqFields.currency === 'Other' && (
                <input type="text" name="currencyOther" value={preqFields.currencyOther || ''} onChange={e => setPreqFields(prev => ({ ...prev, currencyOther: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Please specify other currency" required />
              )}
            </label>
            <label style={{ fontWeight: 500 }}>Capex <span style={{color:'red'}}>*</span>
              <select name="capex" value={preqFields.capex === undefined ? '' : preqFields.capex ? 'yes' : preqFields.capex === false ? 'no' : ''} onChange={e => setPreqFields(prev => ({ ...prev, capex: e.target.value === '' ? undefined : e.target.value === 'yes' }))} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label style={{ fontWeight: 500 }}>IO/CC
              <input type="text" name="ioCc" value={preqFields.ioCc} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="IO/CC" />
            </label>
          </div>
        </fieldset>
        {/* Delivery Details */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Delivery Details</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>Delivery Contact Email <span style={{color:'red'}}>*</span>
              <input type="email" name="deliveryContactEmail" value={preqFields.deliveryContactEmail} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Contact Email" />
            </label>
            <label style={{ fontWeight: 500 }}>Delivery Contact Phone <span style={{color:'red'}}>*</span>
              <input type="text" name="deliveryContactPhone" value={preqFields.deliveryContactPhone} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Contact Phone" />
            </label>
            <label style={{ fontWeight: 500 }}>Delivery Location <span style={{color:'red'}}>*</span>
              <input type="text" name="deliveryLocation" value={preqFields.deliveryLocation} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Delivery Location" />
            </label>
            <label style={{ fontWeight: 500 }}>Deliver to MSFT POC <span style={{color:'red'}}>*</span>
              <select name="deliverToMsftPoc" value={preqFields.deliverToMsftPoc === undefined ? '' : preqFields.deliverToMsftPoc ? 'yes' : preqFields.deliverToMsftPoc === false ? 'no' : ''} onChange={e => setPreqFields(prev => ({ ...prev, deliverToMsftPoc: e.target.value === '' ? undefined : e.target.value === 'yes' }))} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label style={{ fontWeight: 500 }}>Deliver to MSFT Alias <span style={{color:'red'}}>*</span>
              <input type="text" name="deliverToMsftAlias" value={preqFields.deliverToMsftAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Deliver to MSFT Alias" />
            </label>
            <label style={{ fontWeight: 500 }}>Shipping Comments
              <textarea name="shippingComments" value={preqFields.shippingComments} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Shipping Comments" />
            </label>
          </div>
        </fieldset>
        {/* Approval & Review */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Approval & Review</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>FID <span style={{color:'red'}}>*</span>
              <select name="fid" value={preqFields.fid === undefined ? '' : preqFields.fid ? 'yes' : preqFields.fid === false ? 'no' : ''} onChange={e => setPreqFields(prev => ({ ...prev, fid: e.target.value === '' ? undefined : e.target.value === 'yes' }))} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label style={{ fontWeight: 500 }}>FID Number <span style={{color:'red'}}>*</span>
              <input type="text" name="fidNumber" value={preqFields.fidNumber} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="FID Number" />
            </label>
            <label style={{ fontWeight: 500 }}>Reviewed by Lab TPM <span style={{color:'red'}}>*</span>
              <select name="reviewedByLabTpm" value={preqFields.reviewedByLabTpm === undefined ? '' : preqFields.reviewedByLabTpm ? 'yes' : preqFields.reviewedByLabTpm === false ? 'no' : ''} onChange={e => setPreqFields(prev => ({ ...prev, reviewedByLabTpm: e.target.value === '' ? undefined : e.target.value === 'yes' }))} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label style={{ fontWeight: 500 }}>Reviewer <span style={{color:'red'}}>*</span>
              <select name="reviewer" value={preqFields.reviewer} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} required>
                <option value="">Select Reviewer</option>
                <option value="Dave Artz">Dave Artz</option>
                <option value="Heather Phan">Heather Phan</option>
                <option value="Luke Duchesneau">Luke Duchesneau</option>
                <option value="Jeremy Webster">Jeremy Webster</option>
                <option value="Other">Other</option>
              </select>
              {preqFields.reviewer === 'Other' && (
                <input type="text" name="reviewerOther" value={preqFields.reviewerOther || ''} onChange={e => setPreqFields(prev => ({ ...prev, reviewerOther: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Please specify other reviewer" required />
              )}
            </label>
            <label style={{ fontWeight: 500 }}>Interim Approver Alias
              <input type="text" name="interimApproverAlias" value={preqFields.interimApproverAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Interim Approver Alias" />
            </label>
            <label style={{ fontWeight: 500 }}>SAFE Approver
              <input type="text" name="safeApprover" value={preqFields.safeApprover} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="SAFE Approver" />
            </label>
            <label style={{ fontWeight: 500 }}>CC List Alias
              <input type="text" name="ccListAlias" value={preqFields.ccListAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="CC List Alias" />
            </label>
            <label style={{ fontWeight: 500 }}>Invoice Approver <span style={{color:'red'}}>*</span>
              <select name="invoiceApprover" value={preqFields.invoiceApprover} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} required>
                <option value="">Select Invoice Approver</option>
                <option value="PO Owner">PO Owner</option>
                <option value="Procurement Team">Procurement Team</option>
                <option value="Other">Other</option>
              </select>
              {preqFields.invoiceApprover === 'Other' && (
                <input type="text" name="invoiceApproverOther" value={preqFields.invoiceApproverOther || ''} onChange={e => setPreqFields(prev => ({ ...prev, invoiceApproverOther: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Please specify other invoice approver" required />
              )}
            </label>
            <label style={{ fontWeight: 500 }}>Urgent
              <select name="urgent" value={preqFields.urgent === undefined ? '' : preqFields.urgent ? 'yes' : preqFields.urgent === false ? 'no' : ''} onChange={e => setPreqFields(prev => ({ ...prev, urgent: e.target.value === '' ? undefined : e.target.value === 'yes' }))} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </fieldset>
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginTop: 0, marginBottom: 0, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Business Justification</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 0, width: '100%', boxSizing: 'border-box' }}>
            <label style={{ fontWeight: 500, width: '100%' }}>Which project? <span style={{color:'red'}}>*</span>
              <input type="text" name="businessJustificationProject" value={preqFields.businessJustificationProject} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Which project?" />
            </label>
            <label style={{ fontWeight: 500, width: '100%' }}>Which location? <span style={{color:'red'}}>*</span>
              <input type="text" name="businessJustificationLocation" value={preqFields.businessJustificationLocation} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Which location?" />
            </label>
            <label style={{ fontWeight: 500, width: '100%' }}>What are we purchasing? <span style={{color:'red'}}>*</span>
              <textarea name="businessJustificationWhat" value={preqFields.businessJustificationWhat} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="What are we purchasing?" />
            </label>
            <label style={{ fontWeight: 500, width: '100%' }}>Why do we need it? <span style={{color:'red'}}>*</span>
              <textarea name="businessJustificationWhy" value={preqFields.businessJustificationWhy} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Why do we need it?" />
            </label>
            <label style={{ fontWeight: 500, gridColumn: '1 / -1', width: '100%' }}>Impact if not approved? <span style={{color:'red'}}>*</span>
              <textarea name="businessJustificationImpact" value={preqFields.businessJustificationImpact} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Impact if not approved?" />
            </label>
            <label style={{ fontWeight: 500, gridColumn: '1 / -1', width: '100%' }}>Notes to procurement team <span style={{color:'red'}}>*</span>
              <textarea name="businessJustificationNotes" value={preqFields.businessJustificationNotes} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Notes to procurement team" />
            </label>
          </div>
        </fieldset>
      </div>

      {/* Attachments Section */}
      <div style={{ width: '99%', maxWidth: 1700, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
        <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22 }}>Attachments</h2>
        <div className="required-fields-attachments-box">
          <label className="required-fields-attachments-label">
            Attachments
            <span className="required-fields-attachments-hint">(Optional, you may attach multiple files)</span>
          </label>
          <input
            type="file"
            name="attachments"
            multiple
            onChange={e => setPreqFields(prev => ({ ...prev, attachments: Array.from(e.target.files) }))}
            className="required-fields-attachments-input"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ width: '99%', maxWidth: 1700, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <button
          className="back-fixed-btn"
          onClick={goBack}
        >
          Back
        </button>
        <button
          className="next-fixed-btn"
          disabled={!allRequiredFilled}
          onClick={() => setPage('confirmationSummary')}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default RequiredFields;
