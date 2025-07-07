# updated on 7/7/2025

# IMS Catalog Feature - Inventory Management System

A modern, lightweight web application that simplifies inventory management by providing an intuitive interface for searching parts, checking availability, and managing procurement requests. Built with React frontend and Node.js backend, connecting securely to the IMS database.

## 🚀 Features

### Advanced Search & Filtering
- **Multi-mode search**: General keyword search and field-specific "Specify Search" mode
- **Multi-value queries**: Search for multiple values in the same field (OR logic)
- **NOT logic**: Exclude specific terms using `!` prefix (AND logic for exclusions)
- **Real-time highlighting**: Visual indication of search matches
- **Field-specific filtering**: Search by part number, description, manufacturer, custodian, etc.

### Inventory Management
- **Real-time availability**: Clear visibility into part quantities (total, in-use, spare)
- **Smart categorization**: Automatic classification of general inventory vs. project-specific parts
- **Quantity tracking**: Track spare values and update inventory counts
- **Multi-part operations**: Bulk actions and batch processing

### Procurement Integration
- **Automated request generation**: CSV export for procurement teams
- **New part handling**: Streamlined process for adding new parts to catalog
- **Request tracking**: Dashboard for managing submitted requests
- **Secure authentication**: Azure Managed Identity integration

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Modern UI library with hooks
- **Vite 6.3.5** - Fast build tool and dev server
- **JavaScript (ES6+)** - Modern JavaScript features
- **CSS Modules** - Scoped styling

### Backend
- **Node.js** - Server runtime
- **Express 5.1.0** - Web application framework
- **OData integration** - Direct connection to IMS database
- **CORS** - Cross-origin resource sharing

### Additional Libraries
- **PDF generation**: jsPDF, pdf-lib for document creation
- **Excel handling**: xlsx for spreadsheet operations
- **CSV processing**: papaparse for data parsing
- **Email integration**: nodemailer for notifications

## 📋 Prerequisites

- Node.js 18+ installed
- Access to IMS OData API
- Valid Azure authentication credentials

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd Catalog-feature

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Environment Setup
Create `.env` file in server directory:
```env
IMS_ODATA_URL=https://your-ims-odata-endpoint
NODE_TLS_REJECT_UNAUTHORIZED=0  # For development only
```

### 3. Start Development Servers
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start frontend dev server
cd ..
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure

```
Catalog-feature/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── api/               # API client functions
│   ├── utils/             # Utility functions
│   └── styles/            # CSS styling
├── server/                # Backend source code
│   ├── index.js           # Server entry point
│   ├── parts.js           # Parts API routes
│   └── *.js               # Additional API modules
├── public/                # Static assets
└── README.md              # This file
```

## 🔍 Advanced Search Guide

### General Search
```
search term, !excluded term, another term
```

### Specify Search Mode
- **Multi-value OR**: Add multiple chips for same field (e.g., "rail", "right" for description)
- **NOT logic**: Use `!` prefix to exclude (e.g., "!power" excludes power-related items)
- **Field targeting**: Search specific fields like part number, manufacturer, etc.

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm start` - Start server
- `node index.js` - Direct server start

### Adding New Features

1. **Frontend components**: Add to `src/components/`
2. **API endpoints**: Add to `server/` with appropriate route files
3. **Utilities**: Add to `src/utils/` for frontend helpers
4. **Styling**: Add to `src/styles/` following existing patterns

## 🔒 Security

- Azure Managed Identity for authentication
- Bearer token authorization for API calls
- CORS configuration for frontend-backend communication
- Input validation and sanitization

## 📊 Performance

- OData query optimization with field filtering
- Client-side result caching
- Efficient search algorithms with highlighting
- Performance metrics logging

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**: Ensure backend server is running on port 3001
2. **Authentication failures**: Check Azure credentials and token validity
3. **Search not working**: Verify OData endpoint configuration
4. **Build failures**: Ensure Node.js version 18+

### Debug Mode
Set `NODE_ENV=development` for additional logging and error details.

## 📝 API Documentation

See [Server README](server/README.md) for detailed API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues:
- Check the documentation in respective README files
- Review the troubleshooting section
- Contact the development team

---

Built with ❤️ for efficient inventory management
   - Create a structured request file detailing each item.
   - Share it with the Procurement team, who will handle generating a purchase order and fulfilling the request.
10. Database Write:
    - Insert the new preq (in form of the csv file) into the IMS database.
    - Update part quantities or insert new part records as needed.
11. Dashboard Interaction:
    - Display a list of all requests submitted by the logged-in user.
    - Show status indicators (e.g., pending, approved, fulfilled, canceled).
    - Allow users to cancel requests that have not yet been processed.
    - Show full transaction and request history.

## User Stories for the IMS Feature

- As a user, I want to log in securely using Azure Managed Identity so that I can access the platform without managing credentials.
- As a user, I want to search for parts by code, name, or category so that I can quickly find the hardware I need.
- As a user, I want to see whether a part is in stock or needs to be ordered so that I can make informed decisions.
- As a user, I want to add parts and quantities to a cart so that I can submit a request for multiple items at once.
- As a user, I want the system to automatically generate a structured request for the parts I selected so that I don’t have to manually fill out forms.
- As a user, I want the system to update inventory quantities or add new parts to the catalog as needed so that the IMS stays accurate.
- As a user, I want to be prompted to provide additional details when requesting a new part so that it can be properly added to the catalog.
- As a user, I want the system to notify the procurement team when a part is unavailable or new so that they can take the next steps.
- As a user, I want a CSV file to be generated summarizing my request so that it can be shared with procurement.
- As a user, I want to view a list of all the requests I’ve submitted so that I can track my activity.
- As a user, I want to see the status of each request (e.g., pending, approved, fulfilled, canceled) so that I know what’s happening.
- As a user, I want to cancel a request if it hasn’t been processed yet so that I can correct mistakes or change my mind.
- As a user, make sure that I cannot request items that are in spare and can only request items that have been listed as surplus.
- As an Administrator, make sure that I can adjust the surplus and spare thresholds for each item.
- As a user, I want to receive email notifications when the status of my request changes so that I stay informed.
- As a user, I want the ability to export the CSV file generated by the feature.

## Prep Work

Before development begins, the following must be completed:
- Confirm access to the IMS database (read/write).
- Understand the current procurement workflow and request lifecycle. (talk to Dave Artz)
- Identify required metadata for new part entries. (What specific data goes into the IMS catalog for each part? What do I have to request from the user.)
- Set up a secure development environment with Azure Managed Identity.

## Project Phases

### Tech Stack

- **Frontend**: React
- **Backend**: Node.js
- **Database**: Azure SQL server, hosting my own database
- **Auth**: Azure Managed Identity
- **Hosting**: Azure App services

### Target Completion: May 23rd

1. Define project goals and success criteria
2. Identify key stakeholders (e.g., procurement, engineering leads, IMS admins)
3. Finalize and review the project charter
4. Outline initial technical requirements and constraints
5. Duration: 1 week (starting May 24th)
6. Create a working MVP with some basic core functions.
7. Get feedback from team members if this feature is heading in the right direction
8. Secure access to IMS database and development tools
9. Establish a communication and feedback plan
10. Build foundational components and set up development environment
11. Duration: Remainder of Internship
12. Design UI wireframes and system architecture diagrams
13. Develop core features: part search, request submission, dashboard
14. Conduct iterative testing with sample data and gather feedback
15. Refine based on feedback and prepare for handoff or deployment

## Architecture Design

- **Platform**: IMS is built on the Aras Innovator platform.
- **Database**: Microsoft SQL Server (2012–2019) is used as the backend.
- **Hosting**: Typically deployed on Windows Server with IIS and .NET Core hosting bundles.

### Interaction

- **Read operations**: Retrieve part metadata, availability, and request history.
- **Write operations**:
  - Update inventory quantities.
  - Insert new part records.
  - Insert and update purchase request records (including cancellation status).

## Security Information

- **Authentication**: Azure Managed Identity is used for secure access.
  - **Benefits**:
    - No credentials are stored or exposed.
    - Access is governed by Azure RBAC.
    - Ensures secure, credential-free access.
  - **Compliance**: Aligns with Microsoft’s enterprise security standards and best practices.

## How the Feature Interacts with IMS

- **Read Access**:
  - Pull part data (e.g., codes, descriptions, availability) from the IMS SQL Server.
  - Retrieve request history and status for the logged-in user.
- **Write Access**:
  - Update inventory quantities when parts are reserved.
  - Insert new parts into the catalog when needed.
  - Insert and update purchase request records in the IMS database.
- **Security**:
  - All interactions are secured using Azure Managed Identity.
  - Role-based permissions ensure only authorized operations are performed.

## Stretch Goals and Future Enhancements

- Create part suggestions if nothing is available or only parts are in the spare category.
- Take care of PO generation as well.
