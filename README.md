# Todo Template

A modern todo application with authentication and category management built with Next.js.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19
- **Backend**: Next.js API Routes with Hono.js
- **Authentication**: Better Auth
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **API Client**: Hono RPC client with type inference
- **Data Fetching**: SWR
- **UI**: TailwindCSS + shadcn/ui components
- **Validation**: Zod

## Getting Started

### 1. Environment Setup

Copy the environment variables:

```bash
cp .env.sample .env
```

Update the `.env` file with your values:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# BetterAuth
BETTER_AUTH_SECRET="your-super-secret-key-change-this-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# Next.js public env
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

### 2. Database Setup

Generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 3. Start Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Features

- User authentication with email/password
- Todo management with categories
- Real-time updates with SWR
- Type-safe API with Hono RPC
- Responsive design with TailwindCSS
