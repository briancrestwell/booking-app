-- PostgreSQL initialization script
-- Runs once when the container is first created.

-- Enable UUID generation (required by Prisma default UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for fast ILIKE full-text search on names/descriptions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Prisma will handle schema migrations via `prisma migrate dev`.
-- This script only installs extensions that Prisma cannot manage.
