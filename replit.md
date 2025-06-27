# FinBot - Financial Management Application

## Overview

FinBot is a modern full-stack financial management application built with a React frontend and Express.js backend. The application provides users with an intuitive interface to track their income and expenses, view financial summaries, and manage transactions. It features a WhatsApp-inspired design with a clean, mobile-first approach and includes secure user authentication via Replit Auth.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui provides a comprehensive set of accessible UI components
- **Styling**: Tailwind CSS with custom WhatsApp-inspired color scheme
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Data Fetching**: TanStack Query for efficient server state management and caching
- **Mobile Responsiveness**: Mobile-first design with responsive breakpoints

### Backend Architecture
- **API Design**: RESTful API with Express.js
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reloading with tsx for TypeScript execution

### Database Schema
The application uses two main entities:
- **Users**: Stores user information with status tracking and access timestamps
- **Transactions**: Records financial transactions with categorization and user association

### Storage Implementation
- **Interface-based Design**: IStorage interface allows for flexible storage implementations
- **Current Implementation**: In-memory storage for development/demo purposes
- **Production Ready**: Configured for PostgreSQL with Drizzle ORM migrations

## Data Flow

1. **User Interaction**: Users interact with React components
2. **Form Validation**: Client-side validation using React Hook Form and Zod
3. **API Requests**: TanStack Query manages API calls to Express endpoints
4. **Server Processing**: Express routes handle business logic and data validation
5. **Database Operations**: Drizzle ORM performs type-safe database operations
6. **Response Handling**: Client receives and caches responses via TanStack Query

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Build Process
- **Frontend**: Vite builds the React application to `dist/public`
- **Backend**: esbuild bundles the Express server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Environment Configuration
- **Development**: `npm run dev` starts both frontend and backend with hot reloading
- **Production**: `npm run build` followed by `npm run start`
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

### Replit Configuration
- **Modules**: Node.js 20, web, and PostgreSQL 16
- **Port**: Application runs on port 5000, exposed as port 80
- **Autoscale**: Configured for automatic scaling based on demand

## Changelog
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.