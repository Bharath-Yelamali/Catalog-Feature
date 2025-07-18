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
  getMainTableGridColumns
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
      <div className="search-result-field">
        {truncateText(part.essentialReserve?.toString())}
      </div>
    )}
    {!hiddenFields.usableSurplus && (
      <div className={`search-result-field ${part.usableSurplus > 0 ? 'usable-surplus-positive' : ''}`}>
        {truncateText(part.usableSurplus?.toString())}
      </div>
    )}
    {/* Inventory Item Number (truncated, expandable if long) */}
    {!hiddenFields.inventoryItemNumber && (() => {
      const fullValue = part.m_inventory_item?.item_number ?? 'N/A';
      const truncated = truncateText(fullValue);
      const isTruncated = truncated !== fullValue;
      return (
        <div
          className={`search-result-field small-header${isTruncated ? ' table-cell--clickable' : ' table-cell--default-cursor'}`}
          onClick={isTruncated ? (e) => {
            e.stopPropagation();
            setExpandedValue && setExpandedLabel && setExpandedValue(fullValue);
            setExpandedLabel && setExpandedLabel('Inventory Item Number');
          } : undefined}
        >
          {highlightFieldWithMatches(truncated, part._matches?.m_inventory_item)}
        </div>
      );
    })()}
    {/* Manufacturer Part # (truncated, expandable if long) */}
    {!hiddenFields.manufacturerPartNumber && (() => {
      const fullValue = part.m_mfg_part_number ?? 'N/A';
      const truncated = truncateText(fullValue);
      const isTruncated = truncated !== fullValue;
      return (
        <div
          className={`search-result-field${isTruncated ? ' table-cell--clickable' : ' table-cell--default-cursor'}`}
          onClick={isTruncated ? (e) => {
            e.stopPropagation();
            setExpandedValue && setExpandedLabel && setExpandedValue(fullValue);
            setExpandedLabel && setExpandedLabel('Manufacturer Part #');
          } : undefined}
        >
          {highlightFieldWithMatches(truncated, part._matches?.m_mfg_part_number)}
        </div>
      );
    })()}
    {/* Manufacturer Name (truncated, expandable if long) */}
    {!hiddenFields.manufacturerName && (() => {
      const fullValue = part.m_mfg_name ?? 'N/A';
      const truncated = truncateText(fullValue);
      const isTruncated = truncated !== fullValue;
      return (
        <div
          className={`search-result-field${isTruncated ? ' table-cell--clickable' : ' table-cell--default-cursor'}`}
          onClick={isTruncated ? (e) => {
            e.stopPropagation();
            setExpandedValue && setExpandedLabel && setExpandedValue(fullValue);
            setExpandedLabel && setExpandedLabel('Manufacturer Name');
          } : undefined}
        >
          {highlightFieldWithMatches(truncated, part._matches?.m_mfg_name)}
        </div>
      );
    })()}
    {/* Inventory Description (truncated, expandable if long) */}
    {!hiddenFields.inventoryDescription && (() => {
      const fullValue = (part.m_inventory_description ?? part.m_description) ?? 'N/A';
      const truncated = truncateText(fullValue);
      const isTruncated = truncated !== fullValue;
      return (
        <div
          className={`search-result-field${isTruncated ? ' table-cell--clickable' : ' table-cell--default-cursor'}`}
          onClick={isTruncated ? (e) => {
            e.stopPropagation();
            setExpandedValue && setExpandedLabel && setExpandedValue(fullValue);
            setExpandedLabel && setExpandedLabel('Inventory Description');
          } : undefined}
        >
          {highlightFieldWithMatches(truncated, part._matches?.m_inventory_description || part._matches?.m_description)}
        </div>
      );
    })()}
  </div>
);

export default PartsTableMainRow;
