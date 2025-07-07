# Catalog Feature Server API

This folder contains the Express.js backend API for the Catalog feature. It acts as a secure bridge between the frontend and the IMS OData backend, handling authentication, data transformation, and business logic for inventory, orders, projects, suppliers, and user management.

---

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Configure environment variables:**
   Create a `.env` file in this folder with the following keys:
   ```env
   TOKEN_URL=...                # OAuth token endpoint
   DATABASE=...                 # Database name
   CLIENT_ID=...                # OAuth client ID
   SCOPE=...                    # OAuth scope
   USERNAME=...                 # Aras username
   PASSWORD=...                 # Aras password
   IMS_BASE_URL=...             # IMS OData API base URL (e.g. https://.../Server/odata/)
   IMS_ODATA_URL=...            # (Optional) Alternate OData base URL
   ```
3. **Start the server:**
   ```sh
   node <your entry file, e.g. index.js>
   ```

---

## Environment Variables

- `IMS_BASE_URL` (required): Base URL for the IMS OData API (used by most routes)
- `IMS_ODATA_URL` (optional): Alternate OData base URL (used by some routes)
- `TOKEN_URL`, `CLIENT_ID`, `SCOPE`, `USERNAME`, `PASSWORD`: Used for authentication with the IMS backend

---

## Route Files and Endpoints

### `parts.js`
- **Endpoints:**
  - `GET /parts` — List, search, and group inventory parts. Supports advanced filtering, search, and result highlighting.
  - `POST /m_Inventory` — Create a new inventory item part.
  - `PATCH /m_Instance/:id/spare-value` — Update the `spare_value` for a specific inventory instance.
- **Notes:** Requires Bearer token. Handles OData query construction and result transformation.

### `orders.js`
- **Endpoints:**
  - `GET /orders` — List and search procurement orders with advanced filtering and search.
  - `POST /m_Procurement_Request` — Create a new procurement request (order), supports file attachments.
  - `POST /m_Procurement_Request_Files` — Upload a file for a procurement request.
  - `GET /workflow-processes` — Fetch workflow process info for an order item.
  - `GET /workflow-process-activities` — Fetch workflow process activities for a workflow process.
- **Notes:** Uses Multer for in-memory file uploads. Requires Bearer token. Handles OData deep inserts and file encoding.

### `project.js`
- **Endpoints:**
  - `GET /projects` — Fetch all projects (id, name) for use in dropdowns and project selection.
- **Notes:** Requires Bearer token. Maps OData results to a simplified project list.

### `supplier.js`
- **Endpoints:**
  - `GET /suppliers` — Fetch all suppliers (id, name) for use in supplier selection.
- **Notes:** Requires Bearer token. Maps OData results to a simplified supplier list.

### `userInfo.js`
- **Endpoints:**
  - `GET /user-info?username=USERNAME` — Fetch a user's first and last name by username.
- **Notes:** Requires Bearer token. Looks up user info in the IMS backend.

### `identity.js`
- **Endpoints:**
  - `GET /identities` — Fetch all members of the "Administrators" group (expanded user/member info).
  - `GET /all-identities` — Fetch all user identities (id, alias, name) for user management and dropdowns.
- **Notes:** Requires Bearer token. Handles multi-step OData queries and result mapping.

### `_upload.js`
- **Exports:**
  - `router` — Express router for upload-related endpoints (if defined)
  - `upload` — Multer middleware for in-memory file uploads
- **Notes:** Used as a utility for file upload handling in other route files.

---

## Security
- **All endpoints require a valid Bearer token in the Authorization header.**
- **No credentials are hardcoded in the codebase.**
- **Environment variables should never be committed to version control.**

---

## Extending
- Add new route files for additional domains as needed.
- Use environment variables for all configuration and secrets.
- Follow the commenting and documentation style used in existing files for maintainability.
