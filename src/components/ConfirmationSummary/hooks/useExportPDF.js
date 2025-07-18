import { useCallback } from 'react';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';

/**
 * Custom hook to export a purchase request summary as a PDF, optionally merging with a PDF attachment.
 * @returns {Function} exportPDF - Call with all required data to generate and download the PDF.
 */
export default function useExportPDF() {
  /**
   * Exports the purchase request summary as a PDF, merging with a PDF attachment if present.
   * @param {Object} params
   * @param {Object} params.selected - Selected parts object
   * @param {Object} params.quantities - Quantities keyed by item number
   * @param {Object} params.preqFields - Purchase request fields
   * @param {Array} params.newParts - Array of new parts
   * @param {Array} params.attachments - Array of attachment files
   */
  const exportPDF = useCallback(async ({ selected, quantities, preqFields, newParts, attachments }) => {
    const doc = new jsPDF();
    let y = 15;
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase Request Summary', 105, y, { align: 'center' });
    y += 12;

    // Selected Parts Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Selected Parts', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Table header (bold)
    doc.setFont('helvetica', 'bold');
    doc.text('Qty', 10, y);
    doc.text('Item #', 25, y);
    doc.text('Mfg #', 55, y);
    doc.text('Mfg Name', 90, y);
    doc.text('Description', 130, y);
    y += 3;
    doc.setLineWidth(0.8);
    doc.line(10, y, 200, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    Object.entries(selected).forEach(([itemNumber, group]) => {
      const qty = quantities[itemNumber] || '';
      const part = Array.isArray(group.instances) ? group.instances[0] : group;
      const qtyStr = String(qty);
      const itemNum = part.m_inventory_item?.item_number || 'N/A';
      const mfgPartNum = part.m_mfg_part_number || 'N/A';
      const mfgName = part.m_mfg_name || 'N/A';
      const description = part.m_inventory_description || part.m_description || 'N/A';
      // Split all fields to size for consistent wrapping/indentation
      const itemNumLines = doc.splitTextToSize(itemNum, 25);
      const mfgPartNumLines = doc.splitTextToSize(mfgPartNum, 30);
      const mfgNameLines = doc.splitTextToSize(mfgName, 35);
      const descLines = doc.splitTextToSize(description, 70);
      const maxLines = Math.max(1, descLines.length, itemNumLines.length, mfgPartNumLines.length, mfgNameLines.length);
      for (let i = 0; i < maxLines; i++) {
        doc.text(i === 0 ? qtyStr : '', 10, y);
        doc.text(itemNumLines[i] || '', 25, y);
        doc.text(mfgPartNumLines[i] || '', 55, y);
        doc.text(mfgNameLines[i] || '', 90, y);
        doc.text(descLines[i] || '', 130, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 15; }
      }
      y += 2;
    });
    y += 8;

    // Purchase Request Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase Request Details', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const details = [
      ['PO Owner Alias', preqFields.poOwnerAlias],
      ['Coordinator', preqFields.coordinator],
      ['Email Alias', preqFields.emailAlias],
      ['Project', preqFields.project],
      ['Supplier', preqFields.supplier],
      ['Purchase Type', preqFields.purchaseType],
      ['Currency', preqFields.currency],
      ['Capex', typeof preqFields.capex === 'boolean' ? (preqFields.capex ? 'Yes' : 'No') : 'Not specified'],
      ['IO/CC', preqFields.ioCc],
      ['Delivery Contact Email', preqFields.deliveryContactEmail],
      ['Delivery Contact Phone', preqFields.deliveryContactPhone],
      ['Delivery Location', preqFields.deliveryLocation],
      ['Deliver to MSFT POC', typeof preqFields.deliverToMsftPoc === 'boolean' ? (preqFields.deliverToMsftPoc ? 'Yes' : 'No') : 'Not specified'],
      ['Deliver to MSFT Alias', preqFields.deliverToMsftAlias],
      ['Shipping Comments', preqFields.shippingComments],
      ['FID', preqFields.fid === true || preqFields.fid === 'yes' ? 'Yes' : preqFields.fid === false || preqFields.fid === 'no' ? 'No' : 'Not specified'],
      ...((preqFields.fid === true || preqFields.fid === 'yes')
        ? [['FID Number', preqFields.fidNumber]]
        : (preqFields.fid === false || preqFields.fid === 'no')
        ? [['Reason For No FID', preqFields.m_why_not_forecasted]]
        : []),
      ['Reviewed by Lab TPM', typeof preqFields.reviewedByLabTpm === 'boolean' ? (preqFields.reviewedByLabTpm ? 'Yes' : 'No') : 'Not specified'],
      ['Reviewer', preqFields.reviewer],
      ['Interim Approver Alias', preqFields.interimApproverAlias],
      ['SAFE Approver', preqFields.safeApprover],
      ['CC List Alias', preqFields.ccListAlias],
      ['Invoice Approver', (() => {
        const val = preqFields.invoiceApprover;
        if (val === 0 || val === '0') return 'PO Owner';
        if (val === 1 || val === '1') return 'Procurement team';
        if (val === 2 || val === '2') return preqFields.invoiceApproverDisplay || 'Other';
        if (val === 'PO Owner') return 'PO Owner';
        if (val === 'Procurement team') return 'Procurement team';
        if (val === 'Other') return preqFields.invoiceApproverDisplay || 'Other';
        return val || 'Not specified';
      })()],
      ['Urgent', typeof preqFields.urgent === 'boolean' ? (preqFields.urgent ? 'Yes' : 'No') : 'Not specified'],
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

    // Business Justification
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Business Justification', 10, y);
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
    const justificationBoxHeight = Math.max(12, Math.ceil(justificationText.length / 90) * 7);
    doc.setDrawColor(200);
    doc.rect(10, y - 2, 190, justificationBoxHeight, 'S');
    doc.text(justificationText, 12, y + 5, { maxWidth: 186 });
    y += justificationBoxHeight + 6;

    // Attachments
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Attachments', 10, y);
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
      doc.text('No attachments uploaded.', 12, y);
      y += 6;
    }
    y += 6;

    // New Parts Table
    if (newParts && newParts.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('New Parts to Add', 10, y);
      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const newPartFields = Object.keys(newParts[0]);
      let x = 10;
      newPartFields.forEach((field) => {
        doc.text(field, x, y);
        x += 40;
      });
      y += 6;
      newParts.forEach((part) => {
        let x = 10;
        Object.values(part).forEach((val) => {
          doc.text(val && val.name ? val.name : String(val), x, y);
          x += 40;
        });
        y += 6;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    }

    // Get the summary PDF as a Uint8Array
    const summaryPdfBytes = doc.output('arraybuffer');

    // If there is a PDF attachment, merge it
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
  }, []);

  return exportPDF;
}
