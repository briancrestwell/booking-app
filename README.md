# F&B Table Booking & Ordering — Enterprise Web App

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TailwindCSS, Shadcn UI, Zustand, TanStack Query, React Hook Form + Zod |
| Backend | NestJS, PostgreSQL 16 (Prisma ORM), Redis 7, Socket.IO |
| Infra | Docker Compose |

## Monorepo Layout

```
apps/web        → Next.js frontend (port 3000)
apps/api        → NestJS backend  (port 3001)
packages/shared → Shared Zod schemas, types, query keys, constants
docker/         → Container init scripts
```

## Quick Start (Local Dev)

### 1. Prerequisites
- Node.js ≥ 20, Yarn ≥ 1.22
- Docker Desktop

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your desired credentials
```

### 3. Start Infrastructure

```bash
yarn infra:up           # Start PostgreSQL + Redis
yarn infra:up:tools     # Also start Redis Commander UI (http://localhost:8081)
```

### 4. Install Dependencies

```bash
yarn install
```

### 5. Database Migrations

```bash
yarn db:migrate         # Run Prisma migrations (after schema is authored)
yarn db:studio          # Open Prisma Studio (http://localhost:5555)
```

### 6. Start Applications

```bash
yarn dev:api            # Start NestJS API (http://localhost:3001)
yarn dev:web            # Start Next.js web (http://localhost:3000)
```

## Infrastructure Services

| Service | Port | Credentials |
|---|---|---|
| PostgreSQL | 5432 | See `.env` |
| Redis | 6379 | See `.env` |
| Redis Commander (dev-tools profile) | 8081 | admin / admin |
| Prisma Studio | 5555 | N/A |

## Key Architecture Decisions

### Double-Booking Prevention
All table booking operations acquire a **Redis distributed lock** (`SET NX PX 300000`) before any database write.
Lock key: `lock:booking:table:{tableId}:{slotId}`. Lock is released atomically via Lua script in a `finally` block.

### ACID Guarantees
All booking and payment mutations run inside `prisma.$transaction` with `Serializable` isolation level.

### Real-Time Sync
Socket.IO namespaces: `/kitchen` (new orders), `/pos` (payments), `/tables` (availability).
Events are emitted **after** transaction commit — never inside a transaction.

### State Management (Frontend)
- **Server state** → TanStack Query only
- **Client/UI state** → Zustand only
- Query keys are co-located in `packages/shared/src/query-keys.ts`

## Cursor Rules

See `.cursor/rules/` for enforced architectural patterns:

| Rule File | Scope |
|---|---|
| `00-project-overview.mdc` | Always |
| `01-backend-concurrency.mdc` | `apps/api/**/*.ts` |
| `02-backend-prisma-transactions.mdc` | `apps/api/**/*.ts` |
| `03-frontend-state-management.mdc` | `apps/web/**/*.{ts,tsx}` |
| `04-frontend-ui-standards.mdc` | `apps/web/**/*.tsx` |
| `05-shared-contracts.mdc` | `packages/shared/**/*.ts` |
| `06-realtime-socketio.mdc` | `**/*.{ts,tsx}` |
