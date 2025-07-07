# Backend API Documentation

Node.js/Express backend server that provides RESTful API endpoints for the IMS Catalog Feature application. Handles authentication, data retrieval from IMS OData service, and advanced search functionality.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Access to IMS OData API endpoint
- Valid authentication credentials

### Installation
```bash
cd server
npm install
```

### Environment Variables
Create a `.env` file in the server directory:
```env
# IMS OData API Configuration
IMS_ODATA_URL=https://your-ims-endpoint/odata

# Development only - disable TLS verification
NODE_TLS_REJECT_UNAUTHORIZED=0

# Server Configuration (optional)
PORT=3001
```

### Start Server
```bash
npm start
# or
node index.js
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### Parts Management

#### GET `/api/parts`
Retrieve parts with advanced search and filtering capabilities.

**Query Parameters:**
- `search` (string): General keyword search with comma-separated terms
- `classification` (string): Filter by classification (default: 'Inventoried')
- `$top` (number): Limit number of results
- `filterType` (string): Search mode ('general' or 'specify')
- `[fieldName]` (string|array): Field-specific search parameters

**Field-Specific Parameters:**
- `m_inventory_description`: Part description
- `m_mfg_part_number`: Manufacturer part number
- `m_mfg_name`: Manufacturer name
- `m_parent_ref_path`: Parent reference path
- `m_custodian`: Custodian ID
- `m_custodian@aras.keyed_name`: Custodian display name
- `m_inventory_item`: Inventory item number
- `m_id`: Part ID
- `item_number`: Item number
- `m_maturity`: Maturity state
- `m_quantity`: Quantity

**Example Requests:**
```bash
# General search
GET /api/parts?search=rail,!power

# Field-specific search with multiple values
GET /api/parts?m_inventory_description=rail&m_inventory_description=right

# NOT logic
GET /api/parts?m_inventory_description=rail&m_inventory_description=!power

# Custodian search (client-side filtered)
GET /api/parts?m_custodian@aras.keyed_name=dave
```

**Response Format:**
```json
{
  "value": [
    {
      "id": "part_id",
      "m_inventory_description": "Part description",
      "m_mfg_part_number": "MFG123",
      "m_mfg_name": "Manufacturer Name",
      "m_quantity": 10,
      "total": 25,
      "inUse": 15,
      "spare": 10,
      "generalInventory": true,
      "_matches": {
        "m_inventory_description": ["rail"]
      }
    }
  ]
}
```

#### POST `/api/m_Inventory`
Create new inventory part (forwards to IMS OData API).

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Prefer: return=representation` (optional)

**Request Body:**
```json
{
  "item_number": "NEW123",
  "description": "New part description",
  "manufacturer": "MFG Corp"
}
```

#### PATCH `/api/m_Instance/:id/spare-value`
Update spare value for a specific part instance.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "spare_value": 5
}
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your_access_token>
```

## 🔍 Search Features

### General Search Mode
- Supports comma-separated keywords
- Includes/excludes terms with `!` or `-` prefix
- Searches across multiple fields simultaneously
- Returns highlighted matches

### Specify Search Mode
- Field-specific searches
- Multi-value support (OR logic for positive values)
- NOT logic support (AND logic for exclusions)
- Client-side filtering for special fields (containing `@`)

### Search Examples

**Multi-value OR search:**
```
m_inventory_description=rail&m_inventory_description=right
→ OData: (contains(m_inventory_description, 'rail') or contains(m_inventory_description, 'right'))
```

**NOT logic:**
```
m_inventory_description=rail&m_inventory_description=!power
→ OData: contains(m_inventory_description, 'rail') and not (contains(m_inventory_description, 'power'))
```

**Mixed positive and negative:**
```
m_inventory_description=rail&m_inventory_description=right&m_inventory_description=!power
→ OData: (contains(m_inventory_description, 'rail') or contains(m_inventory_description, 'right')) and not (contains(m_inventory_description, 'power'))
```

## 🏗️ Architecture

### Core Components

#### `buildFieldFilters(fieldParams)`
Converts field parameters into OData filter clauses.
- Handles arrays and single values
- Separates positive/negative filters
- Combines with appropriate logic (OR/AND)

#### `buildODataUrl(params)`
Constructs complete OData query URLs with:
- Base classification filtering
- Field-specific filters
- Select and expand clauses
- Result limiting

#### `groupAndProcessParts(parts)`
Groups parts by inventory item and calculates:
- Total quantities across all instances
- In-use vs spare quantities
- General inventory classification

#### `applySearchFilter(results, search)`
Backend search filtering with:
- Keyword parsing and classification
- Fast string-based filtering
- Match highlighting generation

#### `applyFieldHighlighting(results, fieldParams)`
Adds highlighting information for field-specific searches.

#### `applyClientSideFilters(results, fieldParams)`
Handles fields that can't be filtered in OData (containing `@`).

### Field Configuration
Centralized configuration in `FIELD_CONFIG`:
- **MAPPING**: Field name to OData field mapping
- **SELECT_FIELDS**: Fields to retrieve from OData
- **EXPAND_FIELDS**: Related entities to expand
- **SEARCH_FIELDS**: Fields included in general search

### Performance Optimizations
- OData query optimization
- Client-side result caching
- Efficient string matching algorithms
- Performance metrics logging

## 🔧 Development

### Project Structure
```
server/
├── index.js              # Main server file
├── parts.js              # Parts API routes and logic
├── identity.js           # Identity/auth endpoints
├── orders.js             # Order management
├── project.js            # Project-related endpoints
├── supplier.js           # Supplier management
├── userInfo.js           # User information
└── package.json          # Dependencies
```

### Adding New Endpoints
1. Create new route file or add to existing
2. Define route handlers with proper error handling
3. Add authentication middleware if required
4. Update this documentation

### Error Handling
All endpoints include comprehensive error handling:
- Input validation
- OData API error forwarding
- Structured error responses
- Detailed logging

### Testing
```bash
# Manual testing with curl
curl -H "Authorization: Bearer <token>" \
     "http://localhost:3001/api/parts?search=rail"

# Test field-specific search
curl -H "Authorization: Bearer <token>" \
     "http://localhost:3001/api/parts?m_inventory_description=rail&m_inventory_description=right"
```

## 📊 Performance Monitoring

The server logs performance metrics for each request:
```
--- Performance Metrics ---
OData fetch: 678ms
Grouping: 1ms
Search filtering: 15ms
Total: 891ms
```

### Optimization Tips
1. Use field-specific searches when possible
2. Limit results with `$top` parameter
3. Avoid overly broad general searches
4. Monitor OData fetch times

## 🐛 Troubleshooting

### Common Issues

**OData Connection Errors:**
- Verify `IMS_ODATA_URL` in environment
- Check network connectivity to IMS server
- Validate authentication tokens

**Search Not Working:**
- Check field mapping in `FIELD_CONFIG.MAPPING`
- Verify OData filter syntax in logs
- Test with simpler queries first

**Performance Issues:**
- Monitor fetch times in logs
- Consider adding result limits
- Check for complex filter combinations

**CORS Errors:**
- Ensure CORS is properly configured
- Check allowed origins in main server file

### Debug Mode
Set `NODE_ENV=development` for additional debug output.

### Logs
Server logs include:
- Request URLs and parameters
- OData filter generation
- Performance metrics
- Error details with stack traces

## 🔒 Security

### Authentication
- Bearer token validation on all endpoints
- Token forwarding to IMS OData API
- Proper error handling for invalid tokens

### Input Validation
- Query parameter sanitization
- SQL injection prevention through OData
- XSS prevention in responses

### HTTPS
Ensure HTTPS in production:
- Remove `NODE_TLS_REJECT_UNAUTHORIZED=0`
- Use proper SSL certificates
- Validate all external connections

## 📄 Dependencies

### Core Dependencies
- `express` (5.1.0) - Web framework
- `cors` (2.8.5) - Cross-origin resource sharing
- `dotenv` (16.5.0) - Environment variable loading
- `node-fetch` (2.6.7) - HTTP client for OData calls

### Utilities
- `form-data` (4.0.3) - Form data handling
- `uuid` (11.1.0) - Unique identifier generation

## 🚀 Deployment

### Production Checklist
1. Set proper environment variables
2. Remove development TLS settings
3. Configure proper CORS origins
4. Set up SSL certificates
5. Configure logging levels
6. Set up monitoring and alerts

### Environment Configuration
```env
# Production settings
NODE_ENV=production
IMS_ODATA_URL=https://production-ims-endpoint/odata
PORT=3001
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

For frontend documentation, see [Frontend README](../src/README.md).
