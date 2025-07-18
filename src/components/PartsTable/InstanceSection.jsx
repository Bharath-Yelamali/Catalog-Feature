/**
 * InstanceSection Component
 * -------------------------
 * Renders the instance table section for a part, including filtering, selection, and admin controls.
 *
 * Features:
 * - Dynamic dropdown filters for maturity, project, custodian, and parent path
 * - Admin-only spare threshold editing with async update
 * - Checkbox selection for general inventory instances
 * - Accessibility and keyboard navigation support
 * - Uses helper functions for unique value extraction and dropdown rendering
 */

/**
 * Returns a unique array of truthy values.
 * @param {Array} arr
 * @returns {Array}
 */
const unique = arr => Array.from(new Set(arr.filter(Boolean)));

/**
 * Renders a dropdown cell for filtering instance table columns.
 * @param {string} header - The column header label
 * @param {Object} filter - Current filter state
 * @param {Function} setFilter - Setter for filter state
 * @param {Object} openDropdown - Current open dropdown state
 * @param {Function} setOpenDropdown - Setter for open dropdown state
 * @param {Array} values - Dropdown options
 * @param {string|number} groupKey - Key for the group/row
 * @param {React.RefObject} dropdownRef - Ref for the dropdown
 * @param {string} dropdownType - Type of dropdown (project, maturity, etc.)
 * @param {Function} setOpenProjectDropdown
 * @param {Function} setOpenMaturityDropdown
 * @param {Function} setOpenCustodianDropdown
 * @param {Function} setOpenParentPathDropdown
 * @returns {JSX.Element}
 */
function renderDropdown(
  header,
  filter,
  setFilter,
  openDropdown,
  setOpenDropdown,
  values,
  groupKey,
  dropdownRef,
  dropdownType,
  setOpenProjectDropdown,
  setOpenMaturityDropdown,
  setOpenCustodianDropdown,
  setOpenParentPathDropdown
) {
  return (
    <div className="table-cell" style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }} ref={dropdownRef}>
      <span
        onClick={e => {
          e.stopPropagation();
          // Close all dropdowns except the one being opened
          setOpenProjectDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'project' ? !prev[groupKey] : false }));
          setOpenMaturityDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'maturity' ? !prev[groupKey] : false }));
          setOpenCustodianDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'custodian' ? !prev[groupKey] : false }));
          setOpenParentPathDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'parentPath' ? !prev[groupKey] : false }));
        }}
        style={{ fontWeight: 'bold', borderBottom: openDropdown[groupKey] ? '2px solid #2563eb' : 'none' }}
      >
        {header}
      </span>
      {openDropdown[groupKey] && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: '#fff', border: '1px solid #ccc', minWidth: 120 }}>
          <div
            style={{ padding: '6px 12px', cursor: 'pointer', background: !filter[groupKey] ? '#e0e7ef' : '#fff' }}
            onClick={() => {
              setFilter(prev => ({ ...prev, [groupKey]: '' }));
              setOpenDropdown(prev => ({ ...prev, [groupKey]: false }));
            }}
          >
            All
          </div>
          {values.map(val => (
            <div
              key={val}
              style={{ padding: '6px 12px', cursor: 'pointer', background: filter[groupKey] === val ? '#e0e7ef' : '#fff' }}
              onClick={() => {
                setFilter(prev => ({ ...prev, [groupKey]: val }));
                setOpenDropdown(prev => ({ ...prev, [groupKey]: false }));
              }}
            >
              {val}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useRef, useEffect } from 'react';

/**
 * InstanceSection Component
 * -------------------------
 * Renders the instance table section with filtering, selection, and admin controls.
 *
 * @param {Object} props
 * @param {Object} props.group - Group data for the part
 * @param {Object} props.part - Part data
 * @param {boolean} props.isAdmin - Whether the user is an admin
 * @param {Object} props.hiddenFields - Fields to hide in the table
 * @param {Object} props.generalInventoryFilter
 * @param {Function} props.setGeneralInventoryFilter
 * @param {Object} props.spareFeedback
 * @param {Function} props.setSpareFeedback
 * @param {Object} props.requestedInstances
 * @param {Function} props.setRequestedInstances
 * @param {Array} props.instanceSelectionOrder
 * @param {Function} props.setInstanceSelectionOrder
 * @param {Object} props.projectFilter
 * @param {Function} props.setProjectFilter
 * @param {Object} props.openProjectDropdown
 * @param {Function} props.setOpenProjectDropdown
 * @param {Object} props.maturityFilter
 * @param {Function} props.setMaturityFilter
 * @param {Object} props.openMaturityDropdown
 * @param {Function} props.setOpenMaturityDropdown
 * @param {Object} props.custodianFilter
 * @param {Function} props.setCustodianFilter
 * @param {Object} props.openCustodianDropdown
 * @param {Function} props.setOpenCustodianDropdown
 * @param {Object} props.parentPathFilter
 * @param {Function} props.setParentPathFilter
 * @param {Object} props.openParentPathDropdown
 * @param {Function} props.setOpenParentPathDropdown
 * @param {string} props.accessToken
 * @param {Function} props.getInstanceTableGridColumns
 * @param {Function} props.highlightFieldWithMatches
 * @param {any} props.usableSurplus
 * @param {Function} props.updateSpareValue
 * @returns {JSX.Element}
 */
const InstanceSection = ({
  group,
  part,
  isAdmin,
  hiddenFields,
  generalInventoryFilter,
  setGeneralInventoryFilter,
  spareFeedback,
  setSpareFeedback,
  requestedInstances,
  setRequestedInstances,
  instanceSelectionOrder,
  setInstanceSelectionOrder,
  projectFilter,
  setProjectFilter,
  openProjectDropdown,
  setOpenProjectDropdown,
  maturityFilter,
  setMaturityFilter,
  openMaturityDropdown,
  setOpenMaturityDropdown,
  custodianFilter,
  setCustodianFilter,
  openCustodianDropdown,
  setOpenCustodianDropdown,
  parentPathFilter,
  setParentPathFilter,
  openParentPathDropdown,
  setOpenParentPathDropdown,
  accessToken,
  getInstanceTableGridColumns,
  highlightFieldWithMatches,
  usableSurplus,
  updateSpareValue
}) => {


  // Refs for dropdowns
  const projectDropdownRef = useRef(null);
  const maturityDropdownRef = useRef(null);
  const custodianDropdownRef = useRef(null);
  const parentPathDropdownRef = useRef(null);

  // Close all dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        projectDropdownRef.current && !projectDropdownRef.current.contains(event.target) &&
        maturityDropdownRef.current && !maturityDropdownRef.current.contains(event.target) &&
        custodianDropdownRef.current && !custodianDropdownRef.current.contains(event.target) &&
        parentPathDropdownRef.current && !parentPathDropdownRef.current.contains(event.target)
      ) {
        setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
        setOpenMaturityDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
        setOpenCustodianDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
        setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [group.itemNumber, setOpenProjectDropdown, setOpenMaturityDropdown, setOpenCustodianDropdown, setOpenParentPathDropdown]);

  return (
    <div className="instance-section">
      <div className="instance-header">
        <span className="instance-header-title">Instances:</span>
      </div>
      {isAdmin && (
        <div className="spare-threshold-section">
          Spare Threshold for this item:
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={group.instances[0]?.spare_value == null ? 0 : group.instances[0].spare_value}
            onChange={e => {
              const newValue = parseFloat(e.target.value);
              group.instances.forEach(instance => {
                instance.spare_value = isNaN(newValue) ? 0 : newValue;
              });
            }}
            onBlur={async e => {
              const newValue = parseFloat(e.target.value);
              try {
                await Promise.all(
                  group.instances.map(async instance => {
                    try {
                      await updateSpareValue(instance.id, isNaN(newValue) ? 0 : newValue, accessToken);
                      setSpareFeedback(prev => ({ ...prev, [instance.id]: 'success' }));
                      setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 1500);
                    } catch (err) {
                      setSpareFeedback(prev => ({ ...prev, [instance.id]: 'error' }));
                      setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 2500);
                    }
                  })
                );
              } catch (err) {
                // Handle error
              }
            }}
            className="spare-threshold-input"
            aria-label="Edit spare threshold for this item"
          />
        </div>
      )}
      <div className="instance-grid-header" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
        {/* Add Select header for General Inventory checkboxes */}
        <div className="table-cell">Select</div>
        {/* Correct column order: ID, Serial, Quantity, Maturity, Project, Custodian, Path */}
        {!hiddenFields.instanceId && <div className="table-cell">Instance ID</div>}
        {!hiddenFields.serialNumber && <div className="table-cell">Serial Number/Name</div>}
        {!hiddenFields.quantity && <div className="table-cell">Quantity</div>}
        {/* Inventory Maturity Dropdown */}
        {!hiddenFields.inventoryMaturity && renderDropdown(
          'Inventory Maturity',
          maturityFilter,
          setMaturityFilter,
          openMaturityDropdown,
          setOpenMaturityDropdown,
          unique(group.instances.map(i => i.m_maturity)),
          group.itemNumber,
          maturityDropdownRef,
          'maturity'
        )}
        {/* Associated Project Dropdown */}
        {!hiddenFields.associatedProject && renderDropdown(
          'Associated Project',
          projectFilter,
          setProjectFilter,
          openProjectDropdown,
          setOpenProjectDropdown,
          unique(group.instances.map(i => i.m_project?.keyed_name || i.associated_project)),
          group.itemNumber,
          projectDropdownRef,
          'project'
        )}
        {/* Hardware Custodian Dropdown */}
        {!hiddenFields.hardwareCustodian && renderDropdown(
          'Hardware Custodian',
          custodianFilter,
          setCustodianFilter,
          openCustodianDropdown,
          setOpenCustodianDropdown,
          unique(group.instances.map(i => i["m_custodian@aras.keyed_name"] || i.m_custodian)),
          group.itemNumber,
          custodianDropdownRef,
          'custodian'
        )}
        {/* Parent Path Dropdown */}
        {!hiddenFields.parentPath && renderDropdown(
          'Parent Path',
          parentPathFilter,
          setParentPathFilter,
          openParentPathDropdown,
          setOpenParentPathDropdown,
          unique(group.instances.map(i => {
            const match = (i.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
            return match && match[1];
          })),
          group.itemNumber,
          parentPathDropdownRef,
          'parentPath'
        )}
      </div>
      <div className="instance-grid-spacer" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
        {/* Removed the empty column for the triangle/expand button */}
        {!hiddenFields.instanceId && <div></div>}
        {!hiddenFields.serialNumber && <div></div>}
        {!hiddenFields.quantity && <div></div>}
        {!hiddenFields.inventoryMaturity && <div></div>}
        {!hiddenFields.associatedProject && <div></div>}
        {!hiddenFields.hardwareCustodian && <div></div>}
        {!hiddenFields.parentPath && <div></div>}
      </div>
      {group.instances.filter(instance => {
        if (maturityFilter[group.itemNumber] && instance.m_maturity !== maturityFilter[group.itemNumber]) return false;
        if (projectFilter[group.itemNumber] && (instance.m_project?.keyed_name || instance.associated_project) !== projectFilter[group.itemNumber]) return false;
        if (custodianFilter[group.itemNumber] && (instance["m_custodian@aras.keyed_name"] || instance.m_custodian) !== custodianFilter[group.itemNumber]) return false;
        if (parentPathFilter[group.itemNumber]) {
          const match = (instance.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
          if (!match || match[1] !== parentPathFilter[group.itemNumber]) return false;
        }
        return true;
      }).map((instance, idx, filteredInstances) => {
        const isGeneralInventory = (instance.m_project?.keyed_name || instance.associated_project) === 'General Inventory';
        return (
          <div key={instance.id} className="instance-table-row" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
            <div className="instance-checkbox">
              {isGeneralInventory && (
                <input
                  type="checkbox"
                  aria-label="Request this instance"
                  checked={!!requestedInstances[instance.id]}
                  onChange={e => {
                    if (e.target.checked) {
                      setRequestedInstances(prev => ({ ...prev, [instance.id]: true }));
                      setInstanceSelectionOrder(order => [...order.filter(x => x !== instance.id), instance.id]);
                    } else {
                      setRequestedInstances(prev => ({ ...prev, [instance.id]: false }));
                      setInstanceSelectionOrder(order => order.filter(x => x !== instance.id));
                    }
                  }}
                />
              )}
            </div>
            {!hiddenFields.instanceId && (
              <div>
                {instance.id && instance.m_id ? (
                  <a
                    href={`https://chievmimsiiss01/IMSStage/?StartItem=m_Instance:${instance.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instance-link"
                  >
                    {highlightFieldWithMatches(instance.m_id, part._matches?.m_id)}
                  </a>
                ) : (
                  highlightFieldWithMatches('N/A', part._matches?.m_id)
                )}
              </div>
            )}
            {!hiddenFields.serialNumber && <div>{highlightFieldWithMatches(instance.m_serial_number || instance.m_name || 'N/A', part._matches?.m_serial_number)}</div>}
            {!hiddenFields.quantity && <div>{highlightFieldWithMatches((instance.m_quantity ?? 'N/A').toString(), part._matches?.m_quantity)}</div>}
            {!hiddenFields.inventoryMaturity && <div>{highlightFieldWithMatches(instance.m_maturity || 'N/A', part._matches?.m_maturity)}</div>}
            {!hiddenFields.associatedProject && <div>{highlightFieldWithMatches((instance.m_project?.keyed_name || instance.associated_project || 'N/A').toString(), part._matches?.m_project)}</div>}
            {!hiddenFields.hardwareCustodian && <div>{highlightFieldWithMatches(instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A', part._matches?.m_custodian)}</div>}
            {!hiddenFields.parentPath && <div>{highlightFieldWithMatches(instance.m_parent_ref_path || 'N/A', part._matches?.m_parent_ref_path)}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default InstanceSection;
