# Frontend Documentation

Modern React-based frontend for the IMS Catalog Feature application. Provides an intuitive interface for inventory search, part management, and procurement request handling.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend server running on port 3001

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Application will be available at `http://localhost:5173`

### Build
```bash
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🏗️ Architecture

### Technology Stack
- **React 19.1.0** - UI library with modern hooks
- **Vite 6.3.5** - Build tool and dev server
- **JavaScript (ES6+)** - Modern JavaScript features
- **CSS Modules** - Component-scoped styling

### Project Structure
```
src/
├── components/           # React components
│   ├── HomePage.jsx     # Main application page
│   ├── LoginPage.jsx    # Authentication page
│   ├── SearchBar.jsx    # Advanced search interface
│   ├── PartsTable.jsx   # Results display with highlighting
│   ├── OrdersPage.jsx   # Order management
│   ├── ConfirmationSummary.jsx  # Request confirmation
│   └── RequiredFields.jsx       # New part form
├── api/                 # API client functions
│   ├── parts.js         # Parts API calls
│   ├── orders.js        # Orders API calls
│   ├── identity.js      # Authentication
│   ├── project.js       # Project management
│   ├── supplier.js      # Supplier management
│   └── userInfo.js      # User information
├── utils/               # Utility functions
│   └── searchUtils.js   # Search parameter handling
├── styles/              # CSS styling
│   ├── App-header-fix.css
│   ├── common.css       # Shared styles
│   ├── global.css       # Global styles
│   ├── home.css         # Home page styles
│   ├── login.css        # Login page styles
│   ├── navigation.css   # Navigation styles
│   ├── orders.css       # Orders page styles
│   ├── partstable.css   # Parts table styles
│   ├── search.css       # Search interface styles
│   └── utilities.css    # Utility classes
├── assets/              # Static assets
│   └── react.svg
├── App.jsx             # Main app component
├── main.jsx            # Application entry point
└── index.css           # Base styles
```

## 🔍 Components Overview

### Core Components

#### `HomePage.jsx`
Main application interface that orchestrates:
- Search functionality
- Results display
- User authentication state
- Navigation between views

**Key Features:**
- Integrated search bar and results table
- Authentication state management
- Responsive design
- Error handling and loading states

#### `SearchBar.jsx`
Advanced search interface supporting:
- **General Search Mode**: Keyword-based search with include/exclude logic
- **Specify Search Mode**: Field-specific search with chips interface

**Features:**
- Dynamic field selection dropdown
- Search chip management (add, remove, edit)
- Multi-value support for same field
- NOT logic with `!` prefix
- Real-time validation
- Search history

**Usage Example:**
```jsx
<SearchBar
  onSearch={handleSearch}
  onReset={handleReset}
  onModeChange={handleModeChange}
  searchMode="specify"
/>
```

#### `PartsTable.jsx`
Displays search results with:
- **Advanced highlighting**: Visual indication of search matches
- **Sorting capabilities**: Multi-column sorting
- **Quantity management**: Spare value editing
- **Responsive design**: Mobile-friendly layout

**Highlighting Features:**
- Keyword highlighting in general search
- Field-specific highlighting in specify search
- NOT logic visual indication
- Multiple highlight colors

#### `LoginPage.jsx`
Authentication interface with:
- User credential input
- Authentication state management
- Error handling
- Redirect after successful login

#### `OrdersPage.jsx`
Order management interface providing:
- Order history display
- Status tracking
- Order details view
- Bulk operations

#### `ConfirmationSummary.jsx`
Request confirmation interface for:
- Order review before submission
- Part list validation
- Quantity confirmation
- Submission handling

#### `RequiredFields.jsx`
New part creation form with:
- Dynamic field validation
- Required field highlighting
- Data format validation
- Integration with parts API

### Utility Components

#### Search Utilities (`utils/searchUtils.js`)

**`buildSearchParams(chips)`**
Transforms search chips into API parameters:
```javascript
// Input: chips array
[
  { field: 'm_inventory_description', value: 'rail' },
  { field: 'm_inventory_description', value: 'right' },
  { field: 'm_mfg_name', value: '!power' }
]

// Output: grouped parameters
{
  'm_inventory_description': ['rail', 'right'],
  'm_mfg_name': '!power'
}
```

**`validateSearchFields(chips)`**
Validates search input:
- Required field checking
- Value format validation
- Error message generation

## 🔧 API Integration

### API Client Functions

#### Parts API (`api/parts.js`)

**`fetchParts(options)`**
General search functionality:
```javascript
const results = await fetchParts({
  search: 'rail, !power',
  classification: 'Inventoried',
  accessToken: token
});
```

**`fetchPartsByFields(options)`**
Field-specific search:
```javascript
const results = await fetchPartsByFields({
  searchParams: {
    'm_inventory_description': ['rail', 'right'],
    'm_mfg_name': '!power'
  },
  accessToken: token
});
```

**`updateSpareValue(instanceId, value, token)`**
Update part quantities:
```javascript
await updateSpareValue('part-id-123', 10, token);
```

#### Authentication (`api/identity.js`)
Handles user authentication and token management.

#### Orders API (`api/orders.js`)
Manages order creation, retrieval, and updates.

### Error Handling
All API calls include comprehensive error handling:
- Network error detection
- HTTP status code handling
- User-friendly error messages
- Retry logic for transient failures

## 🎨 Styling Architecture

### CSS Organization
- **Global styles**: Base typography, colors, layout
- **Component styles**: Component-specific styling
- **Utility classes**: Reusable utility classes
- **Responsive design**: Mobile-first approach

### Design System
- **Colors**: Consistent color palette
- **Typography**: Standardized font sizes and weights
- **Spacing**: Consistent margin and padding scale
- **Components**: Reusable UI components

### Key Style Files

**`global.css`**
- CSS variables for colors and spacing
- Base typography and layout
- Responsive breakpoints

**`common.css`**
- Shared component styles
- Button and form styles
- Layout utilities

**`search.css`**
- Search bar styling
- Chip interface design
- Dropdown menus

**`partstable.css`**
- Table layout and styling
- Highlighting styles
- Responsive table design

## 🔍 Search Implementation

### Search Modes

#### General Search
- Free-text keyword search
- Comma-separated terms
- Include/exclude logic with `!` prefix
- Searches across multiple fields

#### Specify Search
- Field-specific search interface
- Visual chip-based input
- Multi-value support per field
- Advanced filtering options

### Search Flow
1. User inputs search criteria
2. `buildSearchParams` processes chips into API format
3. Appropriate API function called based on search mode
4. Results processed and highlighted
5. Table updated with new results

### Highlighting Logic
The frontend receives highlighting information from the backend in the `_matches` property and applies visual styling to matching terms.

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Collapsible search interface
- Responsive table with horizontal scroll
- Touch-friendly button sizing
- Optimized chip interface

## 🧪 Development Workflow

### Component Development
1. Create component in `src/components/`
2. Add corresponding CSS file in `src/styles/`
3. Export from component file
4. Import and use in parent components

### API Integration
1. Add API function to appropriate file in `src/api/`
2. Implement error handling
3. Add loading states in components
4. Test with various scenarios

### Styling Guidelines
1. Use CSS modules for component-specific styles
2. Follow BEM naming convention
3. Use CSS variables for consistent theming
4. Implement mobile-first responsive design

## 🐛 Debugging

### Development Tools
- React Developer Tools browser extension
- Vite dev server hot reload
- Browser developer tools
- Network tab for API debugging

### Common Issues

**Search not working:**
- Check API endpoint configuration
- Verify search parameter format
- Check browser network tab for errors

**Styling issues:**
- Verify CSS imports
- Check for conflicting styles
- Validate responsive breakpoints

**Authentication problems:**
- Check token storage and retrieval
- Verify API endpoint authentication
- Check browser localStorage

### Debug Logging
Enable detailed logging by setting localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

## 🚀 Performance Optimization

### Best Practices
- Component memoization with `React.memo`
- Lazy loading for large components
- Debounced search input
- Efficient re-rendering strategies

### Bundle Optimization
- Tree shaking for unused code
- Code splitting for large dependencies
- Asset optimization
- Gzip compression

## 📦 Build and Deployment

### Production Build
```bash
npm run build
```
Creates optimized build in `dist/` directory.

### Environment Configuration
Create `.env` file for environment-specific settings:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=IMS Catalog Feature
```

### Deployment Considerations
- Configure proper base URL for production
- Set up HTTPS for secure authentication
- Configure CORS for API access
- Implement proper error boundaries

## 🔒 Security

### Authentication
- Secure token storage
- Automatic token refresh
- Logout functionality
- Session timeout handling

### Data Protection
- Input sanitization
- XSS prevention
- Secure API communication
- Proper error handling

## 🧪 Testing

### Manual Testing
- Test all search modes
- Verify highlighting functionality
- Check responsive design
- Test authentication flow

### Testing Checklist
- [ ] General search with keywords
- [ ] Specify search with multiple fields
- [ ] NOT logic functionality
- [ ] Multi-value field searches
- [ ] Table sorting and filtering
- [ ] Mobile responsive design
- [ ] Authentication flow
- [ ] Error handling

---

For backend API documentation, see [Server README](../server/README.md).
