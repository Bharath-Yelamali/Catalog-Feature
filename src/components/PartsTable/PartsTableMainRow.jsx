/**
 * PartsTableMainRow Component
 * ---------------------------
 * Renders a single row in the main parts table, displaying part summary fields and allowing selection, quantity input, and expansion for details.
 *
 * Features:
 * - Checkbox for selection
 * - Quantity input with auto-select on blur
 * - Displays key part fields, with truncation and click-to-expand for long values
 * - Highlights search matches
 * - Handles hidden fields and dynamic columns
 *
 * @fileoverview Table row for a part group in the main parts table UI.
 * @author Bharath Yelamali
 */
import React from 'react';


const PartsTableMainRow = ({
  group,
  part,
  selected,
  quantities,
  hiddenFields,
  handleCheckboxChange,
  handleQuantityChange,
  handleExpandToggle,
  expanded,
  setSelected,
  truncateText,
  highlightFieldWithMatches,
  setExpandedValue,
  setExpandedLabel,
  getMainTableGridColumns,
  isEssentialReserveLow
}) => (
  // Main row for a part group. Handles selection, quantity, and expandable fields.
  <div
    className="search-result-item main-table-row"
    style={{ gridTemplateColumns: getMainTableGridColumns(), cursor: 'pointer' }}
    onClick={() => handleExpandToggle(group.itemNumber)}
  >
    {/* Checkbox for selecting the part group */}
    <div className="search-result-field" onClick={e => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={!!selected[group.itemNumber]}
        onChange={() => handleCheckboxChange(group.itemNumber, part)}
        aria-label="Select part"
      />
    </div>
    {/* Quantity input field (if not hidden) */}
    {!hiddenFields.qty && (
      <div className="search-result-field" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          className="quantity-input quantity-input-table"
          value={quantities[group.itemNumber] || ''}
          onChange={e => handleQuantityChange(group.itemNumber, e.target.value)}
          onBlur={e => {
            if ((e.target.value || '').trim() !== '') {
              setSelected(prev => ({ ...prev, [group.itemNumber]: part }));
            }
          }}
          placeholder="0"
          min="0"
          aria-label="Quantity"
        />
      </div>
    )}
    {/* Total, In Use, Essential Reserve, Usable Surplus fields */}
    {!hiddenFields.total && (
      <div className="search-result-field">
        {truncateText(part.total?.toString()) ?? 'N/A'}
      </div>
    )}
    {!hiddenFields.inUse && (
      <div className="search-result-field">
        {truncateText(part.inUse?.toString()) ?? 'N/A'}
      </div>
    )}
    {!hiddenFields.essentialReserve && (
      <div className={"search-result-field" + (isEssentialReserveLow ? " essential-reserve-low" : "")}>
        {truncateText(part.essentialReserve?.toString())}
      </div>
    )}
    {!hiddenFields.usableSurplus && (
      <div className={`search-result-field${part.usableSurplus > 0 ? ' usable-surplus-positive' : ''} key-col-border`}>
        {truncateText(part.usableSurplus?.toString())}
      </div>
    )}
    {/* Inventory Item Number (full, single line, left aligned) */}
    {!hiddenFields.inventoryItemNumber && (
      <div className="search-result-field small-header part-left-align key-col-border left">
        {highlightFieldWithMatches(part.m_inventory_item?.item_number ?? 'N/A', part._matches?.m_inventory_item)}
      </div>
    )}
    {/* Manufacturer Part # (full, single line, left aligned) */}
    {!hiddenFields.manufacturerPartNumber && (
      <div className="search-result-field part-left-align">
        {highlightFieldWithMatches(part.m_mfg_part_number ?? 'N/A', part._matches?.m_mfg_part_number)}
      </div>
    )}
    {/* Manufacturer Name (full, single line, left aligned) */}
    {!hiddenFields.manufacturerName && (
      <div className="search-result-field part-left-align">
        {highlightFieldWithMatches(part.m_mfg_name ?? 'N/A', part._matches?.m_mfg_name)}
      </div>
    )}
    {/* Inventory Description (full, single line, left aligned) */}
    {!hiddenFields.inventoryDescription && (
      <div className="search-result-field part-left-align">
        {highlightFieldWithMatches((part.m_inventory_description ?? part.m_description) ?? 'N/A', part._matches?.m_inventory_description || part._matches?.m_description)}
      </div>
    )}
  </div>
);

export default PartsTableMainRow;
