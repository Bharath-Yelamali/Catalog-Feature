import React, { useState } from "react";
import { postNewInventoryPart } from '../../../api/parts';
import { postProcurementRequest, postProcurementRequestFile } from '../../../api/procurementRequest';
import ImsPopup from './ImsPopup';
import AttachmentsList from './AttachmentsList';
import NewPartsTable from './NewPartsTable';
import useExportPDF from '../hooks/useExportPDF';
import { mapNewPartForApi, buildProcurementRequestFormData } from '../utils/confirmationUtils';

function ConfirmationSummary({ selected, quantities, preqFields, newParts, attachments, goBack, onSubmit, accessToken, onAttachmentsChange }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showImsPopup, setShowImsPopup] = useState(false);
  const [imsPrId, setImsPrId] = useState(null); // <-- Store new PR ID
  const exportPDF = useExportPDF();

  // Submit handler: POST new parts, then procurement request (step 1 of 2)
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    let newPartAdded = false;
    try {
      // 1. Post new parts if any
      if (newParts && newParts.length > 0) {
        for (const part of newParts) {
          const mappedPart = mapNewPartForApi(part);
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
      const formData = buildProcurementRequestFormData(preqFields, attachments);
      if (attachments && attachments.length > 0) {
        console.log('Attachment included:', attachments[0].name);
      } else {
        console.log('No attachments provided - backend will create default attachment file');
      }
      console.log('Submitting purchase request to backend:', Object.fromEntries(formData.entries())); // <-- Log for purchase request
      // Await the backend response and extract the PR ID
      const response = await postProcurementRequest(formData, accessToken, true);
      // Try to extract the PR ID from the backend response
      let prId = null;
      if (response && (response.id || response.Id || response.ID)) {
        prId = response.id || response.Id || response.ID;
      } else if (response && response['@odata.id']) {
        // Try to extract from OData id URI
        const match = String(response['@odata.id']).match(/m_Procurement_Request\(([^)]+)\)/);
        if (match) prId = match[1];
      }
      setImsPrId(prId);
      setSubmitResult(newPartAdded ? 'both_success' : 'preq_success');
      if (onSubmit) onSubmit();
    } catch (err) {
      setSubmitResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  // After successful submit, show the IMS popup
  React.useEffect(() => {
    if (submitResult === 'preq_success' || submitResult === 'both_success') {
      setShowImsPopup(true);
    }
  }, [submitResult]);

  return (
    <div className="confirmation-summary-container">
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
            <dd>{typeof preqFields.deliverToMsftPoc === 'boolean' ? (preqFields.deliverToMsftPoc ? 'Yes' : 'No') : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
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
            <dd>{preqFields.fid === true || preqFields.fid === 'yes' ? 'Yes' : preqFields.fid === false || preqFields.fid === 'no' ? 'No' : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            {preqFields.fid === true || preqFields.fid === 'yes' ? (
              <>
                <dt>FID Number</dt>
                <dd>{preqFields.fidNumber || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
              </>
            ) : preqFields.fid === false || preqFields.fid === 'no' ? (
              <>
                <dt>Reason For No FID:</dt>
                <dd>{preqFields.m_why_not_forecasted || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
              </>
            ) : null}
            <dt>Reviewed by Lab TPM</dt>
            <dd>{typeof preqFields.reviewedByLabTpm === 'boolean' ? (preqFields.reviewedByLabTpm ? 'Yes' : 'No') : <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Reviewer</dt>
            <dd>{preqFields.reviewer || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Interim Approver Alias</dt>
            <dd>{preqFields.interimApproverAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>SAFE Approver</dt>
            <dd>{preqFields.safeApprover || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>CC List Alias</dt>
            <dd>{preqFields.ccListAlias || <span className="confirmation-summary-detail-empty">Not specified</span>}</dd>
            <dt>Invoice Approver</dt>
            <dd>{(() => {
              const val = preqFields.invoiceApprover;
              if (val === 0 || val === '0') return 'PO Owner';
              if (val === 1 || val === '1') return 'Procurement team';
              if (val === 2 || val === '2') return preqFields.invoiceApproverDisplay || 'Other';
              if (val === 'PO Owner') return 'PO Owner';
              if (val === 'Procurement team') return 'Procurement team';
              if (val === 'Other') return preqFields.invoiceApproverDisplay || 'Other';
              return val || <span className="confirmation-summary-detail-empty">Not specified</span>;
            })()}</dd>
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
        <AttachmentsList attachments={attachments} onAttachmentsChange={onAttachmentsChange} />
      </div>
      {/* New Parts to Add section, now inside the main box */}
      <NewPartsTable newParts={newParts} />
      <div className="confirmation-summary-buttons">
        <button onClick={goBack} className="confirmation-summary-button-back">Back</button>
        <button onClick={handleSubmit} className="confirmation-summary-button-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button
          onClick={() => exportPDF({ selected, quantities, preqFields, newParts, attachments })}
          className="export-btn"
        >
          Export as PDF
        </button>
        {/* Email This Request button removed */}
      </div>
      {submitResult === 'success' && <div className="confirmation-summary-status-success">New parts submitted successfully!</div>}
      {submitResult === 'none' && <div className="confirmation-summary-status-none">No new parts to submit.</div>}
      {submitResult === 'error' && <div className="confirmation-summary-status-error">Failed to submit new parts or request. Please try again.</div>}
      {submitResult === 'preq_success' && <div className="confirmation-summary-status-success">New Purchase Request submitted successfully!</div>}
      {submitResult === 'both_success' && <div className="confirmation-summary-status-success">New Purchase Request and Part Submitted successfully!</div>}
      {submitResult === 'part_exists' && <div className="confirmation-summary-status-error">Error: part already exists, request canceled</div>}

      {/* IMS Submission Info Popup */}
      <ImsPopup open={showImsPopup} imsPrId={imsPrId} onClose={() => setShowImsPopup(false)} />
    </div>
  );
}

export default ConfirmationSummary;
