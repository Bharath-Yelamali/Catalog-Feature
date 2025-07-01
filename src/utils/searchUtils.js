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
    if (chip.field && chip.value && chip.value.trim() !== '') {
      const field = chip.field;
      const value = chip.value.trim();
      
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
 * @param {Array} chips - Array of {field, value} objects
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
    if (!chip.value || chip.value.trim() === '') {
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
