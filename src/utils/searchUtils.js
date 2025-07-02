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
    if (chip.field && chip.value) {
      const field = chip.field;
      let value = chip.value;
      
      // Handle operator-value object format
      if (typeof value === 'object' && value.operator && value.value) {
        // Keep the operator-value object intact
        if (value.value.trim() === '') {
          return; // Skip empty values
        }
      } else if (typeof value === 'string') {
        // Handle legacy string format
        if (value.trim() === '') {
          return; // Skip empty values
        }
        // Convert to operator-value object with default "contains" operator
        value = { operator: 'contains', value: value.trim() };
      } else {
        return; // Skip invalid values
      }
      
      if (searchParams[field]) {
        // If field already exists, convert to array or add to existing array
        if (Array.isArray(searchParams[field])) {
          searchParams[field].push(value);
        } else {
          searchParams[field] = [searchParams[field], value];
        }
      } else {
        // First value for this field
        searchParams[field] = value;
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
