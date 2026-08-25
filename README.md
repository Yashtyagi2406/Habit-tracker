# Habit Tracker with Precision Local Streaks

A full-stack habit tracking application calculating current and longest streaks based strictly on the user's local calendar day (IANA timezone), rather than elapsed 24-hour windows or server UTC time.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express, TypeScript
- **ORM & Database**: Prisma ORM, PostgreSQL (`@db.Date` native column and composite unique constraints)
- **Validation**: Zod
- **Authentication**: JWT & bcryptjs password hashing
- **Testing**: Vitest for unit testing local date boundaries and streak engines

---

## Architectural Highlights & Local-Day Design Decisions

### 1. Isolated Timezone Logic (`backend/src/lib/localDate.ts`)
All timezone conversions and local-day logic are strictly isolated in `backend/src/lib/localDate.ts`. No other module, route, or controller imports timezone libraries or performs timezone math.
- **What counts as "Today"**: The calendar day string (`YYYY-MM-DD`) derived by projecting the current UTC timestamp into the user's stored IANA timezone using Luxon.
- **What counts as "Future"**: Any date string (`dateStr > localToday`) relative to the user's local calendar day.
- **DST & Offset Handling**: Luxon's `IANAZone` handles all Daylight Saving Time shifts (e.g. spring forward / fall back) without shifting the calendar day. A user checking in at 11:30 PM UTC from `Asia/Kolkata` is already on the next calendar day locally, and the system records the check-in for their local day.

### 2. Pure Streak Calculation Engine (`backend/src/streaks/streaks.ts`)
- The streak calculation engine is completely pure and operates solely on arrays of normalized `YYYY-MM-DD` strings.
- **Current Streak**: Consecutive local days ending at either `today` (checked in today) or `yesterday` (streak remains active until today ends).
- **Longest Streak**: The maximum consecutive run of local days across all historical check-ins.

### 3. Database Source of Truth
- Check-ins store a local calendar date in PostgreSQL's native `DATE` type (`localDate @db.Date` in Prisma).
- A database-level unique constraint `@@unique([habitId, localDate])` enforces "one check-in per local calendar day", returning HTTP 409 (`DUPLICATE_CHECKIN`) on duplicates.
- User timezone is resolved server-side from the authenticated user's database record, never trusted from the client payload.

---

## Project Structure

```text
habit-tracker/
├── backend/
│   ├── prisma/
│   │   ├── migrations/       # Applied PostgreSQL migrations
│   │   └── schema.prisma     # User, Habit, CheckIn models
│   ├── src/
│   │   ├── config/env.ts     # Zod validated environment variables
│   │   ├── lib/
│   │   │   ├── localDate.ts  # ⭐ SINGLE SOURCE OF TRUTH for timezone math
│   │   │   └── prisma.ts     # Prisma client singleton
│   │   ├── middleware/       # JWT auth, Zod validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/         # Register, Login, Me endpoints
│   │   │   ├── habits/       # Habit CRUD & streaks aggregation
│   │   │   └── checkins/     # Check-in logging & backfill validation
│   │   ├── streaks/
│   │   │   └── streaks.ts    # ⭐ Pure streak calculation functions
│   │   ├── app.ts            # Express application configuration
│   │   └── server.ts         # Server entry point
│   └── tests/
│       ├── localDate.test.ts # Timezone, DST, and UTC offset unit tests
│       └── streaks.test.ts   # Streak calculation unit tests
└── frontend/
    └── src/
        ├── api/client.ts     # API client with JWT injection & error handling
        ├── components/       # HabitCard, StreakBadge, CheckInForm
        ├── context/          # AuthContext with persistent session
        └── pages/            # Login, Register (with IANA tz picker), Dashboard
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 1. Database Setup
Ensure PostgreSQL is running. If using Docker:
```bash
docker-compose up -d
```
Or use a local PostgreSQL instance and create a database named `habit_tracker`.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```
The backend server will start on `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server will start on `http://localhost:5173`.

---

## Running Tests

Run all unit tests in the backend:
```bash
cd backend
npm test
```
To run tests with watch mode:
```bash
npm run test:watch
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register with email, password, and IANA timezone.
- `POST /api/auth/login` — Login and receive a JWT.
- `GET /api/auth/me` — Get current user profile.

### Habits
- `GET /api/habits` — List habits with calculated `currentStreak`, `longestStreak`, and today's status.
- `POST /api/habits` — Create a new habit (`{ name: string }`).

### Check-Ins
- `POST /api/habits/:habitId/checkins` or `POST /api/checkins` — Log check-in for today (or backfill past date with `{ date: "YYYY-MM-DD" }`).
