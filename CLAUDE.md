# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Architecture Overview

This is a Next.js todo application with authentication built using:

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui components
- **Backend**: Hono.js API routes with Better Auth for authentication
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives with custom styling

### Key Architecture Patterns

1. **Authentication Flow**: Uses Better Auth with email/password authentication. Session management is handled through HTTP-only cookies with user sessions stored in PostgreSQL.

2. **API Structure**: All API routes are handled through a single Hono app at `/api/[...route]/route.ts`. This includes:
   - Better Auth endpoints at `/api/auth/*`
   - Todo CRUD operations at `/api/todos`
   - Category management at `/api/categories`

3. **Database Schema**: 
   - Better Auth tables: `user`, `session`, `account`, `verification`
   - Application tables: `todos`, `categories`
   - All user data is properly isolated with foreign key constraints

4. **Component Structure**: Uses shadcn/ui components in `src/components/ui/` with form handling via react-hook-form and Zod validation.

5. **Environment Configuration**: 
   - Database connection via `DATABASE_URL` environment variable
   - Better Auth configuration via `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
   - Drizzle config points to PostgreSQL with migrations in `./migrations`

### Important Files
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/db/schema.ts` - Database schema definitions
- `src/app/api/[...route]/route.ts` - All API endpoints
- `drizzle.config.ts` - Database migration configuration