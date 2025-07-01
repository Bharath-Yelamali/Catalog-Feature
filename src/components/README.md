# Components Documentation

React component library for the IMS Catalog Feature application. Modern, responsive components built with React hooks and CSS modules.

## 🧩 Component Architecture

### Design Principles
- **Modularity**: Single responsibility components
- **Reusability**: Configurable and composable
- **Accessibility**: ARIA compliance and keyboard navigation
- **Responsiveness**: Mobile-first design approach
- **Performance**: Optimized rendering and memory usage

### File Structure
```
components/
├── HomePage.jsx              # Main application page
├── LoginPage.jsx             # Authentication interface
├── SearchBar.jsx             # Advanced search component
├── PartsTable.jsx            # Results display with highlighting
├── OrdersPage.jsx            # Order management interface
├── ConfirmationSummary.jsx   # Order confirmation
└── RequiredFields.jsx        # New part creation form
```

## 🏠 Core Components

### HomePage.jsx
**Main application container and orchestrator**

```jsx
import HomePage from './components/HomePage.jsx';

<HomePage />
```

**Features:**
- Authentication state management
- Search and results coordination
- Navigation control
- Error boundary implementation
- Loading state handling

**State Management:**
```jsx
const [user, setUser] = useState(null);
const [searchResults, setSearchResults] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**Key Methods:**
- `handleSearch(params)` - Coordinates search operations
- `handleLogin(credentials)` - Manages user authentication
- `handleLogout()` - Clears user session
- `handleError(error)` - Centralized error handling

### LoginPage.jsx
**User authentication interface**

```jsx
import LoginPage from './components/LoginPage.jsx';

<LoginPage 
  onLogin={handleLogin}
  loading={loading}
  error={error}
/>
```

**Props:**
- `onLogin(credentials)` - Login callback function
- `loading` - Loading state indicator
- `error` - Error message display

**Features:**
- Form validation
- Secure credential handling
- Auto-focus on load
- Enter key submission
- Loading and error states

**Usage Example:**
```jsx
const handleLogin = async (credentials) => {
  try {
    const user = await authenticateUser(credentials);
    setUser(user);
  } catch (error) {
    setError(error.message);
  }
};

<LoginPage onLogin={handleLogin} error={loginError} />
```

### SearchBar.jsx
**Advanced search interface with dual modes**

```jsx
import SearchBar from './components/SearchBar.jsx';

<SearchBar
  onSearch={handleSearch}
  onReset={handleReset}
  onModeChange={handleModeChange}
  searchMode="specify"
  loading={loading}
/>
```

**Props:**
- `onSearch(params)` - Search execution callback
- `onReset()` - Reset search state
- `onModeChange(mode)` - Switch between search modes
- `searchMode` - Current search mode ('general' | 'specify')
- `loading` - Search in progress indicator

**Search Modes:**

#### General Search Mode
- Free-text keyword input
- Comma-separated terms support
- Include/exclude logic with `!` prefix
- Search across multiple fields

```jsx
// Example: "rail, bearing, !power"
// Searches for parts containing "rail" OR "bearing" but NOT "power"
```

#### Specify Search Mode
- Field-specific search interface
- Visual chip-based input system
- Multi-value support per field
- Advanced filtering options

**Chip Interface:**
```jsx
// Add chip
const addChip = (field, value) => {
  setChips([...chips, { id: generateId(), field, value }]);
};

// Remove chip
const removeChip = (chipId) => {
  setChips(chips.filter(chip => chip.id !== chipId));
};
```

**Available Fields:**
- `m_inventory_description` - Part description
- `m_mfg_part_number` - Manufacturer part number
- `m_mfg_name` - Manufacturer name
- `m_parent_ref_path` - Parent reference
- `m_custodian` - Custodian ID
- `m_custodian@aras.keyed_name` - Custodian name
- `m_inventory_item` - Inventory item number
- `m_id` - Part ID
- `item_number` - Item number
- `m_maturity` - Maturity state
- `m_quantity` - Quantity

### PartsTable.jsx
**Results display with advanced highlighting and interaction**

```jsx
import PartsTable from './components/PartsTable.jsx';

<PartsTable
  parts={searchResults}
  loading={loading}
  onSort={handleSort}
  onUpdateSpare={handleSpareUpdate}
  searchMode={searchMode}
/>
```

**Props:**
- `parts` - Array of part objects to display
- `loading` - Loading state for search operations
- `onSort(column, direction)` - Sort callback
- `onUpdateSpare(partId, value)` - Spare value update
- `searchMode` - Current search mode for highlighting

**Features:**

#### Advanced Highlighting
- **General search**: Highlights matching keywords across fields
- **Specify search**: Highlights field-specific matches
- **NOT logic**: Visual indication of excluded terms
- **Multi-color highlighting**: Different colors for different matches

```jsx
// Highlighting implementation
const renderHighlightedText = (text, matches) => {
  if (!matches || matches.length === 0) return text;
  
  let highlightedText = text;
  matches.forEach((match, index) => {
    const regex = new RegExp(`(${escapeRegex(match)})`, 'gi');
    const className = `highlight-${index % 3}`;
    highlightedText = highlightedText.replace(regex, 
      `<span class="${className}">$1</span>`
    );
  });
  
  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
};
```

#### Interactive Features
- **Sortable columns**: Click column headers to sort
- **Inline editing**: Edit spare values directly in table
- **Responsive design**: Horizontal scroll on mobile
- **Row selection**: Select multiple parts for bulk operations

#### Data Display
- **Quantity breakdown**: Total, in-use, spare quantities
- **Status indicators**: Visual status for different part states
- **Rich data formatting**: Proper formatting for numbers, dates, etc.

### OrdersPage.jsx
**Order management and tracking interface**

```jsx
import OrdersPage from './components/OrdersPage.jsx';

<OrdersPage
  user={currentUser}
  onOrderUpdate={handleOrderUpdate}
/>
```

**Features:**
- Order history display
- Status tracking and updates
- Order details expansion
- Bulk operations support
- Search and filtering within orders

**Order States:**
- `pending` - Awaiting processing
- `approved` - Approved for procurement
- `ordered` - Sent to supplier
- `received` - Parts received
- `cancelled` - Order cancelled

### ConfirmationSummary.jsx
**Order confirmation and review interface**

```jsx
import ConfirmationSummary from './components/ConfirmationSummary.jsx';

<ConfirmationSummary
  selectedParts={selectedParts}
  onConfirm={handleOrderConfirm}
  onCancel={handleOrderCancel}
  onEdit={handleOrderEdit}
/>
```

**Features:**
- Comprehensive order review
- Part list validation
- Quantity confirmation
- Cost estimation (if available)
- Edit capabilities before submission

### RequiredFields.jsx
**New part creation form with dynamic validation**

```jsx
import RequiredFields from './components/RequiredFields.jsx';

<RequiredFields
  onSubmit={handleNewPart}
  onCancel={handleCancel}
  initialData={partData}
/>
```

**Features:**
- Dynamic form field generation
- Real-time validation
- Required field highlighting
- Format validation (numbers, dates, etc.)
- Auto-save functionality

**Validation Rules:**
```jsx
const validationRules = {
  item_number: { required: true, pattern: /^[A-Z0-9-]+$/ },
  description: { required: true, minLength: 10 },
  manufacturer: { required: true },
  quantity: { required: true, type: 'number', min: 0 }
};
```

## 🎨 Styling Architecture

### CSS Module System
Each component has an associated CSS file in the `styles/` directory:

```
styles/
├── home.css              # HomePage styles
├── login.css             # LoginPage styles
├── search.css            # SearchBar styles
├── partstable.css        # PartsTable styles
├── orders.css            # OrdersPage styles
├── confirmationsummary.css  # ConfirmationSummary styles
├── requiredfields.css    # RequiredFields styles
├── common.css            # Shared component styles
└── utilities.css         # Utility classes
```

### Design System

#### Color Palette
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
}
```

#### Typography
```css
:root {
  --font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

#### Spacing Scale
```css
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-xxl: 3rem;
}
```

### Responsive Breakpoints
```css
/* Mobile first approach */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large desktop */ }
```

## 🔧 Component Development

### Creating New Components

1. **Create component file:**
```jsx
// components/MyComponent.jsx
import React, { useState } from 'react';
import '../styles/mycomponent.css';

const MyComponent = ({ prop1, prop2, onAction }) => {
  const [state, setState] = useState(null);

  const handleAction = () => {
    // Component logic
    onAction(state);
  };

  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

2. **Create corresponding CSS:**
```css
/* styles/mycomponent.css */
.my-component {
  /* Component styles */
}
```

3. **Add to main component:**
```jsx
import MyComponent from './components/MyComponent.jsx';

<MyComponent 
  prop1={value1}
  prop2={value2}
  onAction={handleAction}
/>
```

### Component Guidelines

#### Props Interface
- Use TypeScript-style prop documentation
- Provide default values where appropriate
- Include callback function signatures

```jsx
/**
 * MyComponent - Description of component
 * 
 * @param {string} title - Component title
 * @param {Array} items - Array of items to display
 * @param {Function} onSelect - Callback when item selected (item) => void
 * @param {boolean} loading - Loading state indicator
 * @param {Object} style - Additional styles
 */
```

#### State Management
- Use hooks for local state
- Lift state up when needed by multiple components
- Consider useReducer for complex state logic

#### Error Handling
- Implement error boundaries
- Graceful fallbacks for missing data
- User-friendly error messages

```jsx
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className="error-fallback">Something went wrong.</div>;
  }

  return children;
};
```

## 🚀 Performance Optimization

### React Optimization
```jsx
// Memoization for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props.data);
}, [props.data]);

// Callback memoization
const handleClick = useCallback((id) => {
  onItemClick(id);
}, [onItemClick]);

// Component memoization
const MemoizedComponent = React.memo(MyComponent);
```

### Rendering Optimization
- Use key props for list items
- Avoid inline object creation in render
- Minimize component re-renders

### Bundle Optimization
- Lazy load large components
- Code splitting for route-based chunks
- Tree shaking for unused code

## 🧪 Testing

### Component Testing
```jsx
// Test structure example
describe('SearchBar Component', () => {
  test('renders with default props', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('calls onSearch when submitted', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(screen.getByRole('form'));
    
    expect(mockOnSearch).toHaveBeenCalledWith({ search: 'test' });
  });
});
```

### Testing Checklist
- [ ] Component renders without crashing
- [ ] Props are handled correctly
- [ ] Event handlers are called appropriately
- [ ] Loading and error states work
- [ ] Responsive design functions properly
- [ ] Accessibility features work

## ♿ Accessibility

### ARIA Implementation
- Proper semantic HTML elements
- ARIA labels and descriptions
- Focus management
- Keyboard navigation support

```jsx
<button
  aria-label="Search parts"
  aria-describedby="search-help"
  onClick={handleSearch}
>
  Search
</button>
<div id="search-help" className="sr-only">
  Enter keywords to search for parts
</div>
```

### Keyboard Navigation
- Tab order management
- Enter key activation
- Escape key cancellation
- Arrow key navigation for lists

---

For styling guidelines and utilities, see individual CSS files in the `styles/` directory.
