
/**
 * @file useSearchUtilities.jsx
 * @description
 *   Custom React hook providing utility functions for search-related text processing.
 *   Includes helpers for highlighting matched keywords in text and truncating long strings for UI display.
 *
 *   Exposes functions for use in search result rendering and text formatting.
 *
 * @exports useSearchUtilities
 */
import React, { useCallback } from 'react';

/**
 * Custom hook for search-related utilities and text processing.
 * Provides helpers for highlighting keywords and truncating text.
 *
 * @returns {Object} Search utility functions
 */
export function useSearchUtilities() {
  /**
   * Highlights all backend-matched keywords in a text field.
   * Returns the original text or an array of React elements with <span> highlights.
   *
   * @param {string} text - The text to highlight
   * @param {Array} matches - Array of keywords to highlight
   * @returns {string|Array} Original text or array of React elements with highlights
   */
  const highlightFieldWithMatches = useCallback((text, matches) => {
    try {
      if (!matches || !text) return text;
      // --- Input validation ---
      if (typeof text !== 'string') {
        console.warn('highlightFieldWithMatches: text is not a string');
        return text;
      }
      if (!Array.isArray(matches)) {
        console.warn('highlightFieldWithMatches: matches is not an array');
        return text;
      }
      // --- Find all keyword match ranges (case-insensitive) ---
      let result = [];
      let lowerText = text.toLowerCase();
      let ranges = [];
      for (const kw of matches) {
        if (!kw || typeof kw !== 'string') continue;
        let idx = lowerText.indexOf(kw.toLowerCase());
        while (idx !== -1) {
          // Record start/end index for each match
          ranges.push({ start: idx, end: idx + kw.length });
          idx = lowerText.indexOf(kw.toLowerCase(), idx + kw.length);
        }
      }
      if (ranges.length === 0) return text;
      // --- Sort and merge overlapping/adjacent ranges ---
      ranges.sort((a, b) => a.start - b.start);
      let merged = [];
      for (const r of ranges) {
        if (!merged.length || merged[merged.length - 1].end < r.start) {
          merged.push({ ...r });
        } else {
          // Merge overlapping ranges
          merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
        }
      }
      // --- Build output: alternate plain and highlighted spans ---
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
   * Truncates text to a specified length and adds ellipsis if needed.
   * Used for shortening long strings in UI tables, etc.
   *
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

  // --- Expose utility functions ---
  return {
    highlightFieldWithMatches, // Highlights keywords in text
    truncateText               // Truncates long text for display
  };
}
