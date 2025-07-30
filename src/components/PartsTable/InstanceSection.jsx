
/**
 * InstanceSection.jsx
 * -------------------
 * Renders the instance table section for a part, including filtering, selection, and admin controls.
 *
 * Features:
 * - Dynamic dropdown filters for maturity, project, custodian, and parent path
 * - Admin-only spare threshold editing with async update
 * - Checkbox selection for general inventory instances
 * - Accessibility and keyboard navigation support
 * - Uses helper functions for unique value extraction and dropdown rendering
 *
 * @module InstanceSection
 */
// InstanceSection: Renders the instance table section for a part, including filtering, selection, and admin controls.

/**
 * Returns a unique array of truthy values.
 * @param {Array} arr - Array to filter and deduplicate
 * @returns {Array} Unique, truthy values
 */
function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

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
  // Only add underline style for filterable columns (not for instanceId, serialNumber, quantity)
  const underlineHeaders = ['maturity', 'project', 'custodian', 'parentPath'];
  const isUnderline = underlineHeaders.includes(dropdownType);
  return (
    <div className="table-cell" style={{ position: 'relative', userSelect: 'none' }} ref={dropdownRef}>
      <span
        className={isUnderline ? 'column-header-dropdown-underline' : ''}
        onClick={e => {
          e.stopPropagation();
          setOpenProjectDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'project' ? !prev[groupKey] : false }));
          setOpenMaturityDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'maturity' ? !prev[groupKey] : false }));
          setOpenCustodianDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'custodian' ? !prev[groupKey] : false }));
          setOpenParentPathDropdown(prev => ({ ...prev, [groupKey]: dropdownType === 'parentPath' ? !prev[groupKey] : false }));
        }}
        style={{ fontWeight: 'bold', borderBottom: openDropdown[groupKey] && isUnderline ? '2px solid #2563eb' : 'none', cursor: isUnderline ? 'pointer' : 'default' }}
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
 * Renders the instance table section with filtering, selection, and admin controls.
 *
 * @param {Object} props - Component props
 * @param {Object} props.group - Group data for the part
 * @param {Object} props.part - Part data
 * @param {boolean} props.isAdmin - Whether the user is an admin
 * @param {Object} props.hiddenFields - Fields to hide in the table
 * @param {Object} props.generalInventoryFilter - General inventory filter state
 * @param {Function} props.setGeneralInventoryFilter - Setter for general inventory filter
 * @param {Object} props.spareFeedback - Feedback state for spare threshold updates
 * @param {Function} props.setSpareFeedback - Setter for spare feedback
 * @param {Object} props.requestedInstances - Requested instance selection state
 * @param {Function} props.setRequestedInstances - Setter for requested instances
 * @param {Array} props.instanceSelectionOrder - Order of instance selection
 * @param {Function} props.setInstanceSelectionOrder - Setter for selection order
 * @param {Object} props.projectFilter - Project filter state
 * @param {Function} props.setProjectFilter - Setter for project filter
 * @param {Object} props.openProjectDropdown - Open state for project dropdown
 * @param {Function} props.setOpenProjectDropdown - Setter for project dropdown open state
 * @param {Object} props.maturityFilter - Maturity filter state
 * @param {Function} props.setMaturityFilter - Setter for maturity filter
 * @param {Object} props.openMaturityDropdown - Open state for maturity dropdown
 * @param {Function} props.setOpenMaturityDropdown - Setter for maturity dropdown open state
 * @param {Object} props.custodianFilter - Custodian filter state
 * @param {Function} props.setCustodianFilter - Setter for custodian filter
 * @param {Object} props.openCustodianDropdown - Open state for custodian dropdown
 * @param {Function} props.setOpenCustodianDropdown - Setter for custodian dropdown open state
 * @param {Object} props.parentPathFilter - Parent path filter state
 * @param {Function} props.setParentPathFilter - Setter for parent path filter
 * @param {Object} props.openParentPathDropdown - Open state for parent path dropdown
 * @param {Function} props.setOpenParentPathDropdown - Setter for parent path dropdown open state
 * @param {string} props.accessToken - Access token for API calls
 * @param {Function} props.getInstanceTableGridColumns - Returns grid column layout
 * @param {Function} props.highlightFieldWithMatches - Highlights field matches
 * @param {any} props.usableSurplus - Usable surplus value
 * @param {Function} props.updateSpareValue - Updates spare value for an instance
 * @returns {JSX.Element}
 */
import { getInventoryReserveFromPart } from '../../utils/inventoryCalculations';

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
  updateSpareValue,
  shouldBulkOrder // new prop from PartsTable
}) => {


  // Local state for spare threshold input
  const initialSpareValue = group.instances[0]?.spare_value == null ? 0 : group.instances[0].spare_value;
  const [spareThresholdInput, setSpareThresholdInput] = React.useState(initialSpareValue);

  // Keep input in sync if group.instances changes (e.g., after backend update)
  React.useEffect(() => {
    setSpareThresholdInput(group.instances[0]?.spare_value == null ? 0 : group.instances[0].spare_value);
  }, [group.instances]);

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

  // Calculate number of visible columns for even grid
  const visibleColumns = [
    !hiddenFields.instanceId,
    !hiddenFields.serialNumber,
    !hiddenFields.quantity,
    !hiddenFields.inventoryMaturity,
    !hiddenFields.associatedProject,
    !hiddenFields.hardwareCustodian,
    !hiddenFields.parentPath
  ].filter(Boolean).length;
  const evenGrid = `repeat(${visibleColumns}, 1fr)`;

  return (
    <div className="instance-section">
      <div className="instance-header">
        <span className="instance-header-title">Instances:</span>
      </div>
      {isAdmin && (
        <div className="spare-threshold-section">
          {/* Admin control: Edit spare threshold for this item */}
          Spare Threshold for this item:
          <input
            type="number"
            min="0"
            max="1"
            step=".01"
            value={spareThresholdInput}
            onChange={e => {
              const newValue = parseFloat(e.target.value);
              setSpareThresholdInput(isNaN(newValue) ? '' : newValue);
            }}
            onBlur={async e => {
              const newValue = parseFloat(e.target.value);
              // Recalculate shouldBulkOrder with the new threshold
              const partForCalc = { ...part, spare_value: isNaN(newValue) ? 0 : newValue };
              const { shouldBulkOrder: recalculatedBulkOrder } = getInventoryReserveFromPart(partForCalc);
              await Promise.all(
                group.instances.map(async instance => {
                  instance.spare_value = isNaN(newValue) ? 0 : newValue;
                  try {
                    await updateSpareValue(instance.id, isNaN(newValue) ? 0 : newValue, accessToken, recalculatedBulkOrder);
                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'success' }));
                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 1500);
                  } catch (err) {
                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'error' }));
                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 2500);
                  }
                })
              );
            }}
            className="spare-threshold-input"
            aria-label="Edit spare threshold for this item"
          />
        </div>
      )}
      {/* Instance table header: selection and filter dropdowns */}
      <div className="instance-grid-header" style={{ gridTemplateColumns: evenGrid }}>
        {/* Instance ID Dropdown */}
        {!hiddenFields.instanceId && renderDropdown(
          'Instance ID',
          {}, // not filterable by ID, so pass empty filter
          () => {},
          {},
          () => {},
          unique(group.instances.map(i => i.m_id)),
          group.itemNumber + '-id',
          useRef(null),
          'instanceId',
          () => {}, () => {}, () => {}, () => {}
        )}
        {/* Serial Number/Name Dropdown */}
        {!hiddenFields.serialNumber && renderDropdown(
          'Serial Number/Name',
          {},
          () => {},
          {},
          () => {},
          unique(group.instances.map(i => i.m_serial_number || i.m_name)),
          group.itemNumber + '-serial',
          useRef(null),
          'serialNumber',
          () => {}, () => {}, () => {}, () => {}
        )}
        {/* Quantity Dropdown */}
        {!hiddenFields.quantity && renderDropdown(
          'Quantity',
          {},
          () => {},
          {},
          () => {},
          unique(group.instances.map(i => (i.m_quantity ?? '').toString())),
          group.itemNumber + '-qty',
          useRef(null),
          'quantity',
          () => {}, () => {}, () => {}, () => {}
        )}
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
          'maturity',
          setOpenProjectDropdown, setOpenMaturityDropdown, setOpenCustodianDropdown, setOpenParentPathDropdown
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
          'project',
          setOpenProjectDropdown, setOpenMaturityDropdown, setOpenCustodianDropdown, setOpenParentPathDropdown
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
          'custodian',
          setOpenProjectDropdown, setOpenMaturityDropdown, setOpenCustodianDropdown, setOpenParentPathDropdown
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
          'parentPath',
          setOpenProjectDropdown, setOpenMaturityDropdown, setOpenCustodianDropdown, setOpenParentPathDropdown
        )}
      </div>
      {/* Spacer row for grid alignment */}
      <div className="instance-grid-spacer" style={{ gridTemplateColumns: evenGrid }}>
        {/* Spacer for each column except select */}
        {!hiddenFields.instanceId && <div></div>}
        {!hiddenFields.serialNumber && <div></div>}
        {!hiddenFields.quantity && <div></div>}
        {!hiddenFields.inventoryMaturity && <div></div>}
        {!hiddenFields.associatedProject && <div></div>}
        {!hiddenFields.hardwareCustodian && <div></div>}
        {!hiddenFields.parentPath && <div></div>}
      </div>
      {/* Instance rows: selection, links, and field display */}
      {group.instances.filter(instance => {
        // Extract values using the same logic as dropdowns
        const maturityVal = instance.m_maturity || '';
        const projectVal = instance.m_project?.keyed_name || instance.associated_project || '';
        const custodianVal = instance["m_custodian@aras.keyed_name"] || instance.m_custodian || '';
        const parentPathMatch = (instance.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
        const parentPathVal = parentPathMatch && parentPathMatch[1] ? parentPathMatch[1] : '';

        if (maturityFilter[group.itemNumber] && maturityVal !== maturityFilter[group.itemNumber]) return false;
        if (projectFilter[group.itemNumber] && projectVal !== projectFilter[group.itemNumber]) return false;
        if (custodianFilter[group.itemNumber] && custodianVal !== custodianFilter[group.itemNumber]) return false;
        if (parentPathFilter[group.itemNumber] && parentPathVal !== parentPathFilter[group.itemNumber]) return false;
        return true;
      }).map((instance, idx, filteredInstances) => {
        return (
          <div key={instance.id} className="instance-table-row" style={{ gridTemplateColumns: evenGrid }}>
            {/* Instance ID link */}
            {!hiddenFields.instanceId && (
              <div>
                {instance.id && instance.m_id ? (
                  <a
                    href={`${import.meta.env.VITE_IMS_BASE_URL_2}/?StartItem=m_Instance:${instance.id}`}
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
            {/* Serial Number, Quantity, Maturity, Project, Custodian, Parent Path */}
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
