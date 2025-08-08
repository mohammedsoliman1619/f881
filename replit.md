# ProductiFlow - Personal Productivity Platform

## Overview

ProductiFlow is an offline-first Progressive Web App (PWA) designed as a comprehensive personal productivity platform. The application combines task management, calendar functionality, goal tracking, reminders, and analytics into a cohesive, professional-grade solution. Built with modern web technologies, it emphasizes reliability, performance, and user experience across all device types.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based architecture with TypeScript for type safety and reliability:

- **Framework**: React 18 with TypeScript for component-based development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for predictable state management
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design
- **UI Components**: Radix UI primitives with custom theming support

### Backend Architecture
The backend follows a simple Express.js pattern with potential for database integration:

- **Server**: Express.js with TypeScript for API endpoints
- **Database Schema**: Drizzle ORM with PostgreSQL support (configured but can be extended)
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations
- **Session Management**: Express sessions with PostgreSQL store capability

### Offline-First Design
The application prioritizes offline functionality through:

- **Local Storage**: Dexie.js (IndexedDB wrapper) for robust local data persistence
- **PWA Features**: Service worker capabilities for offline operation
- **Data Synchronization**: Local-first approach with eventual server synchronization

## Key Components

### Core Modules
1. **Tasks Module**: Complete task management with projects, priorities, subtasks, and recurrence
2. **Calendar Module**: Event scheduling and timeline management
3. **Goals Module**: Goal setting with progress tracking, habits, and milestones
4. **Reminders Module**: Time-based notifications and alerts
5. **Analytics Module**: Performance tracking and productivity insights
6. **Settings Module**: User preferences, themes, and configuration

### UI Architecture
- **Layout System**: Responsive design with sidebar navigation (desktop) and bottom navigation (mobile)
- **Theme System**: Light/dark mode support with system preference detection
- **Internationalization**: Multi-language support (English, Spanish, French) using i18next
- **Component Library**: shadcn/ui components for consistency and accessibility

### Data Layer
- **Type Safety**: Comprehensive TypeScript interfaces for all data models
- **Schema Validation**: Zod schemas for runtime validation
- **Database Abstraction**: Storage interface pattern allowing multiple backend implementations

## Data Flow

### Local-First Pattern
1. **User Actions** → **Zustand Store** → **Local Database (Dexie)**
2. **Background Sync** → **Server API** → **Database** (when online)
3. **Conflict Resolution** through last-write-wins or custom merge strategies

### State Management
- **Global State**: Zustand store for application-wide state
- **Local State**: React hooks for component-specific state
- **Persistence**: Automatic persistence through IndexedDB
- **Reactive Updates**: Real-time UI updates through store subscriptions

### Data Validation
- **Input Validation**: Form validation using react-hook-form with Zod resolvers
- **Type Checking**: Compile-time type safety with TypeScript
- **Runtime Validation**: Schema validation for data integrity

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **State Management**: Zustand with persistence middleware
- **Database**: Dexie.js for IndexedDB, Drizzle ORM for PostgreSQL
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Validation**: Zod for schema validation, react-hook-form for forms
- **Internationalization**: i18next, react-i18next
- **Date Management**: date-fns for date utilities

### Development Dependencies
- **Build Tools**: Vite, TypeScript, ESBuild
- **Code Quality**: ESLint, Prettier (implied)
- **Testing**: React Testing Library (planned)

### Optional Integrations
- **Analytics**: Potential integration with analytics services
- **Cloud Storage**: Extensible to cloud storage providers
- **Notifications**: Web Push API for notifications
- **Sync Services**: Real-time synchronization capabilities

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reload
- **Database**: In-memory storage for development, PostgreSQL for production
- **Environment Configuration**: Environment variables for database connections

### Production Deployment
- **Build Process**: Vite production build with code splitting and optimization
- **Server Bundle**: ESBuild for server-side bundling
- **Static Assets**: Optimized client assets served from `/dist/public`
- **Database**: PostgreSQL with Neon Database integration
- **PWA Features**: Service worker registration for offline capabilities

### Scalability Considerations
- **Modular Architecture**: Clear separation of concerns for easy scaling
- **Database Abstraction**: Pluggable storage interfaces for different backends
- **Component Reusability**: Shared component library for consistency
- **Performance Optimization**: Code splitting, lazy loading, and caching strategies

The architecture emphasizes maintainability, type safety, and user experience while providing a solid foundation for a production-ready productivity application. The offline-first approach ensures reliability regardless of network conditions, making it suitable for professional use cases.