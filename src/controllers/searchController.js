/**
 * Search Controller - Orchestrates different types of searches
 */

import { fetchParts, fetchPartsByFields } from '../api/parts.js';
import { buildSearchParams, validateSearchFields } from '../utils/searchUtils.js';

/**
 * Execute search based on search mode and data
 * @param {string} searchMode - 'searchAll' or 'specifySearch'
 * @param {Object} searchData - Search data (string for searchAll, chips array for specifySearch)
 * @param {Object} options - Additional options (filterType, classification, accessToken, signal)
 * @returns {Promise} - Search results
 */
export const executeSearch = async (searchMode, searchData, options = {}) => {
  const {
    filterType = 'all',
    classification = 'Inventoried',
    accessToken,
    signal
  } = options;

  try {
    if (searchMode === 'searchAll') {
      // Traditional search mode
      const searchTerm = searchData || '';
      
      if (searchTerm.trim() === '') {
        return await fetchParts({ 
          classification, 
          signal, 
          accessToken 
        });
      } else {
        return await fetchParts({ 
          classification, 
          search: searchTerm, 
          filterType, 
          signal, 
          accessToken 
        });
      }
    } else if (searchMode === 'specifySearch') {
      // Field-specific search mode
      const chips = searchData || {};

      // Extract logical operator and conditions from new format
      const conditions = chips.conditions || chips; // Support both old and new format
      const logicalOperator = chips.logicalOperator || 'and'; // Default to 'and'

      // Validate search fields
      const validation = validateSearchFields(conditions);
      if (!validation.isValid) {
        throw new Error(`Invalid search parameters: ${validation.errors.join(', ')}`);
      }

      // Build search parameters
      const searchParams = buildSearchParams(conditions);

      return await fetchPartsByFields({
        classification,
        searchParams,
        filterType,
        logicalOperator,
        signal,
        accessToken
      });
    } else {
      throw new Error(`Unsupported search mode: ${searchMode}`);
    }
  } catch (error) {
    console.error('Search execution error:', error);
    throw error;
  }
};

/**
 * Process search results uniformly regardless of search mode
 * @param {Object} data - Raw API response
 * @returns {Array} - Processed results grouped by inventory item number
 */
export const processSearchResults = (data) => {
  const fetchedParts = data.value || [];
  
  // Group parts by inventory item number
  const grouped = {};
  for (const part of fetchedParts) {
    const itemNumber = part.m_inventory_item?.item_number || 'Unknown';
    if (!grouped[itemNumber]) grouped[itemNumber] = [];
    grouped[itemNumber].push(part);
  }
  
  // Convert grouped object to array for easier rendering
  const groupedResults = Object.entries(grouped).map(([itemNumber, instances]) => ({
    itemNumber,
    instances
  }));
  
  return groupedResults;
};
