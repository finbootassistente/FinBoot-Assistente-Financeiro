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

## Recent Changes (June 27, 2025)

### Major Feature Additions
- **AI-Powered Financial Assistant**: Integrated OpenAI GPT-4o for personalized spending analysis and recommendations
- **Intelligent Chat Assistant**: Transformed chat into smart financial assistant that:
  - Interprets natural language commands like "gastei 50 reais com mercado"
  - Automatically registers transactions from conversational input
  - Responds to queries about balance, expenses, and financial data
  - Provides personalized financial advice and insights
- **WhatsApp Integration**: Complete WhatsApp Business API integration allowing:
  - Direct transaction registration via WhatsApp messages
  - User phone number linking system
  - Automatic response with transaction confirmations
  - Balance and extract queries through WhatsApp
  - Webhook system for real-time message processing
- **Visual Analytics Dashboard**: Added interactive charts using Recharts library
  - Pie chart for expense categories breakdown
  - Line chart for monthly income/expense trends
  - Real-time visual insights with responsive design
- **Enhanced Mobile Experience**: Completely optimized for mobile devices with responsive layouts
- **PDF Export Functionality**: Users can export transaction reports as PDF files
- **Advanced Filtering System**: Date-based filtering (today, week, month, year, custom range)
- **Daily AI Summary**: Personalized daily financial summaries with AI-generated insights
- **Google Login Integration**: Added Google sign-in option for improved user experience
- **Admin Analytics Panel**: Enhanced admin dashboard with usage charts and user management
- **Messaging System**: Administrators can send messages to users directly from the panel
- **Dark Mode Support**: Full dark/light theme toggle with system preference detection
- **AI Chat Interface**: WhatsApp-style chat interface with transaction creation indicators
- **Modern Authentication UI**: Clean login/register interface without test credentials
- **Floating Action Buttons**: Quick access to transactions and AI chat from any page

### Technical Improvements
- **Database Integration**: Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- **Enhanced API Routes**: Added comprehensive analytics and AI analysis endpoints
- **Responsive Design**: Mobile-first approach with improved breakpoints and touch interactions
- **Logo Component**: Created reusable logo component with multiple sizes and configurations
- **Export Functionality**: Integrated jsPDF and html2canvas for report generation
- **Chart Components**: Built modular chart components for spending visualization
- **Error Handling**: Improved error states and loading indicators throughout the application

### User Experience Enhancements
- **WhatsApp-Inspired UI**: Maintained familiar messaging app aesthetics
- **Touch-Optimized Interface**: Enhanced mobile interactions and gestures
- **Smart Filters**: Intelligent transaction filtering with date ranges
- **Visual Feedback**: Loading states, animations, and status indicators
- **Accessibility**: Improved screen reader support and keyboard navigation

## External Dependencies

### New Dependencies Added
- **recharts**: Interactive charts and data visualization
- **jspdf**: PDF generation for transaction reports
- **html2canvas**: HTML to canvas conversion for exports
- **react-icons/fc**: Google and other service icons

## Changelog
- June 27, 2025. Initial setup with basic financial tracking
- June 27, 2025. Major enhancement with AI integration, visual analytics, mobile optimization, and comprehensive feature additions

## User Preferences

Preferred communication style: Simple, everyday language (Portuguese Brazilian).
Support email: finbootassistente@gmail.com
Feature requests: Include quick actions below daily summary with motivational phrases and financial tips alternating randomly.