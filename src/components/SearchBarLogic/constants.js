/**
 * Field configuration constants
 */
export const FIELD_TYPES = {
  MAIN_TABLE: 'mainTable',
  INSTANCE_DETAIL: 'instanceDetail'
};

export const DEBOUNCE_DELAY_MS = 500;

// Define all available fields for the hide/show functionality
export const allFields = [
  { key: 'qty', label: 'Qty', isMainTable: true },
  { key: 'total', label: 'Total', isMainTable: true },
  { key: 'inUse', label: 'In Use', isMainTable: true },
  { key: 'essentialReserve', label: 'Essential Reserve', isMainTable: true },
  { key: 'usableSurplus', label: 'Usable Surplus', isMainTable: true },
  { key: 'inventoryItemNumber', label: 'Inventory Item Number', isMainTable: true },
  { key: 'manufacturerPartNumber', label: 'Manufacturer Part #', isMainTable: true },
  { key: 'manufacturerName', label: 'Manufacturer Name', isMainTable: true },
  { key: 'inventoryDescription', label: 'Inventory Description', isMainTable: true },
  { key: 'instanceId', label: 'Instance ID', isMainTable: false },
  { key: 'serialNumber', label: 'Serial Number/Name', isMainTable: false },
  { key: 'quantity', label: 'Quantity', isMainTable: false },
  { key: 'inventoryMaturity', label: 'Inventory Maturity', isMainTable: false },
  { key: 'associatedProject', label: 'Associated Project', isMainTable: false },
  { key: 'hardwareCustodian', label: 'Hardware Custodian', isMainTable: false },
  { key: 'parentPath', label: 'Parent Path', isMainTable: false }
];

// Define only the searchable fields for the filter dropdown
export const searchableFields = [
  { key: 'inventoryItemNumber', label: 'Inventory Item Number', isMainTable: true },
  { key: 'manufacturerPartNumber', label: 'Manufacturer Part #', isMainTable: true },
  { key: 'manufacturerName', label: 'Manufacturer Name', isMainTable: true },
  { key: 'inventoryDescription', label: 'Inventory Description', isMainTable: true },
  { key: 'instanceId', label: 'Instance ID', isMainTable: false },
  { key: 'm_project', label: 'Associated Project', isMainTable: false },
  { key: 'hardwareCustodian', label: 'Hardware Custodian', isMainTable: false },
  { key: 'parentPath', label: 'Parent Path', isMainTable: false }
];
