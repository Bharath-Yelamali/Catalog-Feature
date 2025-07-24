/**
 * Utility functions for handling search operations
 */

/**
 * Transform chips array into API search parameters
 * @param {Array} chips - Array of {field, value} objects
 * @returns {Object} - Object with field-value pairs (or arrays) for API
 */
export const buildSearchParams = (chips) => {
  if (!chips || chips.length === 0) {
    return {};
  }

  const searchParams = {};
  
  chips.forEach(chip => {
    if (chip.field) {
      const field = chip.field;
      let valueObj = null;

      // Case 1: chip has top-level operator and value (value is string)
      if (chip.operator && typeof chip.value === 'string') {
        if (chip.value.trim() === '') return;
        valueObj = { operator: chip.operator, value: chip.value.trim() };
      }
      // Case 2: chip.value is an object with operator and value
      else if (typeof chip.value === 'object' && chip.value.operator && chip.value.value) {
        if (typeof chip.value.value === 'string' && chip.value.value.trim() === '') return;
        valueObj = { operator: chip.value.operator, value: chip.value.value.trim() };
      }
      // Case 3: legacy string value, no operator
      else if (typeof chip.value === 'string') {
        if (chip.value.trim() === '') return;
        valueObj = { operator: 'contains', value: chip.value.trim() };
      }
      // Otherwise, skip invalid
      if (!valueObj) return;

      if (searchParams[field]) {
        if (Array.isArray(searchParams[field])) {
          searchParams[field].push(valueObj);
        } else {
          searchParams[field] = [searchParams[field], valueObj];
        }
      } else {
        searchParams[field] = valueObj;
      }
    }
  });

  return searchParams;
};

/**
 * Validate search fields to ensure they have valid values
 * @param {Array} chips - Array of {field, value} objects where value can be string or {operator, value}
 * @returns {Object} - {isValid: boolean, errors: Array}
 */
export const validateSearchFields = (chips) => {
  if (!chips || chips.length === 0) {
    return {
      isValid: false,
      errors: ['At least one search parameter is required']
    };
  }

  const errors = [];
  
  chips.forEach((chip, index) => {
    if (!chip.field) {
      errors.push(`Search parameter ${index + 1} is missing a field`);
    }
    
    // Handle both operator-value object and legacy string format
    let hasValue = false;
    if (chip.value) {
      if (typeof chip.value === 'object' && chip.value.operator && chip.value.value) {
        hasValue = chip.value.value.trim() !== '';
      } else if (typeof chip.value === 'string') {
        hasValue = chip.value.trim() !== '';
      }
    }
    
    if (!hasValue) {
      errors.push(`Search parameter ${index + 1} is missing a value`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Build query string from search parameters
 * @param {Object} searchParams - Object with field-value pairs
 * @returns {string} - Query string for URL
 */
export const buildQueryString = (searchParams) => {
  const params = [];
  
  Object.entries(searchParams).forEach(([field, value]) => {
    if (value && value.trim() !== '') {
      params.push(`${encodeURIComponent(field)}=${encodeURIComponent(value.trim())}`);
    }
  });

  return params.length > 0 ? params.join('&') : '';
};
