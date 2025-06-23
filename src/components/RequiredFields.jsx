import React, { useState } from 'react';
import '../styles/projectpopup.css';
import { fetchProjects } from '../api/project';
import { fetchSuppliers } from '../api/supplier';
import { fetchAllIdentities } from '../api/identity';

function RequiredFields({ selected, quantities, goBack, setPage, setPreqFields, preqFields, newParts, setNewParts, isAdmin, accessToken }) {
  const [showParts, setShowParts] = useState(false);
  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
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
  const [editIndex, setEditIndex] = useState(null);
  const [editPartFields, setEditPartFields] = useState({});

  // For cell expansion
  const [expandedCell, setExpandedCell] = useState({ idx: null, field: '', value: '' });
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showSupplierPopup, setShowSupplierPopup] = useState(false);
  const [showPoOwnerPopup, setShowPoOwnerPopup] = useState(false);
  const [showReviewerPopup, setShowReviewerPopup] = useState(false); // Reviewer popup state
  // Project popup state
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectList, setProjectList] = useState([]);
  React.useEffect(() => {
    if (showProjectPopup) {
      // Log only the fetch event, not the token
      console.log('Fetching projects from backend...');
      fetchProjects(accessToken)
        .then(data => {
          console.log('Fetched projects:', data);
          setProjectList(data);
        })
        .catch(err => {
          console.error('Error fetching projects:', err);
          setProjectList([]);
        });
    }
  }, [showProjectPopup, accessToken]);
  const filteredProjects = projectList.filter(p => p.name.toLowerCase().includes((projectSearch || '').toLowerCase()));

  // Supplier popup state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierList, setSupplierList] = useState([]);
  React.useEffect(() => {
    if (showSupplierPopup) {
      console.log('Fetching suppliers from backend...');
      fetchSuppliers(accessToken)
        .then(data => {
          console.log('Fetched suppliers:', data);
          setSupplierList(data);
        })
        .catch(err => {
          console.error('Error fetching suppliers:', err);
          setSupplierList([]);
        });
    }
  }, [showSupplierPopup, accessToken]);
  const filteredSuppliers = supplierList.filter(s => s.name.toLowerCase().includes((supplierSearch || '').toLowerCase()));

  // PO Owner Alias popup state
  const [poOwnerSearch, setPoOwnerSearch] = useState('');
  const [selectedPoOwner, setSelectedPoOwner] = useState(null);
  const [poOwnerList, setPoOwnerList] = useState([]);
  React.useEffect(() => {
    if (showPoOwnerPopup) {
      console.log('Fetching PO Owner Aliases from backend...');
      fetchAllIdentities(accessToken)
        .then(data => {
          console.log('Fetched PO Owner Aliases:', data);
          setPoOwnerList(data);
        })
        .catch(err => {
          console.error('Error fetching PO Owner Aliases:', err);
          setPoOwnerList([]);
        });
    }
  }, [showPoOwnerPopup, accessToken]);
  const filteredPoOwners = poOwnerList.filter(u => (u.alias + ' ' + u.name).toLowerCase().includes((poOwnerSearch || '').toLowerCase()));

  // Invoice Approver popup state
  const [showInvoiceApproverPopup, setShowInvoiceApproverPopup] = useState(false);
  const [invoiceApproverSearch, setInvoiceApproverSearch] = useState('');
  const [selectedInvoiceApprover, setSelectedInvoiceApprover] = useState(null);
  const [invoiceApproverList, setInvoiceApproverList] = useState([]);
  React.useEffect(() => {
    if (showInvoiceApproverPopup) {
      fetchAllIdentities(accessToken)
        .then(data => setInvoiceApproverList(data))
        .catch(() => setInvoiceApproverList([]));
    }
  }, [showInvoiceApproverPopup, accessToken]);
  const filteredInvoiceApprovers = invoiceApproverList.filter(u => (u.alias + ' ' + u.name).toLowerCase().includes((invoiceApproverSearch || '').toLowerCase()));

  // Reviewer popup logic
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [reviewerList, setReviewerList] = useState([]);
  React.useEffect(() => {
    if (showReviewerPopup) {
      fetchAllIdentities(accessToken)
        .then(data => setReviewerList(data))
        .catch(() => setReviewerList([]));
    }
  }, [showReviewerPopup, accessToken]);
  const filteredReviewers = reviewerList.filter(u => (u.alias + ' ' + u.name).toLowerCase().includes((reviewerSearch || '').toLowerCase()));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setPreqFields(prev => ({ ...prev, [name]: value }));
  };

  const handleNewPartFieldChange = (e) => {
    const { name, value } = e.target;
    setNewPartFields(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewPart = () => {
    setNewParts(prev => [...prev, { ...newPartFields }]);
    setShowNewPartForm(false);
    setNewPartFields({
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
  };

  const handleEditPart = (idx) => {
    setEditIndex(idx);
    setEditPartFields({ ...newParts[idx] });
  };

  const handleEditPartFieldChange = (e) => {
    const { name, value } = e.target;
    setEditPartFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEditPart = () => {
    setNewParts(prev => prev.map((part, idx) => idx === editIndex ? { ...editPartFields } : part));
    setEditIndex(null);
    setEditPartFields({});
  };

  const handleCancelEditPart = () => {
    setEditIndex(null);
    setEditPartFields({});
  };

  const handleDeletePart = (idx) => {
    setNewParts(prev => prev.filter((_, i) => i !== idx));
  };

  // Ensure Invoice Approver ID is always set when 'PO Owner' is selected
  React.useEffect(() => {
    if (preqFields.invoiceApprover === 'PO Owner' && preqFields.poOwnerId) {
      setPreqFields(prev => ({ ...prev, invoiceApproverId: prev.poOwnerId }));
    }
  }, [preqFields.invoiceApprover, preqFields.poOwnerId]);
  // Helper to check if all required fields are filled
  const requiredFields = [
    // 'title' is no longer required
    'poOwnerAlias', 'project', 'supplier', 'purchaseType', 'deliveryContactEmail',
    'deliverToMsftAlias', 'deliveryContactPhone', 'deliveryLocation', 'fidNumber',
    'reviewer', 'invoiceApprover',
    // Business Justification required fields
    'businessJustificationProject', 'businessJustificationLocation', 'businessJustificationWhat',
    'businessJustificationWhy', 'businessJustificationImpact', 'businessJustificationNotes',
    'attachments' // Make attachments required
  ];
  const requiredBooleans = ['capex', 'fid', 'reviewedByLabTpm', 'deliverToMsftPoc'];
  const allRequiredFilled = requiredFields.every(f => preqFields[f] && preqFields[f].toString().trim() !== '') && requiredBooleans.every(f => preqFields[f] !== undefined);

  // Helper to truncate text
  const truncate = (str, max = 20) => {
    if (!str || str.length <= max) return str;
    return str.slice(0, max) + '...';
  };
  // When PO Owner alias is changed, update Invoice Approver ID if needed
  const handlePoOwnerSelect = (user) => {
    console.log('PO Owner selected:', user);
    setPreqFields(prev => {
      const update = { ...prev, poOwnerAlias: user.alias, poOwnerId: user.id };
      console.log('Setting poOwnerAlias to:', user.alias, 'and poOwnerId to:', user.id);
      if (prev.invoiceApprover === 'PO Owner') {
        update.invoiceApproverId = user.id;
        console.log('Also setting invoiceApproverId to:', user.id);
      }
      return update;
    });
    setShowPoOwnerPopup(false);
  };

  // Reviewer selection handler
  const handleReviewerSelect = (user) => {
    setPreqFields(prev => ({ ...prev, reviewer: user.id, reviewerName: user.name }));
    setShowReviewerPopup(false);
    setSelectedReviewer(user);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', padding: '40px 0 80px 0', background: '#f0f4fa' }}>
      {/* Selected Parts Section */}
      <div style={{ width: 900, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
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
        {/* Only show Add New Part button if admin */}
        {isAdmin && (
          <button
            onClick={() => setShowNewPartForm(true)}
            id="add-new-part-btn"
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
        )}
        {showNewPartForm && (
          <div
            style={{
              width: '100%',
              background: '#fff',
              border: '1px solid #bbb',
              borderRadius: 10,
              padding: 24,
              margin: '0 0 16px 0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
              boxSizing: 'border-box',
              position: 'relative',
              display: 'block',
              minWidth: 0,
              wordBreak: 'break-word',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            <h3 style={{marginTop:0}}>Add New Part</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 12,
              maxWidth: '100%'
            }}>
              <label style={{ fontWeight: 500, gridColumn: '1 / 2', maxWidth: '100%', overflow: 'hidden' }}>Part Number <span style={{color:'red'}}>*</span>
                <input type="text" name="partNumber" value={newPartFields.partNumber || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Part Number" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '2 / 3', maxWidth: '100%', overflow: 'hidden' }}>Classification <span style={{color:'red'}}>*</span>
                <select name="classification" value={newPartFields.classification || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }}>
                  <option value="">Select Classification</option>
                  <option value="IMS">IMS</option>
                  <option value="OnePDM">OnePDM</option>
                  <option value="Variscale">Variscale</option>
                </select>
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>U Height
                <input type="text" name="uHeight" value={newPartFields.uHeight || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="U Height" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>Manufacturer Name <span style={{color:'red'}}>*</span>
                <input type="text" name="mfgName" value={newPartFields.mfgName || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Manufacturer Name" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>Manufacturer Part Number <span style={{color:'red'}}>*</span>
                <input type="text" name="mfgPartNumber" value={newPartFields.mfgPartNumber || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Manufacturer Part Number" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>Select Category <span style={{color:'red'}}>*</span>
                <select name="category" value={newPartFields.category || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }}>
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
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>ECCN
                <input type="text" name="eccn" value={newPartFields.eccn || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="ECCN" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>HTS
                <input type="text" name="hts" value={newPartFields.hts || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="HTS" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>PPU
                <input type="text" name="ppu" value={newPartFields.ppu || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="PPU" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>COO
                <input type="text" name="coo" value={newPartFields.coo || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="COO" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>OnePDM Revision
                <input type="text" name="onepdmRevision" value={newPartFields.onepdmRevision || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="OnePDM Revision" />
              </label>
              <label style={{ fontWeight: 500, maxWidth: '100%', overflow: 'hidden' }}>Maturity
                <input type="text" name="maturity" value={newPartFields.maturity || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Maturity" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1', maxWidth: '100%', overflow: 'hidden' }}>Description <span style={{color:'red'}}>*</span>
                <input type="text" name="description" value={newPartFields.description || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Description" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1', maxWidth: '100%', overflow: 'hidden' }}>AKA References
                <input type="text" name="akaReferences" value={newPartFields.akaReferences || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="AKA References" />
              </label>
              <label style={{ fontWeight: 500, gridColumn: '1 / -1', maxWidth: '100%', overflow: 'hidden' }}>Part Image Attachment
                <input type="text" name="partImageAttachment" value={newPartFields.partImageAttachment || ''} onChange={handleNewPartFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, maxWidth: '100%' }} placeholder="Part Image Attachment" />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, maxWidth: '100%', overflow: 'hidden' }}>
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

      {/* New Parts Table Section (only show if there are new parts) */}
      {newParts && newParts.length > 0 && (
        <div style={{ width: 900, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
          <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22 }}>New Parts Added (Not in Database)</h2>
          <table style={{ width: '100%', maxWidth: '100%', minWidth: 0, tableLayout: 'fixed', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', margin: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Part Number</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Classification</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Manufacturer Name</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Manufacturer Part #</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Category</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 4px', width: 210, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>Description</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 2px', width: 60, whiteSpace: 'nowrap', fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newParts.map((part, idx) => (
                <tr key={idx}>
                  {editIndex === idx ? (
                    <>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="partNumber" value={editPartFields.partNumber || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="classification" value={editPartFields.classification || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="mfgName" value={editPartFields.mfgName || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="mfgPartNumber" value={editPartFields.mfgPartNumber || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="category" value={editPartFields.category || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 210, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}><input type="text" name="description" value={editPartFields.description || ''} onChange={handleEditPartFieldChange} style={{ width: '100%', fontSize: 13 }} /></td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 2px', width: 60, whiteSpace: 'nowrap', fontSize: 13 }}>
                        <button onClick={handleSaveEditPart} style={{ marginRight: 4, fontSize: 12, padding: '2px 6px' }}>Save</button>
                        <button onClick={handleCancelEditPart} style={{ fontSize: 12, padding: '2px 6px' }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.partNumber && part.partNumber.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.partNumber && part.partNumber.length > 20 && setExpandedCell({ idx, field: 'Part Number', value: part.partNumber })}>
                        {truncate(part.partNumber)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.classification && part.classification.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.classification && part.classification.length > 20 && setExpandedCell({ idx, field: 'Classification', value: part.classification })}>
                        {truncate(part.classification)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.mfgName && part.mfgName.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.mfgName && part.mfgName.length > 20 && setExpandedCell({ idx, field: 'Manufacturer Name', value: part.mfgName })}>
                        {truncate(part.mfgName)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.mfgPartNumber && part.mfgPartNumber.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.mfgPartNumber && part.mfgPartNumber.length > 20 && setExpandedCell({ idx, field: 'Manufacturer Part #', value: part.mfgPartNumber })}>
                        {truncate(part.mfgPartNumber)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.category && part.category.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.category && part.category.length > 20 && setExpandedCell({ idx, field: 'Category', value: part.category })}>
                        {truncate(part.category)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 4px', width: 210, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, cursor: part.description && part.description.length > 20 ? 'pointer' : 'default' }}
                        onClick={() => part.description && part.description.length > 20 && setExpandedCell({ idx, field: 'Description', value: part.description })}>
                        {truncate(part.description)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px 2px', width: 60, whiteSpace: 'nowrap', fontSize: 13 }}>
                        <button onClick={() => handleEditPart(idx)} style={{ marginRight: 4, fontSize: 12, padding: '2px 6px' }}>Edit</button>
                        <button onClick={() => handleDeletePart(idx)} style={{ fontSize: 12, padding: '2px 6px' }}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Expanded cell modal */}
          {expandedCell.idx !== null && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setExpandedCell({ idx: null, field: '', value: '' })}>
              <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 600, boxShadow: '0 2px 12px rgba(0,0,0,0.18)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{expandedCell.field}</div>
                <div style={{ wordBreak: 'break-all', fontSize: 16 }}>{expandedCell.value}</div>
                <button style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => setExpandedCell({ idx: null, field: '', value: '' })}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}      {/* Purchase Request Section */}      <div style={{ width: 900, margin: '0 auto 32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 22, display: 'inline-block' }}>Purchase Request Details</h2>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 500, cursor: 'pointer', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <input 
              type="checkbox" 
              checked={showOnlyRequired} 
              onChange={() => setShowOnlyRequired(prev => !prev)} 
              style={{ marginRight: 8 }}
            />
            Show only required fields
          </label>
        </div>
        {/* Requester Info */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Requester Info</legend>          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>Title
                <input type="text" name="title" value={preqFields.title || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Title" />
              </label>
            )}
            <label style={{ fontWeight: 500 }}>PO Owner Alias <span style={{color:'red'}}>*</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="text" name="poOwnerAlias" value={preqFields.poOwnerAlias} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="PO Owner Alias" />
                <button
                  type="button"
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #2d72d9', background: '#f5f8fc', color: '#2d72d9', fontWeight: 600, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                  onClick={() => setShowPoOwnerPopup(true)}
                >
                  Select
                </button>
              </div>
            </label>            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>Coordinator
                <input type="text" name="coordinator" value={preqFields.coordinator || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Coordinator" />
              </label>
            )}            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>Email Alias
                <input type="text" name="emailAlias" value={preqFields.emailAlias || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Email Alias" />
              </label>
            )}
          </div>
        </fieldset>
        {/* Project & Supplier */}
        <fieldset style={{ border: '1px solid #bbb', borderRadius: 6, padding: 24, marginBottom: 32, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <legend style={{ fontWeight: 600, fontSize: 15, padding: '0 12px' }}>Project & Supplier</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>Project <span style={{color:'red'}}>*</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="text" name="project" value={preqFields.project} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Project" />
                <button
                  type="button"
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #2d72d9', background: '#f5f8fc', color: '#2d72d9', fontWeight: 600, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                  onClick={() => setShowProjectPopup(true)}
                >
                  Select
                </button>
              </div>
            </label>
            <label style={{ fontWeight: 500 }}>Supplier <span style={{color:'red'}}>*</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="text" name="supplier" value={preqFields.supplier} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Supplier" />
                <button
                  type="button"
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #2d72d9', background: '#f5f8fc', color: '#2d72d9', fontWeight: 600, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                  onClick={() => setShowSupplierPopup(true)}
                >
                  Select
                </button>
              </div>
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
            </label>            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>IO/CC
                <input type="text" name="ioCc" value={preqFields.ioCc || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="IO/CC" />
              </label>
            )}
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
            </label>            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>Shipping Comments
                <textarea name="shippingComments" value={preqFields.shippingComments || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 32, resize: 'vertical' }} placeholder="Shipping Comments" />
              </label>
            )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  name="reviewerName"
                  value={preqFields.reviewerName || ''}
                  readOnly
                  placeholder="Select Reviewer"
                  style={{ flex: 1, padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, background: '#f5f5f5', color: '#333' }}
                />
                <button
                  type="button"
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #2d72d9', background: '#f5f8fc', color: '#2d72d9', fontWeight: 600, fontSize: 13, cursor: 'pointer', height: 35, lineHeight: '20px' }}
                  onClick={() => setShowReviewerPopup(true)}
                >
                  {preqFields.reviewerName ? 'Change' : 'Select'}
                </button>
                <button
                  type="button"
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', color: '#333', fontWeight: 500, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                  onClick={() => setPreqFields(prev => ({ ...prev, reviewer: '', reviewerName: '' }))}
                  disabled={!preqFields.reviewerName}
                >
                  Clear
                </button>
              </div>
            </label>            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>Interim Approver Alias
                <input type="text" name="interimApproverAlias" value={preqFields.interimApproverAlias || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="Interim Approver Alias" />
              </label>
            )}
            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>SAFE Approver
                <input type="text" name="safeApprover" value={preqFields.safeApprover || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="SAFE Approver" />
              </label>
            )}
            {!showOnlyRequired && (
              <label style={{ fontWeight: 500 }}>CC List Alias
                <input type="text" name="ccListAlias" value={preqFields.ccListAlias || ''} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} placeholder="CC List Alias" />
              </label>
            )}
            <label style={{ fontWeight: 500 }}>Invoice Approver <span style={{color:'red'}}>*</span>
              {preqFields.invoiceApprover === 'Other' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    name="invoiceApproverDisplay"
                    value={preqFields.invoiceApproverDisplay || ''}
                    readOnly
                    placeholder="Select Invoice Approver Alias"
                    style={{ flex: 1, padding: 8, marginTop: 0, borderRadius: 6, border: '1px solid #bbb', fontSize: 15, background: '#f5f5f5', color: '#333' }}
                  />
                  <button
                    type="button"
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #2d72d9', background: '#f5f8fc', color: '#2d72d9', fontWeight: 600, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                    onClick={() => setShowInvoiceApproverPopup(true)}
                  >
                    {preqFields.invoiceApproverDisplay ? 'Change' : 'Select'}
                  </button>
                  <button
                    type="button"
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', color: '#333', fontWeight: 500, fontSize: 13, cursor: 'pointer', height: 30, lineHeight: '20px' }}
                    onClick={() => setPreqFields(prev => ({ ...prev, invoiceApprover: '', invoiceApproverId: '', invoiceApproverDisplay: '' }))}
                  >
                    Back
                  </button>
                </div>
              ) : (
                <select name="invoiceApprover" value={preqFields.invoiceApprover} onChange={handleFieldChange} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }} required>
                  <option value="">Select Invoice Approver</option>
                  <option value="PO Owner">PO Owner</option>
                  <option value="Other">Other</option>
                </select>
              )}
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
      <div style={{ width: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
        <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22 }}>Attachments</h2>
        <div className="required-fields-attachments-box">
          <label className="required-fields-attachments-label">
            Attachments <span style={{color:'red'}}>*</span>
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
      <div className="confirmation-summary-buttons" style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32 }}>
        <button onClick={goBack} className="confirmation-summary-button-back" style={{ fontSize: 22, padding: '16px 48px', minWidth: 180, borderRadius: 10 }}>Back</button>
        <button onClick={() => setPage('confirmationSummary')} className="confirmation-summary-button-submit" style={{ fontSize: 22, padding: '16px 48px', minWidth: 180, borderRadius: 10 }} disabled={!allRequiredFilled}>Next</button>
      </div>

      {/* Project Selection Popup */}
      {showProjectPopup && (
        <div className="project-popup-overlay" onClick={() => setShowProjectPopup(false)}>
          <div className="project-popup-modal" onClick={e => e.stopPropagation()}>
            <button className="project-popup-close" onClick={() => setShowProjectPopup(false)}>&times;</button>
            <div className="project-popup-title">Select Project</div>
            <input
              className="project-popup-search"
              type="text"
              placeholder="Search projects..."
              value={projectSearch || ''}
              onChange={e => setProjectSearch(e.target.value)}
              autoFocus
            />
            <div className="project-popup-list">
              {(filteredProjects.length > 0 ? filteredProjects : [{ name: 'No results found', disabled: true }]).map((proj, idx) => (
                <div
                  key={proj.id || proj.name || idx}
                  className={`project-popup-item${selectedProject === proj ? ' selected' : ''}${proj.disabled ? ' disabled' : ''}`}
                  style={proj.disabled ? { color: '#aaa', cursor: 'not-allowed' } : {}}
                  onClick={() => !proj.disabled && setSelectedProject(proj)}
                >
                  {proj.name}
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: 8, padding: '8px 18px', borderRadius: 6, background: '#2d72d9', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: selectedProject ? 'pointer' : 'not-allowed', opacity: selectedProject ? 1 : 0.6 }}
              disabled={!selectedProject}
              onClick={() => {
                if (selectedProject) {
                  setPreqFields(prev => ({ ...prev, project: selectedProject.name, projectId: selectedProject.id }));
                  setShowProjectPopup(false);
                }
              }}
            >
              Select
            </button>
          </div>
        </div>
      )}

      {/* Supplier Selection Popup */}
      {showSupplierPopup && (
        <div className="project-popup-overlay" onClick={() => setShowSupplierPopup(false)}>
          <div className="project-popup-modal" onClick={e => e.stopPropagation()}>
            <button className="project-popup-close" onClick={() => setShowSupplierPopup(false)}>&times;</button>
            <div className="project-popup-title">Select Supplier</div>
            <input
              className="project-popup-search"
              type="text"
              placeholder="Search suppliers..."
              value={supplierSearch || ''}
              onChange={e => setSupplierSearch(e.target.value)}
              autoFocus
            />
            <div className="project-popup-list">
              {(filteredSuppliers.length > 0 ? filteredSuppliers : [{ name: 'No results found', disabled: true }]).map((supp, idx) => (
                <div
                  key={supp.id || supp.name || idx}


                  className={`project-popup-item${selectedSupplier === supp ? ' selected' : ''}${supp.disabled ? ' disabled' : ''}`}
                  style={supp.disabled ? { color: '#aaa', cursor: 'not-allowed' } : {}}
                  onClick={() => !supp.disabled && setSelectedSupplier(supp)}
                >
                  {supp.name}
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: 8, padding: '8px 18px', borderRadius: 6, background: '#2d72d9', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: selectedSupplier ? 'pointer' : 'not-allowed', opacity: selectedSupplier ? 1 : 0.6 }}
              disabled={!selectedSupplier}
              onClick={() => {
                if (selectedSupplier) {
                  setPreqFields(prev => ({ ...prev, supplier: selectedSupplier.name, supplierId: selectedSupplier.id }));
                  setShowSupplierPopup(false);
                }
              }}
            >
              Select
            </button>
          </div>
        </div>
      )}

      {/* PO Owner Alias Selection Popup */}
      {showPoOwnerPopup && (
        <div className="project-popup-overlay" onClick={() => setShowPoOwnerPopup(false)}>
          <div className="project-popup-modal" onClick={e => e.stopPropagation()}>
            <button className="project-popup-close" onClick={() => setShowPoOwnerPopup(false)}>&times;</button>
            <div className="project-popup-title">Select PO Owner Alias</div>
            <input
              className="project-popup-search"
              type="text"
              placeholder="Search PO Owner Aliases..."
              value={poOwnerSearch || ''}
              onChange={e => setPoOwnerSearch(e.target.value)}
              autoFocus
            />
            <div className="project-popup-list">
              {(filteredPoOwners.length > 0 ? filteredPoOwners : [{ alias: 'No results found', disabled: true }]).map((user, idx) => (
                <div
                  key={user.id || user.alias || idx}
                  className={`project-popup-item${selectedPoOwner === user ? ' selected' : ''}${user.disabled ? ' disabled' : ''}`}
                  style={user.disabled ? { color: '#aaa', cursor: 'not-allowed' } : {}}
                  onClick={() => !user.disabled && setSelectedPoOwner(user)}
                >
                  {user.alias} { user.name && `(${user.name})`}
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: 8, padding: '8px 18px', borderRadius: 6, background: '#2d72d9', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: selectedPoOwner ? 'pointer' : 'not-allowed', opacity: selectedPoOwner ? 1 : 0.6 }}
              disabled={!selectedPoOwner}
              onClick={() => {
                if (selectedPoOwner) {
                  handlePoOwnerSelect(selectedPoOwner);
                }
              }}
            >
              Select

            </button>
          </div>
        </div>
           )}

      {/* Invoice Approver Alias Selection Popup */}
      {showInvoiceApproverPopup && (
        <div className="project-popup-overlay" onClick={() => setShowInvoiceApproverPopup(false)}>
          <div className="project-popup-modal" onClick={e => e.stopPropagation()}>
            <button className="project-popup-close" onClick={() => setShowInvoiceApproverPopup(false)}>&times;</button>
            <div className="project-popup-title">Select Invoice Approver Alias</div>
            <input
              className="project-popup-search"
              type="text"
              placeholder="Search Invoice Approver Aliases..."
              value={invoiceApproverSearch || ''}
              onChange={e => setInvoiceApproverSearch(e.target.value)}
              autoFocus
            />
            <div className="project-popup-list">
              {(filteredInvoiceApprovers.length > 0 ? filteredInvoiceApprovers : [{ alias: 'No results found', disabled: true }]).map((user, idx) => (
                <div
                  key={user.id || user.alias || idx}
                  className={`project-popup-item${selectedInvoiceApprover === user ? ' selected' : ''}${user.disabled ? ' disabled' : ''}`}
                  style={user.disabled ? { color: '#aaa', cursor: 'not-allowed' } : {}}
                  onClick={() => !user.disabled && setSelectedInvoiceApprover(user)}
                >
                  {user.alias} {user.name && `(${user.name})`}
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: 8, padding: '8px 18px', borderRadius: 6, background: '#2d72d9', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: selectedInvoiceApprover ? 'pointer' : 'not-allowed', opacity: selectedInvoiceApprover ? 1 : 0.6 }}
              disabled={!selectedInvoiceApprover}
              onClick={() => {
                if (selectedInvoiceApprover) {
                  setPreqFields(prev => ({
                    ...prev,
                    invoiceApproverId: selectedInvoiceApprover.id,
                    invoiceApproverDisplay: selectedInvoiceApprover.alias + (selectedInvoiceApprover.name ? ` (${selectedInvoiceApprover.name})` : '')
                  }));
                  setShowInvoiceApproverPopup(false);
                }
              }}
            >
              Select
            </button>
          </div>
        </div>
      )}

      {/* Reviewer Alias Selection Popup */}
      {showReviewerPopup && (
        <div className="project-popup-overlay" onClick={() => setShowReviewerPopup(false)}>
          <div className="project-popup-modal" onClick={e => e.stopPropagation()}>
            <button className="project-popup-close" onClick={() => setShowReviewerPopup(false)}>&times;</button>
            <div className="project-popup-title">Select Reviewer</div>
            <input
              className="project-popup-search"
              type="text"
              placeholder="Search Reviewer Names..."
              value={reviewerSearch || ''}
              onChange={e => setReviewerSearch(e.target.value)}
              autoFocus
            />
            <div className="project-popup-list">
              {(filteredReviewers.length > 0 ? filteredReviewers : [{ name: 'No results found', disabled: true }]).map((user, idx) => (
                <div
                  key={user.id || user.alias || idx}
                  className={`project-popup-item${selectedReviewer === user ? ' selected' : ''}${user.disabled ? ' disabled' : ''}`}
                  style={user.disabled ? { color: '#aaa', cursor: 'not-allowed' } : {}}
                  onClick={() => !user.disabled && setSelectedReviewer(user)}
                >
                  {user.name}
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: 8, padding: '8px 18px', borderRadius: 6, background: '#2d72d9', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: selectedReviewer ? 'pointer' : 'not-allowed', opacity: selectedReviewer ? 1 : 0.6 }}
              disabled={!selectedReviewer}
              onClick={() => {
                if (selectedReviewer) {
                  handleReviewerSelect(selectedReviewer);
                }
              }}
            >
              Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequiredFields;
