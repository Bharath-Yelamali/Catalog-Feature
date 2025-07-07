/**
 * Maps a new part object from UI form to the API format.
 * @param {Object} part
 * @returns {Object}
 */
export function mapNewPartForApi(part) {
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
  // Remove empty fields
  Object.keys(mappedPart).forEach(key => {
    if (mappedPart[key] === '') delete mappedPart[key];
  });
  return mappedPart;
}

/**
 * Builds a FormData object for the procurement request API.
 * @param {Object} preqFields
 * @param {Array} attachments
 * @returns {FormData}
 */
export function buildProcurementRequestFormData(preqFields, attachments) {
  const formData = new FormData();
  Object.entries(preqFields).forEach(([key, value]) => {
    if (key !== 'attachments' && value !== undefined && value !== null) {
      if (key === 'invoiceApprover') {
        formData.append('invoiceApprover', value);
      } else if (key === 'invoiceApproverDisplay') {
        formData.append('invoiceApproverDisplay', value);
      } else if (key === 'poOwnerAlias') {
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
      } else if (key === 'purchaseTypeId') {
        formData.append('m_purchase_type', value);
      } else if (key === 'deliveryLocation') {
        formData.append('m_delivery_location', value);
      } else if (
        key !== 'invoiceApproverId' &&
        key !== 'poOwnerAlias' &&
        key !== 'supplier' &&
        key !== 'project' &&
        key !== 'reviewerName' &&
        key !== 'purchaseType'
      ) {
        formData.append(key, value);
      }
    }
  });
  formData.append('m_lineitem_options', 1);
  if (!preqFields.purchaseTypeId && preqFields.purchaseType) {
    formData.append('m_purchase_type', preqFields.purchaseType);
  }
  if (attachments && attachments.length > 0) {
    formData.append('m_quote', attachments[0]);
  }
  return formData;
}
