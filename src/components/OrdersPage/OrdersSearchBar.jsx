import React from 'react';

/**
 * OrdersSearchBar component
 * Renders the search bar for orders with field selection and result count/spinner.
 *
 * Props:
 * - searchTerm: string
 * - searchField: string
 * - onSearchChange: function
 * - onSearchFieldChange: function
 * - onSubmit: function
 * - loading: boolean
 * - totalCount: number
 */
const OrdersSearchBar = ({
  searchTerm,
  searchField,
  onSearchChange,
  onSearchFieldChange,
  onSubmit,
  loading,
  totalCount
}) => (
  <div className="orders-search-container" style={{ position: 'relative' }}>
    <form
      onSubmit={onSubmit}
      className="orders-search-form"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#f1f5f9',
        borderRadius: 8,
        padding: '10px 32px',
        boxShadow: '0 2px 8px #e2e8f0',
        border: '1px solid #cbd5e1',
        margin: '0 0 0px 0',
        width: '100%',
        maxWidth: '1200px'
      }}
    >
      <label
        style={{ fontWeight: 500, color: '#334155', marginRight: 8, fontSize: 15 }}
        htmlFor="orders-search-field-select"
      >
        Search by:
      </label>
      <select
        id="orders-search-field-select"
        value={searchField}
        onChange={onSearchFieldChange}
        className="orders-search-field-select"
        style={{
          padding: '6px 14px',
          fontSize: 15,
          borderRadius: 6,
          border: '1.5px solid #94a3b8',
          background: '#fff',
          color: '#222',
          fontWeight: 500,
          outline: 'none',
          boxShadow: '0 1px 2px #e2e8f0'
        }}
        aria-label="Choose search field"
      >
        <option value="orderName">Order Name</option>
        <option value="createdBy">Created By</option>
      </select>
      <input
        type="text"
        placeholder={searchField === 'orderName' ? 'Search by Order Name' : 'Search by Creator'}
        value={searchTerm}
        onChange={onSearchChange}
        className="orders-search-input"
        aria-label={searchField === 'orderName' ? 'Search orders by name' : 'Search orders by creator'}
        style={{
          padding: '6px 14px',
          fontSize: 15,
          borderRadius: 6,
          border: '1.5px solid #94a3b8',
          background: '#fff',
          color: '#222',
          minWidth: 500,
          width: '100%',
          maxWidth: 900,
          outline: 'none',
          boxShadow: '0 1px 2px #e2e8f0',
          flex: 1
        }}
      />
      {/* Spinner or result count on the right */}
      <span className="searchbar-spinner-fixedwidth" style={{ marginLeft: 12 }}>
        {loading ? (
          <span className="searchbar-spinner" title="Loading...">
            <svg width="22" height="22" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#61dafb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </span>
        ) : (
          <span className="searchbar-result-count searchbar-spinner-fixedwidth">
            {typeof totalCount === 'number' ? `${totalCount} result${totalCount === 1 ? '' : 's'}` : ''}
          </span>
        )}
      </span>
    </form>
  </div>
);

export default OrdersSearchBar;
