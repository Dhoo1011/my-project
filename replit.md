# Phantom RP Police HQ Portal

## Overview

A police department portal for a roleplay server (Phantom RP), featuring Arabic RTL interface for managing police announcements, wanted lists, departments, and citizen reports. The application serves as a public-facing website with internal staff functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme (police/security palette), RTL support for Arabic text
- **Animations**: Framer Motion for smooth page transitions and micro-interactions
- **Forms**: React Hook Form with Zod validation using @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in shared routes file with Zod schema validation
- **Build Process**: Custom build script using esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema push (`npm run db:push`)
- **Tables**: announcements, wanted_list, departments, reports

### Code Organization
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Type Safety**: Shared Zod schemas ensure frontend-backend type consistency

### Key Design Patterns
- **Typed API Routes**: Routes defined with Zod input/output schemas in `shared/routes.ts`
- **Database Abstraction**: Storage interface pattern in `server/storage.ts` for data operations
- **Component Composition**: Shadcn components with custom styling for consistent UI

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe query builder and schema management

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Framer Motion**: Animation library for React
- **Embla Carousel**: Carousel/slider functionality
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Dev server with HMR and production builds
- **Replit Plugins**: Error overlay, cartographer, and dev banner for Replit environment

### Fonts
- **Cairo & Tajawal**: Arabic-optimized display and body fonts loaded from Google Fonts