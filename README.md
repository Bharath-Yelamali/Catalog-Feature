# IMS Catalog Feature

A modern web application for inventory management and procurement, designed for organizations using the IMS database. It streamlines part search, inventory tracking, and request submission, with secure authentication and a user-friendly dashboard.

Empowering the lab engineering team at Chess, this platform makes it easy to search, add parts, and create procurement requests (preqs) with speed and accuracy. The site provides a streamlined interface for all inventory and procurement needs, leveraging AI to enhance search, automate workflows, and simplify complex operations.

## 🚀 Features
- Advanced part search and filtering
- Real-time inventory visibility
- Bulk operations and batch processing
- Automated procurement request generation (CSV export)
- Dashboard for request tracking and status
- Secure login via Azure Managed Identity

## 🛠️ Technology Stack
- **Frontend:** React, Vite, JavaScript (ES6+), CSS Modules
- **Backend:** Node.js (18+), Express, OData integration, CORS
- **Database:** Azure SQL Server
- **Additional Libraries:** jsPDF, pdf-lib, xlsx, papaparse, nodemailer

## 📋 Prerequisites
- Node.js 18+ installed
- Access to IMS OData API and Azure SQL Server
- Valid Azure authentication credentials

## 🚀 Quick Start
```bash
git clone <repository-url>
cd Catalog-feature

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
IMS_ODATA_URL=https://your-ims-odata-endpoint
NODE_TLS_REJECT_UNAUTHORIZED=0  # For development only
```

Start development servers:
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start frontend dev server
cd ..
npm run dev
```

Access the app:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure
```
Catalog-feature/
├── src/            # Frontend source code
│   ├── components/ # React components
│   ├── api/        # API client functions
│   ├── utils/      # Utility functions
│   └── styles/     # CSS styling
├── server/         # Backend source code
│   ├── index.js    # Server entry point
│   ├── parts.js    # Parts API routes
│   └── *.js        # Additional API modules
├── public/         # Static assets
└── README.md       # This file
```

## 🧑‍💻 Development
- Add frontend components to `src/components/`
- Add backend API endpoints to `server/`
- Add utilities to `src/utils/`
- Add styles to `src/styles/`

### Scripts
- `npm run dev` - Start frontend dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm start` (in `server/`) - Start backend server

## 🔒 Security
- Azure Managed Identity authentication
- Role-based authorization
- CORS configuration
- Input validation and sanitization

## 🐛 Troubleshooting
- CORS errors: Ensure backend is running on port 3001
- Authentication failures: Check Azure credentials
- Search issues: Verify OData endpoint configuration
- Build failures: Ensure Node.js version 18+

## 📝 API Documentation
See `server/README.md` for backend API details.

## 📄 License
MIT License

## 📞 Support
- Check documentation in README files
- Review troubleshooting section
- Contact the development team
