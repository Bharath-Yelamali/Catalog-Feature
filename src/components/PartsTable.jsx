import React, { useState, useEffect } from 'react';
import { updateSpareValue } from '../api/parts';

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '', setPage, isAdmin, accessToken, requestPopup, setRequestPopup }) {
  const [expandedValue, setExpandedValue] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState('');
  // Remove old selected/quantity logic for flat parts
  // Add expand/collapse state for each itemNumber
  const [expandedRows, setExpandedRows] = useState({});
  // State for select all checkbox
  const [selectAll, setSelectAll] = useState(false);
  // State for filtering instances by General Inventory per group
  const [generalInventoryFilter, setGeneralInventoryFilter] = useState({});
  // Spare threshold feedback state
  const [spareFeedback, setSpareFeedback] = useState({}); // { [instanceId]: 'success' | 'error' | null }
  // Add state to track requested instances
  const [requestedInstances, setRequestedInstances] = useState({}); // { [instanceId]: true/false }
  // State for filtering instances by associated project
  const [projectFilter, setProjectFilter] = useState({}); // { [itemNumber]: projectName }
  // Add state for open project dropdown
  const [openProjectDropdown, setOpenProjectDropdown] = useState({}); // { [itemNumber]: boolean }
  // Add state for open parent path dropdown
  const [openParentPathDropdown, setOpenParentPathDropdown] = useState({}); // { [itemNumber]: boolean }
  const [parentPathFilter, setParentPathFilter] = useState({}); // { [itemNumber]: parentPathSection }

  // 1. Add state to track the order in which instances are checked
  const [instanceSelectionOrder, setInstanceSelectionOrder] = useState([]); // array of instance ids in order of selection

  // Helper to truncate from the right (show left side, hide right side)
  const truncate = (str, max = 20) => {
    if (!str || str.length <= max) return str;
    return str.slice(0, max) + '...';
  };

  // Handler for clicking a cell
  const handleCellClick = (label, value) => {
    if (value && value.length > 20) {
      setExpandedValue(value);
      setExpandedLabel(label);
    }
  };

  // Handler for closing the expanded box
  const handleClose = () => {
    setExpandedValue(null);
    setExpandedLabel('');
  };

  // Combine selected items and current results, deduplicating by id
  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  // Find the group for each selected id (itemNumber)
  const selectedGroups = selectedIds
    .map(id => results.find(group => group.itemNumber === id))
    .filter(Boolean);
  // Non-selected groups
  const nonSelectedGroups = results.filter(group => !selectedIds.includes(group.itemNumber));
  // Display selected groups at the top
  const displayGroups = [...selectedGroups, ...nonSelectedGroups];

  const handleQuantityChange = (id, value, e) => {
    // Only allow positive integers or empty
    if (/^\d*$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
      // Only check the box if Enter is pressed and value is not empty
      if (e && e.key === 'Enter' && value.trim() !== '') {
        setSelected(prev => ({ ...prev, [id]: results.find(group => group.itemNumber === id) }));
        // Prevent form submission or default Enter behavior
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
      }
    }
  };

  const handleCheckboxChange = (id, part) => {
    setSelected(prev => {
      const newSelected = { ...prev };
      if (newSelected[id]) {
        // Uncheck: remove from selected
        delete newSelected[id];
      } else {
        // Check: add to selected
        newSelected[id] = part;
      }
      return newSelected;
    });
  };

  // Helper to highlight all backend-matched keywords in a field
  const highlightFieldWithMatches = (text, matches) => {
    if (!matches || !text) return text;
    // matches is an array of keywords to highlight
    let result = [];
    let lowerText = text.toLowerCase();
    let ranges = [];
    for (const kw of matches) {
      if (!kw) continue;
      let idx = lowerText.indexOf(kw.toLowerCase());
      while (idx !== -1) {
        ranges.push({ start: idx, end: idx + kw.length });
        idx = lowerText.indexOf(kw.toLowerCase(), idx + kw.length);
      }
    }
    if (ranges.length === 0) return text;
    // Sort and merge overlapping ranges
    ranges.sort((a, b) => a.start - b.start);
    let merged = [];
    for (const r of ranges) {
      if (!merged.length || merged[merged.length - 1].end < r.start) {
        merged.push({ ...r });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      }
    }
    // Build highlighted output
    let cursor = 0;
    for (const m of merged) {
      if (cursor < m.start) {
        result.push(text.slice(cursor, m.start));
      }
      result.push(
        <span style={{ background: '#ffe066', color: '#222', fontWeight: 600 }} key={m.start}>
          {text.slice(m.start, m.end)}
        </span>
      );
      cursor = m.end;
    }
    if (cursor < text.length) {
      result.push(text.slice(cursor));
    }
    return result;
  };

  const handleExpandToggle = (itemNumber) => {
    setExpandedRows(prev => ({ ...prev, [itemNumber]: !prev[itemNumber] }));
  };

  // Handler for select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      // Select all visible groups
      const newSelected = { ...selected };
      displayGroups.forEach(group => {
        newSelected[group.itemNumber] = group.instances[0];
      });
      setSelected(newSelected);
    } else {
      // Deselect all visible groups
      const newSelected = { ...selected };
      displayGroups.forEach(group => {
        delete newSelected[group.itemNumber];
      });
      setSelected(newSelected);
    }
  };

  // Helper to cap requested instances for a group at usable surplus
  function getCappedRequestedInstances(group, requestedInstances, generalInventoryFilter) {
    const part = group.instances[0];
    const spareThreshold = part.spare_value == null ? 0 : part.spare_value;
    const total = part.total == null ? 0 : part.total;
    const inUse = part.inUse == null ? 0 : part.inUse;
    const generalInventoryAmount = total - inUse;
    const essentialReserve = Math.ceil(spareThreshold * inUse);
    const usableSurplus = generalInventoryAmount - essentialReserve;
    const checkedInstances = (generalInventoryFilter[group.itemNumber]
      ? group.instances.filter(instance => instance.generalInventory)
      : group.instances
    ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
    let runningTotal = 0;
    return checkedInstances.reduce((acc, inst) => {
      const qty = parseInt(inst.m_quantity, 10) || 0;
      if (runningTotal + qty <= usableSurplus) {
        acc[inst.id] = true;
        runningTotal += qty;
      }
      return acc;
    }, {});
  }

  // Add a class to the body to disable pointer events when modal is open
  useEffect(() => {
    if (requestPopup.open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [requestPopup.open]);

  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
            <div className="search-result-field">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={displayGroups.length > 0 && displayGroups.every(group => selected[group.itemNumber])}
                onChange={handleSelectAll}
              />
            </div>
            <div className="search-result-field">Qty</div>
            <div className="search-result-field"></div>
            <div className="search-result-field">Total</div>
            <div className="search-result-field">In Use</div>
            <div className="search-result-field">Essential Reserve</div>
            <div className="search-result-field">Usable Surplus</div>
            <div className="search-result-field">Inventory Item Number</div>
            <div className="search-result-field">Manufactur Part #</div>
            <div className="search-result-field">Manufacturer Name</div>
            <div className="search-result-field">Inventory Description</div>
          </div>
          {displayGroups.map(group => {
            const part = group.instances[0];
            // If spare_value is null, treat it as 0
            const spareThreshold = part.spare_value == null ? 0 : part.spare_value;
            const total = part.total == null ? 0 : part.total;
            const inUse = part.inUse == null ? 0 : part.inUse;
            // General inventory amount
            const generalInventoryAmount = total - inUse;
            // Essential Reserve is required spare
            const essentialReserve = Math.ceil(spareThreshold * inUse);
            // Usable Surplus is general inventory minus essential reserve
            const usableSurplus = generalInventoryAmount - essentialReserve;
            return (
              <div key={group.itemNumber}>
                <div className="search-result-item" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
                  <div className="search-result-field">
                    <input
                      type="checkbox"
                      checked={!!selected[group.itemNumber]}
                      onChange={() => handleCheckboxChange(group.itemNumber, part)}
                      aria-label="Select part"
                    />
                  </div>
                  <div className="search-result-field">
                    <input
                      type="text"
                      className="quantity-input"
                      value={quantities[group.itemNumber] || ''}
                      onChange={e => handleQuantityChange(group.itemNumber, e.target.value)}
                      onBlur={e => {
                        // If quantity is not empty, check the box on blur
                        if ((e.target.value || '').trim() !== '') {
                          setSelected(prev => ({ ...prev, [group.itemNumber]: part }));
                        }
                      }}
                      onKeyDown={e => handleQuantityChange(group.itemNumber, quantities[group.itemNumber] || e.target.value, e)}
                      placeholder="0"
                      min="0"
                      style={{ width: 60, textAlign: 'center' }}
                      aria-label="Quantity"
                    />
                  </div>
                  <div className="search-result-field">
                    <button onClick={() => handleExpandToggle(group.itemNumber)} aria-label="Expand details" style={{ padding: 0, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
                      {expandedRows[group.itemNumber] ? '▲' : '▼'}
                    </button>
                  </div>
                  <div className="search-result-field">{truncate(part.total?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(part.inUse?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(essentialReserve.toString())}</div>
                  <div className="search-result-field" style={{
                    color: usableSurplus > 0 ? '#228B22' : undefined,
                    fontWeight: usableSurplus > 0 ? 700 : undefined,
                  }}>
                    {truncate(usableSurplus.toString())}
                  </div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Item Number', part.m_inventory_item?.item_number)} style={{ cursor: part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_inventory_item?.item_number ?? 'N/A'), part._matches?.m_inventory_item)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Part #', part.m_mfg_part_number)} style={{ cursor: part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_part_number ?? 'N/A'), part._matches?.m_mfg_part_number)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Name', part.m_mfg_name)} style={{ cursor: part.m_mfg_name && part.m_mfg_name.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_name ?? 'N/A'), part._matches?.m_mfg_name)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Description', part.m_inventory_description || part.m_description)} style={{ cursor: (part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate((part.m_inventory_description ?? part.m_description) ?? 'N/A'), part._matches?.m_inventory_description || part._matches?.m_description)}</div>
                </div>
                {expandedRows[group.itemNumber] && (
                  <div style={{ background: '#f9f9f9', padding: '0 16px 12px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '8px 0 4px 0', gap: 0 }}>
                      <span style={{ fontSize: 20, marginBottom: 2 }}>Instances:</span>
                    </div>
                    {isAdmin && (
                      <div style={{ margin: '0 0 8px 0', fontWeight: 400, fontSize: 16, color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        Spare Threshold for this item:
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={group.instances[0]?.spare_value == null ? 0 : group.instances[0].spare_value}
                          onChange={e => {
                            const newValue = parseFloat(e.target.value);
                            // Update spare_value for all instances in this group locally
                            group.instances.forEach(instance => {
                              instance.spare_value = isNaN(newValue) ? 0 : newValue;
                            });
                            // Force re-render
                            setSelected(selected => ({ ...selected }));
                          }}
                          onBlur={async e => {
                            const newValue = parseFloat(e.target.value);
                            try {
                              // For each instance, call backend to update spare_value
                              await Promise.all(
                                group.instances.map(async instance => {
                                  try {
                                    await updateSpareValue(instance.id, isNaN(newValue) ? 0 : newValue, accessToken);
                                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'success' }));
                                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 1500);
                                  } catch (err) {
                                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'error' }));
                                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 2500);
                                    throw err; // Rethrow to handle in the outer catch
                                  }
                                })
                              );
                              // Log a single success message for the entire group
                              console.log(`Spare threshold successfully updated to ${isNaN(newValue) ? 0 : newValue} for ${group.instances.length} instances of ${group.itemNumber}.`);
                            } catch (err) {
                              console.error('Failed to update spare threshold:', err);
                            }
                          }}
                          style={{ width: 60, marginLeft: 6, fontWeight: 600, color: '#2d6a4f', border: '1px solid #bcd6f7', borderRadius: 4, padding: '2px 6px', background: '#f8fafc' }}
                          aria-label="Edit spare threshold for this item"
                        />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr 1fr 2fr 2fr 2fr', gap: 8, fontWeight: 'bold', marginBottom: 4, alignItems: 'center', minHeight: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            color: '#222',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            padding: '0px 10px',
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: 'pointer',
                            marginBottom: 0,
                            width: 'auto',
                            minWidth: 80,
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#ffe066')}
                          onFocus={e => (e.currentTarget.style.background = '#ffe066')}
                          onMouseOut={e => (e.currentTarget.style.background = 'none')}
                          onBlur={e => (e.currentTarget.style.background = 'none')}
                          onClick={() => {
                            // Find all checked instances for this group
                            const checkedInstances = (generalInventoryFilter[group.itemNumber]
                              ? group.instances.filter(instance => instance.generalInventory)
                              : group.instances
                            ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
                            // Get unique custodians from checked instances
                            const custodians = Array.from(new Set(
                              checkedInstances.map(inst => inst["m_custodian@aras.keyed_name"] || inst.m_custodian).filter(Boolean)
                            ));

                            // Calculate capped quantities for each checked instance (for email/request)
                            // Use selection order so the last-checked instance gets the capped/partial quantity
                            let runningTotal = 0;
                            const usableSurplusQty = usableSurplus;
                            // Order checkedInstances by selection order (last-checked last)
                            const checkedInstanceIds = checkedInstances.map(inst => inst.id);
                            const orderedIds = instanceSelectionOrder.filter(id => checkedInstanceIds.includes(id));
                            const orderedCheckedInstances = orderedIds.map(id => checkedInstances.find(inst => inst.id === id)).filter(Boolean);
                            const cappedInstances = [];
                            for (const inst of orderedCheckedInstances) {
                              const qty = parseInt(inst.m_quantity, 10) || 0;
                              if (runningTotal >= usableSurplusQty) break;
                              let allowedQty = qty;
                              if (runningTotal + qty > usableSurplusQty) {
                                allowedQty = usableSurplusQty - runningTotal;
                              }
                              if (allowedQty > 0) {
                                cappedInstances.push({ ...inst, capped_quantity: allowedQty });
                                runningTotal += allowedQty;
                              }
                            }

                            setRequestPopup({
                              open: true,
                              custodians,
                              group: { ...group, generalInventoryFilter: generalInventoryFilter[group.itemNumber], requestedInstances },
                              cappedInstances // Pass capped instance list for email/request generation
                            });
                          }}
                          aria-label="Request selected instances from hardware custodian"
                        >
                          Request
                        </button>
                        <span style={{ display: 'block', fontWeight: 400, fontSize: 13, color: '#2d6a4f', marginTop: 4 }}>
                          {/* Calculate total quantity of checked instances for this group, capped at usableSurplus */}
                          {(() => {
                            const checkedInstances = (generalInventoryFilter[group.itemNumber]
                              ? group.instances.filter(instance => instance.generalInventory)
                              : group.instances
                            ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
                            const totalQty = checkedInstances.reduce((sum, inst) => sum + (parseInt(inst.m_quantity, 10) || 0), 0);
                            const cappedQty = Math.min(totalQty, usableSurplus);
                            return `Checked Qty: ${cappedQty}`;
                          })()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Instance ID</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Serial Number/Name</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Quantity</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Inventory Maturity</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40, position: 'relative', width: '100%' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            color: '#222',
                            cursor: 'pointer',
                            userSelect: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%'
                          }}
                          aria-label="Filter by associated project"
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation();
                            setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                          }}
                          onBlur={e => {
                            // Optionally close dropdown on blur
                          }}
                        >
                          Associated Project
                          <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
                        </span>
                        {openProjectDropdown[group.itemNumber] && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#fff',
                              border: '1px solid #ccc',
                              borderRadius: 4,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              zIndex: 10,
                              minWidth: 120,
                              marginTop: 2,
                            }}
                            tabIndex={0}
                            onBlur={() => setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                          >
                            <div
                              style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: !projectFilter[group.itemNumber] ? '#f0f0f0' : 'transparent' }}
                              onClick={() => {
                                setProjectFilter(prev => ({ ...prev, [group.itemNumber]: '' }));
                                setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                              }}
                            >
                              All Projects
                            </div>
                            {Array.from(new Set((group.instances || []).map(inst => inst.m_project?.keyed_name || inst.associated_project).filter(Boolean)))
                              .map(project => (
                                <div
                                  key={project}
                                  style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: projectFilter[group.itemNumber] === project ? '#f0f0f0' : 'transparent' }}
                                  onClick={() => {
                                    setProjectFilter(prev => ({ ...prev, [group.itemNumber]: project }));
                                    setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                  }}
                                >
                                  {project}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Hardware Custodian</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40, position: 'relative', width: '100%' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            color: '#222',
                            cursor: 'pointer',
                            userSelect: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%'
                          }}
                          aria-label="Filter by parent path section"
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation();
                            setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                          }}
                          onBlur={e => {
                            // Optionally close dropdown on blur
                          }}
                        >
                          Parent Path
                          <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
                        </span>
                        {openParentPathDropdown[group.itemNumber] && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#fff',
                              border: '1px solid #ccc',
                              borderRadius: 4,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              zIndex: 10,
                              minWidth: 120,
                              marginTop: 2,
                            }}
                            tabIndex={0}
                            onBlur={() => setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                          >
                            <div
                              style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: !parentPathFilter[group.itemNumber] ? '#f0f0f0' : 'transparent' }}
                              onClick={() => {
                                setParentPathFilter(prev => ({ ...prev, [group.itemNumber]: '' }));
                                setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                              }}
                            >
                              All Parent Paths
                            </div>
                            {Array.from(new Set((
                              // Only use instances matching the selected project (if any)
                              projectFilter[group.itemNumber]
                                ? (group.instances || []).filter(inst => (inst.m_project?.keyed_name || inst.associated_project) === projectFilter[group.itemNumber])
                                : (group.instances || [])
                            ).map(inst => {
                              const match = (inst.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
                              return match ? match[1] : null;
                            }).filter(Boolean)))
                              .map(section => (
                                <div
                                  key={section}
                                  style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: parentPathFilter[group.itemNumber] === section ? '#f0f0f0' : 'transparent' }}
                                  onClick={() => {
                                    setParentPathFilter(prev => ({ ...prev, [group.itemNumber]: section }));
                                    setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                  }}
                                >
                                  {section}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr 1fr 2fr 2fr 2fr', gap: 8, marginBottom: 8 }}>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    {(projectFilter[group.itemNumber]
                      ? (generalInventoryFilter[group.itemNumber]
                          ? group.instances.filter(instance => instance.generalInventory && ((instance.m_project?.keyed_name || instance.associated_project) === projectFilter[group.itemNumber]))
                          : group.instances.filter(instance => (instance.m_project?.keyed_name || instance.associated_project) === projectFilter[group.itemNumber])
                        )
                      : (generalInventoryFilter[group.itemNumber]
                          ? group.instances.filter(instance => instance.generalInventory)
                          : group.instances
                        )
                    ).filter(instance => {
                      if (!parentPathFilter[group.itemNumber]) return true;
                      const match = (instance.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
                      return match && match[1] === parentPathFilter[group.itemNumber];
                    }).map((instance, idx, filteredInstances) => {
                      // Calculate running total of checked quantities up to this instance
                      let runningTotal = 0;
                      let checkedCount = 0;
                      filteredInstances.forEach(inst => {
                        if (requestedInstances[inst.id]) {
                          runningTotal += parseInt(inst.m_quantity, 10) || 0;
                          checkedCount++;
                        }
                      });
                      const thisQty = parseInt(instance.m_quantity, 10) || 0;
                      const checked = !!requestedInstances[instance.id];
                      // Calculate what the total would be if this instance were checked
                      const totalIfChecked = runningTotal + (checked ? 0 : thisQty);
                      // Find if any instance is the 'overflow' (the one that pushes over the cap)
                      let overflowFound = false;
                      let tempTotal = 0;
                      let overflowId = null;
                      for (let i = 0; i < filteredInstances.length; i++) {
                        const inst = filteredInstances[i];
                        if (requestedInstances[inst.id] || inst.id === instance.id) {
                          tempTotal += parseInt(inst.m_quantity, 10) || 0;
                          if (!overflowFound && tempTotal > usableSurplus) {
                            overflowFound = true;
                            overflowId = inst.id;
                          }
                        }
                      }
                      // Allow checking if:
                      // - already checked
                      // - total checked qty < usableSurplus
                      // - OR this is the first instance to push over the cap (overflowId === instance.id)
                      const disableCheckbox = !checked && runningTotal >= usableSurplus && overflowId !== instance.id;
                      return (
                        <div key={instance.id + instance.m_id + instance.item_number + instance.m_maturity + (instance["m_custodian@aras.keyed_name"] || instance.m_custodian) + instance.m_parent_ref_path} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr 1fr 2fr 2fr 2fr', gap: 8, borderBottom: '1px solid #eee', padding: '2px 0' }}>
                          <div style={{textAlign: 'center'}}>
                            {instance.generalInventory ? (
                              <input
                                type="checkbox"
                                aria-label="Request this instance"
                                checked={checked}
                                disabled={disableCheckbox}
                                onChange={e => {
                                  if (e.target.checked) {
                                    // Only allow checking if not exceeding the overflow rule
                                    if (!disableCheckbox) {
                                      setRequestedInstances(prev => ({ ...prev, [instance.id]: true }));
                                      setInstanceSelectionOrder(order => [...order.filter(x => x !== instance.id), instance.id]); // move to end if re-checked
                                    }
                                  } else {
                                    setRequestedInstances(prev => ({ ...prev, [instance.id]: false }));
                                    setInstanceSelectionOrder(order => order.filter(x => x !== instance.id));
                                  }
                                }}
                              />
                            ) : null}
                          </div>
                          <div>
                            {instance.id && instance.m_id ? (
                              <a
                                href={`https://chievmimsiiss01/IMSStage/?StartItem=m_Instance:${instance.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1976d2', textDecoration: 'underline', wordBreak: 'break-all' }}
                              >
                                {highlightFieldWithMatches(instance.m_id, part._matches?.m_id)}
                              </a>
                            ) : (
                              highlightFieldWithMatches('N/A', part._matches?.m_id)
                            )}
                          </div>
                          <div>{highlightFieldWithMatches(instance.m_serial_number || instance.m_name || 'N/A', part._matches?.m_serial_number)}</div>
                          <div>{highlightFieldWithMatches((instance.m_quantity ?? 'N/A').toString(), part._matches?.m_quantity)}</div>
                          <div>{highlightFieldWithMatches(instance.m_maturity || 'N/A', part._matches?.m_maturity)}</div>
                          <div>{highlightFieldWithMatches((instance.m_project?.keyed_name || instance.associated_project || 'N/A').toString(), part._matches?.m_project)}</div>
                          <div>{highlightFieldWithMatches(instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A', part._matches?.m_custodian)}</div>
                          <div>{highlightFieldWithMatches(instance.m_parent_ref_path || 'N/A', part._matches?.m_parent_ref_path)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {expandedValue && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} onClick={handleClose}>
              <div style={{
                background: '#fff',
                padding: '24px 32px',
                borderRadius: 8,
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                minWidth: 320,
                maxWidth: '80vw',
                wordBreak: 'break-all',
                position: 'relative',
                cursor: 'auto'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{expandedLabel}</div>
                <textarea
                  value={expandedValue}
                  readOnly
                  style={{ width: '100%', minHeight: 60, fontSize: 15, padding: 8, borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                  onFocus={e => e.target.select()}
                />
                <button style={{ marginTop: 12, float: 'right' }} onClick={handleClose}>Close</button>
              </div>
            </div>
          )}
        </>
      )}
      {/* Next button fixed to the very bottom right, always visible */}
      <div className="confirmation-summary-buttons" style={{ position: 'fixed', bottom: 0, right: 15, zIndex: 100, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button
          className="confirmation-summary-button-submit"
          style={{ fontSize: 22, padding: '6px 48px', minWidth: 90, borderRadius: 10 }}
          disabled={!(selectedIds.length > 0 && selectedIds.every(id => quantities[id] && quantities[id].trim() !== ''))}
          onClick={() => {
            // Cap the requested instances per group at usable surplus (simplified)
            let cappedRequestedInstances = {};
            displayGroups.forEach(group => {
              cappedRequestedInstances = {
                ...cappedRequestedInstances,
                ...getCappedRequestedInstances(group, requestedInstances, generalInventoryFilter)
              };
            });
            // setRequestedInstances(cappedRequestedInstances); // if you want to update state
            setPage('requiredFields');
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PartsTable;
