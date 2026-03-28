# PIM Studio - Kilowott Hackathon

A modern Product Information Management (PIM) system built with React frontend and Node.js backend.

## Features

- **Dashboard**: Overview with metrics, activity feed, and category breakdown
- **Products Management**: Full CRUD operations with advanced filtering, sorting, and bulk actions
- **Store Preview**: Live view of active products as they appear in the store
- **Sync Log**: Track all data synchronization activities
- **Attributes Registry**: View and analyze product attributes usage
- **Import/Export**: JSON and CSV support for data migration
- **Dark Theme**: Modern dark UI with responsive design
- **AI Integration**: Smart suggestions for product attributes and descriptions

## Tech Stack

- **Frontend**: React 18, React Router, Axios, Vite
- **Backend**: Node.js, Express, SQLite
- **Styling**: CSS3 with CSS Variables, Flexbox, Grid

## Getting Started

### Prerequisites

- Node.js 16+
- npm

### Installation

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend will run on http://localhost:3001

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on http://localhost:5173

### Usage

1. Open http://localhost:5173 in your browser
2. The application comes with seed data for demonstration
3. Navigate through different sections using the sidebar
4. Add, edit, or delete products
5. Use bulk actions for multiple products
6. Export/import data as needed

## API Endpoints

- `GET /api/products` - Get all products with optional filtering
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `DELETE /api/products` - Bulk delete products
- `PUT /api/products/bulk/status` - Bulk update status
- `POST /api/products/bulk/sync` - Bulk sync products
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/sync-log` - Sync activity log
- `GET /api/attributes` - Attribute analysis

## Data Storage

The application uses SQLite for data persistence. The database file `pim.db` is created automatically in the backend directory.

## Development

- Frontend hot reload with Vite
- Backend restart required for changes
- CORS enabled for development

## Production Deployment

For production deployment:

1. Build the frontend: `cd frontend && npm run build`
2. Serve the built files from the backend or a web server
3. Update API URLs in the frontend to point to your deployed backend
4. Configure environment variables for production database

## License

This project is part of the Kilowott Hackathon.