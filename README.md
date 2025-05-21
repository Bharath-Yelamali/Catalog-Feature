
# IMS Feature Development

## Problem Statement

The current IMS (Inventory Management System) is overloaded with features that are rarely used, making it difficult for new users to navigate. It presents a steep learning curve, includes excessive and often irrelevant information, and lacks clear visibility into part availability. Additionally, the process of creating purchase requests is manual and disconnected from the database, leading to inefficiencies and potential errors. Users also have no centralized way to track the status of their requests or manage them post-submission.

## Overall Goal

To design and build a lightweight, intuitive web-based platform that:
- Connects securely to the IMS database.
- Allows engineers to easily search for and select hardware parts.
- Clearly displays part availability.
- Automatically generates and stores purchase requests (preqs) in the IMS database.
- Preq is in the form of a generated csv file (or any file type) that can automatically be sent to procurement.
- Updates inventory quantities and add new parts to the IMS catalog as needed.
- Provides a dashboard for users to view, track, and manage their submitted requests.

## Functional Summary

- **Part Search**: Search by part code, name, or category from IMS.
- **Availability Check**: Clearly indicate whether a part is in stock or needs to be ordered.
- **Selection Cart**: Add parts and specify quantities.
- **CSV Export**: Generate a structured request file summarizing each item.
- **Database Write**: Update part quantities, add new parts, and store purchase requests in IMS.
- **Secure Access**: Use Azure Managed Identity for authentication and secure database access.
- **Request Dashboard**: View all submitted requests, check their status, and cancel if needed.

## Design Flow

1. User logs in via Azure Managed Identity.
2. Searches for parts by code, name, or category.
3. Views availability status for each part.
4. Selects parts and quantities to add to a cart.
5. A part can be:
   - **In use**: You cannot request hardware items that are in use.
   - **In spare**: You cannot request hardware items that are in spare.
   - **In surplus**: You can only reserve hardware items that are in surplus.
6. If the part is available:
   - Reserve the requested quantity.
   - Update the available inventory count in IMS.
   - Log the reservation as a transaction.
7. If the part is unavailable:
   - Notify the Procurement team to initiate the purchase.
   - Update the IMS catalog to reflect the pending order.
8. If the part is new (not in the catalog):
   - Take the user to a new page after selecting all the parts that they want asking to list out specific data about this new part.
   - Add the new part to the IMS catalog.
   - Notify the Procurement team to initiate the purchase.
9. CSV Generation:
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
