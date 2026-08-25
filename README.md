# Habit Tracker with Streaks

## Setup
1. Backend: cd backend && npm install && cp .env.example .env && npm run prisma:migrate && npm run dev
2. Frontend: cd frontend && npm install && npm run dev

## Where the local-day logic lives
See backend/src/lib/localDate.ts — this is the single source of truth for
converting UTC instants into a user's local calendar day, validating IANA
timezones, and detecting future dates. streaks/streaks.ts consumes only
normalized local-date strings and never does its own timezone math.

## Key design decisions
(fill in after implementation — walkthrough video should walk through this file)
