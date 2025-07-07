# API Client Documentation

Frontend API client modules for communicating with the backend services. Provides type-safe, error-handled interfaces for all backend operations.

## 🏗️ Architecture

### API Base Configuration
```javascript
const BASE_URL = 'http://localhost:3001/api';
```

All API functions include:
- Automatic header construction
- Bearer token authentication
- Comprehensive error handling
- Request/response logging (development)

## 📡 API Modules

### Parts API (`parts.js`)

Main interface for part search, retrieval, and management.

#### Core Functions

**`fetchParts(options)`**
General keyword-based search across multiple fields.

```javascript
const results = await fetchParts({
  classification: 'Inventoried',    // Filter by classification
  top: 500,                        // Limit results
  search: 'rail, !power, bearing', // Comma-separated keywords
  filterType: 'general',           // Search mode
  signal: abortController.signal,  // Cancellation support
  accessToken: userToken           // Authentication
});
```

**Response Format:**
```javascript
{
  value: [
    {
      id: "part-id",
      m_inventory_description: "Rail bearing assembly",
      m_mfg_part_number: "RB-123",
      m_mfg_name: "ACME Corp",
      m_quantity: 10,
      total: 25,      // Total across all instances
      inUse: 15,      // Quantity in use
      spare: 10,      // Available spare quantity
      generalInventory: true,
      _matches: {     // Highlighting information
        m_inventory_description: ["rail", "bearing"]
      }
    }
  ]
}
```

**`fetchPartsByFields(options)`**
Field-specific search with advanced filtering capabilities.

```javascript
const results = await fetchPartsByFields({
  searchParams: {
    'm_inventory_description': ['rail', 'right'], // Multi-value OR
    'm_mfg_name': '!power',                       // NOT logic
    'm_custodian@aras.keyed_name': 'john'         // @ fields (client-side)
  },
  classification: 'Inventoried',
  accessToken: userToken
});
```

**Search Parameter Handling:**
- **Single values**: Sent as string
- **Multiple values**: Sent as array for OR logic
- **NOT logic**: Prefix with `!` for exclusion
- **@ fields**: Handled client-side by backend

**`postNewInventoryPart(part, accessToken)`**
Create new inventory part in the system.

```javascript
const newPart = await postNewInventoryPart({
  item_number: "NEW-123",
  description: "New part description",
  manufacturer: "MFG Corp",
  quantity: 50
}, userToken);
```

**Error Handling:**
- Detects duplicate parts
- Returns structured error objects
- Includes `isDuplicate` flag for duplicate handling

**`updateSpareValue(instanceId, spareValue, accessToken)`**
Update spare quantity for a specific part instance.

```javascript
await updateSpareValue("instance-id-123", 15, userToken);
```

### Identity API (`identity.js`)

Handles user authentication and session management.

**Key Functions:**
- User login/logout
- Token management
- Session validation
- User profile retrieval

### Orders API (`orders.js`)

Manages procurement orders and requests.

**Features:**
- Order creation and submission
- Order status tracking
- Order history retrieval
- Bulk order operations

### Project API (`project.js`)

Project-related data management.

**Capabilities:**
- Project information retrieval
- Project-part associations
- Project-specific inventory

### Supplier API (`supplier.js`)

Supplier and vendor management.

**Functions:**
- Supplier information
- Vendor catalogs
- Procurement relationships

### User Info API (`userInfo.js`)

User profile and preferences management.

**Features:**
- User profile data
- Preferences storage
- User activity tracking

## 🔧 Utility Functions

### Header Construction
```javascript
function buildHeaders(accessToken, additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}
```

### URL Building
```javascript
function buildURL(endpoint, params) {
  let url = `${BASE_URL}${endpoint}`;
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return url;
}
```

## 🔍 Advanced Search Implementation

### Search Parameter Processing

The `fetchPartsByFields` function handles complex search scenarios:

**Multi-value Fields:**
```javascript
// Frontend sends:
{
  m_inventory_description: ['rail', 'right']
}

// Becomes URL parameters:
m_inventory_description=rail&m_inventory_description=right

// Backend creates OData:
(contains(m_inventory_description, 'rail') or contains(m_inventory_description, 'right'))
```

**NOT Logic:**
```javascript
// Frontend sends:
{
  m_inventory_description: ['rail', '!power']
}

// Backend creates OData:
contains(m_inventory_description, 'rail') and not (contains(m_inventory_description, 'power'))
```

### Search Modes

**General Search (`fetchParts`):**
- Free-text keyword search
- Searches across predefined fields
- Supports include/exclude logic
- Returns highlighting information

**Field-Specific Search (`fetchPartsByFields`):**
- Targeted field searches
- Multi-value support per field
- Advanced filtering logic
- Client-side filtering for special fields

## 🚨 Error Handling

### Error Types

**Network Errors:**
```javascript
try {
  const results = await fetchParts(options);
} catch (error) {
  if (error.message === 'Failed to fetch parts') {
    // Handle network/API error
  }
}
```

**Authentication Errors:**
- 401 Unauthorized responses
- Token expiration handling
- Automatic logout on auth failure

**Validation Errors:**
- Invalid parameter formats
- Missing required fields
- Data type mismatches

**Duplicate Part Errors:**
```javascript
try {
  await postNewInventoryPart(part, token);
} catch (error) {
  if (error.isDuplicate) {
    // Handle duplicate part scenario
  }
}
```

### Error Response Format
```javascript
{
  error: "Error message",
  status: 400,
  details: "Additional error details"
}
```

## 🔒 Authentication

### Token Management
All API calls require valid authentication tokens:

```javascript
// Store token after login
localStorage.setItem('authToken', token);

// Use token in API calls
const token = localStorage.getItem('authToken');
const results = await fetchParts({ accessToken: token });
```

### Token Validation
- Automatic token validation on API calls
- Graceful handling of expired tokens
- Redirect to login on authentication failure

## 🚀 Performance Considerations

### Request Optimization
- Abort controller support for cancelling requests
- Debounced search input to reduce API calls
- Efficient parameter encoding

### Caching Strategy
- Browser-level caching for static data
- Session-based caching for user data
- Cache invalidation on data updates

### Error Recovery
- Automatic retry for transient failures
- Graceful degradation on API errors
- Offline detection and handling

## 🧪 Development & Testing

### Debug Logging
Development mode includes detailed logging:
```javascript
console.log('Frontend API request URL:', url);
console.log('Fetched parts from backend API:', data);
```

### Testing API Calls
```javascript
// Manual testing
const testResults = await fetchParts({
  search: 'test',
  accessToken: 'test-token'
});

// Error testing
try {
  await fetchParts({ accessToken: 'invalid-token' });
} catch (error) {
  console.log('Expected error:', error.message);
}
```

### Mock Data
For development without backend:
```javascript
// Create mock implementations
const mockFetchParts = async (options) => ({
  value: [/* mock data */]
});
```

## 📋 Usage Examples

### Basic Part Search
```javascript
import { fetchParts } from '../api/parts.js';

const searchParts = async (searchTerm) => {
  try {
    const results = await fetchParts({
      search: searchTerm,
      accessToken: userToken
    });
    return results.value;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};
```

### Advanced Field Search
```javascript
import { fetchPartsByFields } from '../api/parts.js';
import { buildSearchParams } from '../utils/searchUtils.js';

const searchByFields = async (chips) => {
  const searchParams = buildSearchParams(chips);
  
  try {
    const results = await fetchPartsByFields({
      searchParams,
      accessToken: userToken
    });
    return results.value;
  } catch (error) {
    console.error('Field search failed:', error);
    return [];
  }
};
```

### Creating New Parts
```javascript
import { postNewInventoryPart } from '../api/parts.js';

const createPart = async (partData) => {
  try {
    const newPart = await postNewInventoryPart(partData, userToken);
    return { success: true, part: newPart };
  } catch (error) {
    if (error.isDuplicate) {
      return { success: false, error: 'Part already exists' };
    }
    return { success: false, error: error.message };
  }
};
```

---

For backend API implementation details, see [Server README](../server/README.md).
