# DOCU243 - Plateforme Nationale RDC

## Overview

DOCU243 is a government digital platform for the Democratic Republic of Congo (RDC), providing citizens with access to administrative document services. The platform combines digital identity management, a catalog of administrative services, Mobile Money payments, and complete transaction traceability. It's designed as a Digital Public Infrastructure (DPI) that prioritizes accessibility, security, and inclusion for all citizens, including those with low literacy or basic devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom CSS variables for Congo national colors
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/` for each route
- Reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/`
- API utilities in `client/src/lib/`

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx)
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Design**: RESTful endpoints under `/api/` prefix
- **Session Management**: Express sessions with PostgreSQL store

The server handles:
- Service catalog management
- Document request workflow (submit, track, update status)
- Citizen identity with trust levels
- Payment processing integration
- Audit logging for traceability

### Data Storage
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

Key database entities:
- `citizens`: Identity with trust levels and confidence index
- `services`: Administrative service catalog
- `documentRequests`: Workflow tracking with status progression
- `payments`: Mobile Money payment records
- `auditLogs`: Complete transaction audit trail

### Design System
The platform follows official Congo national color guidelines:
- Primary Blue (#3774b6): CTAs, navigation, progress states
- Danger Red (#ce1021): Errors and critical alerts only
- Warning Yellow (#f7d116): Pending states, notifications
- Success Green (#2ecc71): Confirmed payments, approvals

Design principles emphasize institutional authority, universal accessibility, and low cognitive load.

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe database operations
- `connect-pg-simple` for session storage

### Frontend Libraries
- TanStack React Query for data fetching and caching
- React Hook Form with Zod validation
- date-fns for date formatting (French locale)
- Radix UI primitives for accessible components

### Payment Integration
- Mobile Money providers (M-Pesa, Airtel Money, Orange Money) - API simulation for MVP
- Payment workflow with tracking codes

### Build and Development
- Vite for frontend bundling and HMR
- esbuild for production server bundling
- TypeScript for type safety across the stack

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: For session encryption (required)
- Node.js with ES modules support

## API Endpoints

### Services
- `GET /api/services` - List all administrative services
- `GET /api/services/:id` - Get specific service details

### Document Requests
- `POST /api/requests` - Create new document request (requires citizen info + serviceId)
- `GET /api/requests/:id` - Get request by ID
- `PATCH /api/requests/:id/status` - Update request status (workflow progression)

### Tracking
- `GET /api/tracking/:code` - Track document by tracking code (e.g., DOC-2026-XXXXX)

### Payments
- `POST /api/payments/initiate` - Initiate Mobile Money payment
- `POST /api/payments/confirm` - Confirm payment (webhook simulation)

### Citizens
- `GET /api/citizens/:nationalId` - Get citizen by national ID
- `GET /api/citizens/:nationalId/requests` - Get all requests for a citizen

### USSD Simulation
- `POST /api/ussd` - USSD menu simulation for basic phone access

### Data Seeding
- `POST /api/seed` - Seed initial service catalog data

### Authentication
- `POST /api/auth/login` - Admin/Staff login with username and password
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/register` - Create new admin/staff user (protected, admin only)

### Admin API
- `GET /api/admin/requests` - Get all document requests with citizen/service details (protected)
- `PATCH /api/admin/requests/:id/status` - Update request status (protected)
- `POST /api/admin/seed` - Create default admin user

## Admin Access

Default admin credentials (for testing):
- **Username**: `admin`
- **Password**: `admin123`
- **Access URL**: `/admin` or `/admin/login`

Admin features:
- View all document requests with statistics
- Update request status (pending → processing → ready → delivered)
- Add internal notes to requests
- Create new staff/admin users
- Full audit trail logging

## Recent Changes (January 2026)

- Implemented complete PostgreSQL database with citizens, services, documentRequests, payments, auditLogs, and users tables
- Added DatabaseStorage with full CRUD operations for all entities
- Created comprehensive API routes for all MVP features
- Built frontend pages: Home, Services, Tracking, Request, Payment, Account
- Added route aliases for both French and English paths
- Integrated Mobile Money payment flow with tracking
- Added workflow status progression endpoint with audit logging
- Added admin authentication with bcrypt password hashing
- Built admin dashboard with request management and user creation
- Implemented session-based authentication with express-session