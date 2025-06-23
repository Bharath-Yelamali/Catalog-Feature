import React, { useState } from "react";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import { postNewInventoryPart } from '../api/parts';
import { postProcurementRequest, postProcurementRequestFile } from '../api/procurementRequest';

function ConfirmationSummary({ selected, quantities, preqFields, newParts, attachments, goBack, onSubmit, accessToken }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  // Helper function to create an email with all request details
  // Removed the handleEmailRequest function as per the code change

  // Helper to generate a simple PDF summary and merge with PDF attachment
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    let y = 15;
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("Purchase Request Summary", 105, y, { align: 'center' });
    y += 12;

    // Selected Parts Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Selected Parts", 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Table header (bold)
    doc.setFont('helvetica', 'bold');
    doc.text("Qty", 10, y);
    doc.text("Item #", 25, y);
    doc.text("Mfg #", 55, y);
    doc.text("Mfg Name", 90, y);
    doc.text("Description", 130, y);
    // Draw a solid line under the header
    y += 3;
    doc.setLineWidth(0.8);
    doc.line(10, y, 200, y); // solid line from x=10 to x=200
    y += 5;
    doc.setFont('helvetica', 'normal');
    Object.entries(selected).forEach(([itemNumber, group]) => {
      const qty = quantities[itemNumber] || '';
      const part = Array.isArray(group.instances) ? group.instances[0] : group;
      // Prepare all fields, wrap description
      const qtyStr = String(qty);
      const itemNum = part.m_inventory_item?.item_number || 'N/A';
      const mfgPartNum = part.m_mfg_part_number || 'N/A';
      const mfgName = part.m_mfg_name || 'N/A';
      const description = part.m_inventory_description || part.m_description || 'N/A';
      // Wrap description to fit within 70mm width
      const descLines = doc.splitTextToSize(description, 70);
      // Optionally wrap other fields if needed (not likely for qty/itemNum/mfgPartNum/mfgName)
      const maxLines = Math.max(1, descLines.length);
      for (let i = 0; i < maxLines; i++) {
        doc.text(i === 0 ? qtyStr : '', 10, y);
        doc.text(i === 0 ? itemNum : '', 25, y);
        doc.text(i === 0 ? mfgPartNum : '', 55, y);
        doc.text(i === 0 ? mfgName : '', 90, y);
        doc.text(descLines[i] || '', 130, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 15; }
      }
      y += 2; // Add a space (2 units) between each part
    });
    y += 8;

    // Purchase Request Details (Key-Value)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Purchase Request Details", 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const details = [
      ["Title", preqFields.title],
      ["PO Number", preqFields.poNumber],
      ["PO Owner Alias", preqFields.poOwnerAlias],
      ["Coordinator", preqFields.coordinator],
      ["Email Alias", preqFields.emailAlias],
      ["Project", preqFields.project],
      ["Supplier", preqFields.supplier],
      ["Purchase Type", preqFields.purchaseType],
      ["Currency", preqFields.currency],
      ["Capex", typeof preqFields.capex === 'boolean' ? (preqFields.capex ? 'Yes' : 'No') : 'Not specified'],
      ["IO/CC", preqFields.ioCc],
      ["Delivery Contact Email", preqFields.deliveryContactEmail],
      ["Delivery Contact Phone", preqFields.deliveryContactPhone],
      ["Delivery Location", preqFields.deliveryLocation],
      ["Deliver to MSFT POC", preqFields.deliverToMsftPoc],
      ["Deliver to MSFT Alias", preqFields.deliverToMsftAlias],
      ["Shipping Comments", preqFields.shippingComments],
      ["FID", preqFields.fid],
      ["FID Number", preqFields.fidNumber],
      ["Reviewed by Lab TPM", typeof preqFields.reviewedByLabTpm === 'boolean' ? (preqFields.reviewedByLabTpm ? 'Yes' : 'No') : 'Not specified'],
      ["Reviewer", preqFields.reviewerName],
      ["Interim Approver Alias", preqFields.interimApproverAlias],
      ["SAFE Approver", preqFields.safeApprover],
      ["CC List Alias", preqFields.ccListAlias],
      ["Invoice Approver", preqFields.invoiceApprover],
      ["Urgent", typeof preqFields.urgent === 'boolean' ? (preqFields.urgent ? 'Yes' : 'No') : 'Not specified'],
    ];
    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${value || 'Not specified'}`, 60, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    y += 8;

    // Business Justification (combined)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Business Justification", 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const fields = preqFields || {};
    const parts = [
      fields.businessJustificationProject,
      fields.businessJustificationLocation,
      fields.businessJustificationWhat,
      fields.businessJustificationWhy,
      fields.businessJustificationImpact,
      fields.businessJustificationNotes,
    ].filter(Boolean);
    const justificationText = parts.length > 0 ? parts.join('. ') + '.' : 'No business justification provided.';
    // Draw a box for justification
    const justificationBoxHeight = Math.max(12, Math.ceil(justificationText.length / 90) * 7);
    doc.setDrawColor(200);
    doc.rect(10, y - 2, 190, justificationBoxHeight, 'S');
    doc.text(justificationText, 12, y + 5, { maxWidth: 186 });
    y += justificationBoxHeight + 6;

    // Attachments
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Attachments", 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (attachments && attachments.length > 0) {
      attachments.forEach((file, idx) => {
        doc.text(`${idx + 1}. ${file.name}`, 12, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    } else {
      doc.text("No attachments uploaded.", 12, y);
      y += 6;
    }
    y += 6;

    // New Parts Table
    if (newParts && newParts.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("New Parts to Add", 10, y);
      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      // Table header
      const newPartFields = Object.keys(newParts[0]);
      let x = 10;
      newPartFields.forEach((field) => {
        doc.text(field, x, y);
        x += 40;
      });
      y += 6;
      newParts.forEach((part, idx) => {
        let x = 10;
        Object.values(part).forEach((val) => {
          doc.text(val && val.name ? val.name : String(val), x, y);
          x += 40;
        });
        y += 6;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    }

    // 2. Get the summary PDF as a Uint8Array
    const summaryPdfBytes = doc.output('arraybuffer');

    // 3. If there is a PDF attachment, merge it
    const pdfAttachment = attachments && attachments.find(f => f.type === 'application/pdf');
    if (pdfAttachment) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const attachmentBytes = new Uint8Array(e.target.result);
        const summaryPdfDoc = await PDFDocument.load(summaryPdfBytes);
        const attachmentPdfDoc = await PDFDocument.load(attachmentBytes);
        const copiedPages = await summaryPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
        copiedPages.forEach((page) => summaryPdfDoc.addPage(page));
        const mergedPdfBytes = await summaryPdfDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'purchase-request-summary.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsArrayBuffer(pdfAttachment);
    } else {
      const blob = new Blob([summaryPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'purchase-request-summary.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Submit handler: POST new parts, then procurement request (step 1 of 2)
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    let newPartAdded = false;
    try {
      // 1. Post new parts if any
      if (newParts && newParts.length > 0) {
        for (const part of newParts) {
          const mappedPart = {
            item_number: part.partNumber || '',
            classification: part.classification || '',
            m_uheight: part.uHeight || '',
            m_mfg_name: part.mfgName || '',
            m_mfg_part_number: part.mfgPartNumber || '',
            m_category: part.category || '',
            m_eccn: part.eccn || '',
            m_hts: part.hts || '',
            m_ppu: part.ppu || '',
            m_coo: part.coo || '',
            m_rev: part.onepdmRevision || 'A',
            m_maturity: part.maturity || '',
            m_description: part.description || '',
            m_aka: part.akaReferences || '',
          };
          Object.keys(mappedPart).forEach(key => {
            if (mappedPart[key] === '') delete mappedPart[key];
          });
          try {
            console.log('Posting new part to backend:', mappedPart); // <-- Log for new part
            await postNewInventoryPart(mappedPart, accessToken);
            newPartAdded = true;
          } catch (err) {
            if (err.isDuplicate || err.message === 'part_already_exists') {
              setSubmitResult('part_exists');
              setSubmitting(false);
              return;
            } else {
              setSubmitResult('error');
              setSubmitting(false);
              return;
            }
          }
        }
      }
      // 2. Prepare FormData for multipart/form-data
      const formData = new FormData();
      // Add all fields except attachments
      Object.entries(preqFields).forEach(([key, value]) => {
        if (key !== 'attachments' && value !== undefined && value !== null) {          if (key === 'invoiceApproverId') {
            formData.append('m_invoice_approver', value);
          } else if (key === 'poOwnerAlias') {
            console.log('Setting m_po_owner from poOwnerAlias:', value);
            formData.append('m_po_owner', value);
          } else if (key === 'supplierId') {
            formData.append('m_supplier', value);
          } else if (key === 'projectId') {
            formData.append('m_project', value);
          } else if (key === 'reviewer') {
            formData.append('m_reviewer', value);
          } else if (key === 'fidNumber') {
            formData.append('m_fid_code', value);
          } else if (key === 'poNumber') {
            formData.append('m_po_num', value);
          } else if (key === 'ioCc') {
            formData.append('m_io_num', value);
          } else if (key === 'deliveryContactEmail') {
            formData.append('m_email', value);
          } else if (key === 'deliveryContactPhone') {
            formData.append('m_contact', value);
          } else if (key === 'deliverToMsftAlias') {
            formData.append('m_deliverto_msft', value);
          } else if (key === 'interimApproverAlias') {
            formData.append('m_interim_approver', value);
          } else if (key === 'safeApprover') {
            formData.append('m_safe_appover', value);
          } else if (key === 'ccListAlias') {
            formData.append('m_cc_list', value);
          } else if (key === 'businessJustificationNotes') {
            formData.append('m_notes_proc', value);
          } else if (key === 'purchaseType') {
            formData.append('m_purchase_type', value);
          } else if (key === 'deliveryLocation') {
            formData.append('m_delivery_location', value);
          }          else if (
            key !== 'invoiceApprover' &&
            key !== 'poOwnerAlias' &&
            key !== 'supplier' &&
            key !== 'project' &&
            key !== 'reviewerName'
          ){
            formData.append(key, value);
          }
        }
      });
      // Attach the first file as m_quote (required)
      if (attachments && attachments.length > 0) {
        formData.append('m_quote', attachments[0]);
      } else {
        throw new Error('No attachment found');
      }
      console.log('Submitting purchase request to backend:', Object.fromEntries(formData.entries())); // <-- Log for purchase request
      await postProcurementRequest(formData, accessToken, true);
      setSubmitResult(newPartAdded ? 'both_success' : 'preq_success');
      if (onSubmit) onSubmit();
    } catch (err) {
      setSubmitResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="confirmation-summary-container" style={{ width: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
      <h2 className="confirmation-summary-title">Purchase Request Summary</h2>
      <h3 className="confirmation-summary-section">Selected Parts</h3>
      <table className="confirmation-summary-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Inventory Item Number</th>
            <th>Manufacturer Part #</th>
            <th>Manufacturer Name</th>
            <th>Inventory Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(selected).map(([itemNumber, group]) => {
            const qty = quantities[itemNumber] || '';
            const part = Array.isArray(group.instances) ? group.instances[0] : group;
            return (
              <tr key={itemNumber}>
                <td>{qty}</td>
                <td>{part.m_inventory_item?.item_number || 'N/A'}</td>
                <td>{part.m_mfg_part_number || 'N/A'}</td>
                <td>{part.m_mfg_name || 'N/A'}</td>
                <td>{part.m_inventory_description || part.m_description || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h3 className="confirmation-summary-section">Purchase Request Details</h3>
      <div className="confirmation-summary-details-box">
        {/* Requester Info */}
        <div className="confirmation-summary-section-card">
          <h4>Requester Info</h4>
          <dl>
            <dt>Title</dt>
            <dd>{preqFields.title || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>PO Number</dt>
            <dd>{preqFields.poNumber || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>PO Owner Alias</dt>
            <dd>{preqFields.poOwnerAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Coordinator</dt>
            <dd>{preqFields.coordinator || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Email Alias</dt>
            <dd>{preqFields.emailAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
          </dl>
        </div>
        {/* Project & Supplier */}
        <div className="confirmation-summary-section-card">
          <h4>Project & Supplier</h4>
          <dl>
            <dt>Project</dt>
            <dd>{preqFields.project || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Supplier</dt>
            <dd>{preqFields.supplier || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Purchase Type</dt>
            <dd>{preqFields.purchaseType || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Currency</dt>
            <dd>{preqFields.currency || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Capex</dt>
            <dd>{typeof preqFields.capex === 'boolean' ? (preqFields.capex ? 'Yes' : 'No') : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>IO/CC</dt>
            <dd>{preqFields.ioCc || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
          </dl>
        </div>
        {/* Delivery Details */}
        <div className="confirmation-summary-section-card">
          <h4>Delivery Details</h4>
          <dl>
            <dt>Delivery Contact Email</dt>
            <dd>{preqFields.deliveryContactEmail || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Delivery Contact Phone</dt>
            <dd>{preqFields.deliveryContactPhone || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Delivery Location</dt>
            <dd>{preqFields.deliveryLocation || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Deliver to MSFT POC</dt>
            <dd>{preqFields.deliverToMsftPoc || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Deliver to MSFT Alias</dt>
            <dd>{preqFields.deliverToMsftAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Shipping Comments</dt>
            <dd>{preqFields.shippingComments || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
          </dl>
        </div>
        {/* Approval & Review */}
        <div className="confirmation-summary-section-card">
          <h4>Approval & Review</h4>
          <dl>
            <dt>FID</dt>
            <dd>{preqFields.fid || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>FID Number</dt>
            <dd>{preqFields.fidNumber || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Reviewed by Lab TPM</dt>
            <dd>{typeof preqFields.reviewedByLabTpm === 'boolean' ? (preqFields.reviewedByLabTpm ? 'Yes' : 'No') : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Reviewer</dt>
            <dd>{preqFields.reviewerName || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Interim Approver Alias</dt>
            <dd>{preqFields.interimApproverAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>SAFE Approver</dt>
            <dd>{preqFields.safeApprover || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>CC List Alias</dt>
            <dd>{preqFields.ccListAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Invoice Approver</dt>
            <dd>{preqFields.invoiceApprover || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Urgent</dt>
            <dd>{typeof preqFields.urgent === 'boolean' ? (preqFields.urgent ? 'Yes' : 'No') : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
          </dl>
        </div>
        <div className="confirmation-summary-business-justification">
          <h4>Business Justification</h4>
          <div>
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
              return parts.length > 0 ? parts.join('. ') + '.' : <span className="confirmation-summary-detail-empty">No business justification provided.</span>;
            })()}
          </div>
        </div>
        <div className="confirmation-summary-attachments">
          <h4>Attachments</h4>
          <ul>
            {attachments && attachments.length > 0 ? (
              attachments.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))
            ) : (
              <li className="confirmation-summary-detail-empty">No attachments uploaded.</li>
            )}
          </ul>
        </div>
      </div>
      {/* New Parts to Add section, now inside the main box */}
      {(() => {
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
      })()}
      <div className="confirmation-summary-buttons">
        <button onClick={goBack} className="confirmation-summary-button-back">Back</button>
        <button onClick={handleSubmit} className="confirmation-summary-button-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button onClick={handleExportPDF} className="export-btn">Export as PDF</button>
        {/* Email This Request button removed */}
      </div>
      {submitResult === 'success' && <div style={{color:'green',marginTop:8}}>New parts submitted successfully!</div>}
      {submitResult === 'none' && <div style={{color:'orange',marginTop:8}}>No new parts to submit.</div>}
      {submitResult === 'error' && <div style={{color:'red',marginTop:8}}>Failed to submit new parts or request. Please try again.</div>}
      {submitResult === 'preq_success' && <div style={{color:'green',marginTop:8}}>New Purchase Request submitted successfully!</div>}
      {submitResult === 'both_success' && <div style={{color:'green',marginTop:8}}>New Purchase Request and Part Submitted successfully!</div>}
      {submitResult === 'part_exists' && <div style={{color:'red',marginTop:8}}>Error: part already exists, request canceled</div>}
    </div>
  );
}

export default ConfirmationSummary;
