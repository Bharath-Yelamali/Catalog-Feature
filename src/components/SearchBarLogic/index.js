/**
 * SearchBarLogic - Complete Search & Filter Logic Module
 * 
 * This module contains ALL search-related functionality that was previously scattered
 * throughout PartsTable.jsx, providing a clean separation of concerns.
 * 
 * COMPLETED REFACTORING:
 * - ✅ Field Management: All show/hide column logic extracted from PartsTable.jsx
 * - ✅ Filter Management: All filter conditions and logic extracted from PartsTable.jsx  
 * - ✅ Search Utilities: Text highlighting and truncation logic extracted from PartsTable.jsx
 * - ✅ PropTypes: Runtime type validation added for all components and hooks
 * - ✅ Error Handling: Robust error handling and input validation throughout
 * - ✅ Performance: Memoization and useCallback optimizations applied
 * - ✅ Accessibility: ARIA attributes and keyboard navigation support
 * - ✅ Modular Structure: Split into discrete hooks, components, and constants
 * 
 * ARCHITECTURE:
 * - useFieldManagement: Manages column visibility and table layout
 * - useFilterManagement: Handles all filter conditions and API integration
 * - useSearchUtilities: Provides text highlighting and formatting utilities
 * - HideFieldsButton: UI component for field visibility controls
 * - FilterButton: UI component for filter condition management
 * 
 * This refactoring achieves:
 * 1. Clear separation between search/filter logic and business/display logic
 * 2. Reusable hooks that can be used across other components
 * 3. Maintainable, testable, and well-documented code
 * 4. Improved performance through proper memoization
 * 5. Better accessibility and user experience
 */

// Export hooks
export { useFieldManagement } from './hooks/useFieldManagement';
export { useFilterManagement } from './hooks/useFilterManagement';
export { useSearchUtilities } from './hooks/useSearchUtilities.jsx';

// Export components
export { HideFieldsButton } from './components/HideFieldsButton';
export { FilterButton } from './components/FilterButton';

// Export constants
export { allFields, searchableFields, FIELD_TYPES, DEBOUNCE_DELAY_MS } from './constants';
