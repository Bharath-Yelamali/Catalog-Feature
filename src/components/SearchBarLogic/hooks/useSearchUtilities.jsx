import React, { useCallback } from 'react';

/**
 * Custom hook for search-related utilities and text processing
 * @returns {Object} Search utility functions
 */
export function useSearchUtilities() {
  /**
   * Highlights all backend-matched keywords in a text field
   * @param {string} text - The text to highlight
   * @param {Array} matches - Array of keywords to highlight
   * @returns {string|Array} Original text or array of React elements with highlights
   */
  const highlightFieldWithMatches = useCallback((text, matches) => {
    try {
      if (!matches || !text) return text;
      
      // Validate inputs
      if (typeof text !== 'string') {
        console.warn('highlightFieldWithMatches: text is not a string');
        return text;
      }
      
      if (!Array.isArray(matches)) {
        console.warn('highlightFieldWithMatches: matches is not an array');
        return text;
      }
      
      // matches is an array of keywords to highlight
      let result = [];
      let lowerText = text.toLowerCase();
      let ranges = [];
      
      for (const kw of matches) {
        if (!kw || typeof kw !== 'string') continue;
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
          <span className="search-highlight" key={`highlight-${m.start}`}>
            {text.slice(m.start, m.end)}
          </span>
        );
        cursor = m.end;
      }
      if (cursor < text.length) {
        result.push(text.slice(cursor));
      }
      return result;
    } catch (error) {
      console.error('Error in highlightFieldWithMatches:', error);
      return text; // Fail safely by returning original text
    }
  }, []);

  /**
   * Truncates text to a specified length and adds ellipsis
   * @param {string} str - The text to truncate
   * @param {number} max - Maximum length before truncation (default: 20)
   * @returns {string} Truncated text with ellipsis if needed
   */
  const truncateText = useCallback((str, max = 20) => {
    try {
      if (!str || typeof str !== 'string') return str;
      if (str.length <= max) return str;
      return str.slice(0, max) + '...';
    } catch (error) {
      console.error('Error in truncateText:', error);
      return str || '';
    }
  }, []);

  return {
    highlightFieldWithMatches,
    truncateText
  };
}
