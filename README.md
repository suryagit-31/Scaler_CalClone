# Cal.com Clone - Scheduling Platform

A full-stack scheduling platform built with PERN stack (PostgreSQL, Express, React, Node).

## Features

- **Event Types Management**: Create, edit, and delete event types with custom durations
- **Availability Settings**: Configure working hours by day of week
- **Public Booking**: Calendar-based booking interface with time slot selection
- **Bookings Dashboard**: View, filter, and manage bookings (Upcoming, Past, Canceled)
- **Admin Dashboard**: Clean, minimalist UI matching Cal.com's light mode design

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, DayJS, Axios, React Calendar
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (using pg library)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### Database Setup

#### Option 1: Neon PostgreSQL (Cloud)

1. Get your Neon connection string from your Neon dashboard

2. Run the schema:

```bash
psql 'YOUR_CONNECTION_STRING_HERE' -f server/database.sql
```

3. Run the seed data:

```bash
psql 'YOUR_CONNECTION_STRING_HERE' -f server/seed.sql
```

#### Option 2: Local PostgreSQL

1. Create a PostgreSQL database:

```sql
CREATE DATABASE cal_clone;
```

2. Run the schema:

```bash
psql -U postgres -d cal_clone -f server/database.sql
```

3. Run the seed data:

```bash
psql -U postgres -d cal_clone -f server/seed.sql
```

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `server` directory:

**Option 1: Using Connection String (Recommended for Neon/Cloud):**

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PORT=5000
```

**Option 2: Using Individual Parameters (For Neon PostgreSQL):**

```env
DB_USER=your_username
DB_HOST=your_host.neon.tech
DB_NAME=your_database
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=true
PORT=5000
```

**Option 3: For Local PostgreSQL:**

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cal_clone
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=false
PORT=5000
```

**Note:** If `DATABASE_URL` is set, it will be used instead of individual parameters.

4. Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

**For Production/Deployment:**

```env
VITE_API_URL=https://scaler-calclone.onrender.com
```

**For Local Development (optional):**

```env
VITE_API_URL=http://localhost:5000
```

**Note:** If `VITE_API_URL` is not set, the app will use relative paths which work with Vite's proxy in development (localhost:5000).

4. Start the development server:

```bash
npm run dev
```

The client will run on `http://localhost:3000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── db.js              # Database connection
│   ├── database.sql       # Database schema
│   ├── seed.sql           # Seed data
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/event-types` - List all event types
- `GET /api/event-types/:id` - Get event type by ID
- `GET /api/event-types/slug/:slug` - Get event type by slug (public)
- `POST /api/event-types` - Create event type
- `PUT /api/event-types/:id` - Update event type
- `DELETE /api/event-types/:id` - Delete event type
- `GET /api/availability` - Get availability settings
- `PUT /api/availability` - Update availability (bulk)
- `GET /api/slots?eventTypeId=:id&date=:date` - Get available time slots
- `POST /api/bookings` - Create booking
- `GET /api/bookings?filter=:filter` - List bookings with filter
- `PUT /api/bookings/:id/cancel` - Cancel booking

## Usage

1. Start both the backend and frontend servers
2. Access the admin dashboard at `http://localhost:3000`
3. Create event types, configure availability, and view bookings
4. Access public booking pages at `http://localhost:3000/:slug` (e.g., `/15min`)

## Design System

- **Colors**: Light mode with `bg-white`, `bg-gray-50`, `bg-gray-100`, `text-gray-500`, `text-gray-900`, `bg-black`
- **Typography**: Inter font family
- **Borders**: `border-gray-200`, `border-gray-300`
- **Spacing**: Consistent padding and margins throughout

## License

ISC
