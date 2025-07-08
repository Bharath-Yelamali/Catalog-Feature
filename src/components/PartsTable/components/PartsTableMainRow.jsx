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
  <div
    className="search-result-item main-table-row"
    style={{ gridTemplateColumns: getMainTableGridColumns(), cursor: 'pointer' }}
    onClick={() => handleExpandToggle(group.itemNumber)}
  >
    <div className="search-result-field" onClick={e => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={!!selected[group.itemNumber]}
        onChange={() => handleCheckboxChange(group.itemNumber, part)}
        aria-label="Select part"
      />
    </div>
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
    <div className="search-result-field"></div>
    {!hiddenFields.total && <div className="search-result-field">{truncateText(part.total?.toString()) ?? 'N/A'}</div>}
    {!hiddenFields.inUse && <div className="search-result-field">{truncateText(part.inUse?.toString()) ?? 'N/A'}</div>}
    {!hiddenFields.essentialReserve && <div className="search-result-field">{truncateText(part.essentialReserve?.toString())}</div>}
    {!hiddenFields.usableSurplus && (
      <div className={`search-result-field ${part.usableSurplus > 0 ? 'usable-surplus-positive' : ''}`}>
        {truncateText(part.usableSurplus?.toString())}
      </div>
    )}
    {!hiddenFields.inventoryItemNumber && <div className={`search-result-field ${part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={e => { e.stopPropagation(); setExpandedValue && setExpandedLabel && setExpandedValue(part.m_inventory_item?.item_number) && setExpandedLabel('Inventory Item Number'); }}>{highlightFieldWithMatches(truncateText(part.m_inventory_item?.item_number ?? 'N/A'), part._matches?.m_inventory_item)}</div>}
    {!hiddenFields.manufacturerPartNumber && <div className={`search-result-field ${part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={e => { e.stopPropagation(); setExpandedValue && setExpandedLabel && setExpandedValue(part.m_mfg_part_number) && setExpandedLabel('Manufacturer Part #'); }}>{highlightFieldWithMatches(truncateText(part.m_mfg_part_number ?? 'N/A'), part._matches?.m_mfg_part_number)}</div>}
    {!hiddenFields.manufacturerName && <div className={`search-result-field ${part.m_mfg_name && part.m_mfg_name.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={e => { e.stopPropagation(); setExpandedValue && setExpandedLabel && setExpandedValue(part.m_mfg_name) && setExpandedLabel('Manufacturer Name'); }}>{highlightFieldWithMatches(truncateText(part.m_mfg_name ?? 'N/A'), part._matches?.m_mfg_name)}</div>}
    {!hiddenFields.inventoryDescription && <div className={`search-result-field ${(part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={e => { e.stopPropagation(); setExpandedValue && setExpandedLabel && setExpandedValue(part.m_inventory_description || part.m_description) && setExpandedLabel('Inventory Description'); }}>{highlightFieldWithMatches(truncateText((part.m_inventory_description ?? part.m_description) ?? 'N/A'), part._matches?.m_inventory_description || part._matches?.m_description)}</div>}
  </div>
);

export default PartsTableMainRow;
