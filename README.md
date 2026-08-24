# Gym Track

Gym Track is an offline-first workout tracking and progressive overload application designed for lifters. Built with Next.js, NestJS, and Prisma, it provides real-time in-gym set logging, automated rest countdowns with zero-latency audio synthesis, exercise routine management, and Apple Fitness-style weekly consistency analytics.

---

## Key Features

- **Active Workout Tracking (`/workout`)**
  - Real-time session elapsed timer with automatic state recovery across refreshes and tab switches.
  - Previous performance indicators (*e.g., 80 kg × 10*) and ghost placeholder values to guide progressive overload.
  - Interactive set logging for weight, repetitions, and RIR (Reps in Reserve).
  - Dynamic in-session modifications (add/remove sets and exercises on the fly).
  - Post-session completion summary calculating total volume lifted and duration.

- **Smart Rest Timer & Audio Synthesizer**
  - Automated rest countdown triggered upon set completion.
  - Zero-latency Web Audio API sound synthesis (countdown tick beeps and completion chimes) that runs entirely offline without external audio files.
  - Floating pill minimizer mode allowing users to browse exercises while the timer runs in the background.

- **Offline-First PWA Resilience**
  - Built-in IndexedDB mutation queue (`idb-keyval`) to safely log workouts in gym basements or dead cellular zones.
  - Silent auto-synchronization that flushes queued data to the backend upon network reconnection.
  - Installable as a progressive web app on iOS and Android.

- **Routines & Exercise Database (`/routines`, `/exercises`)**
  - Custom training split builder with target rep ranges and rest durations.
  - Catalog of 80+ seeded exercises filterable by category (Push, Pull, Legs, Core) and equipment (Barbell, Dumbbell, Machine, Cable, Bodyweight) with detailed execution guides.

- **Interactive Analytics & History (`/`, `/history`)**
  - Weekly consistency target ring with active day-of-week checkmarks.
  - 6-week rolling volume progression and workout frequency bar charts.
  - Segmented muscle group distribution analysis.
  - Lifetime Personal Records (PR) showcase with search filtering.
  - Chronological workout history log with one-click "Repeat Workout" functionality.

- **Theme Customization**
  - Warm minimalist design system with light, dark, and system-adaptive modes.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **State & Data**: TanStack React Query v5 (persisted via `idb-keyval`), Zustand
- **PWA & Offline**: Serwist Service Worker, IndexedDB mutation queue
- **Icons**: Lucide React
- **Audio**: Web Audio API

### Backend
- **Framework**: NestJS 11
- **Database ORM**: Prisma 7 (MySQL / MariaDB)
- **Authentication**: JWT, Passport.js, Bcrypt
- **Email**: Nodemailer (OTP password recovery)

---

## Project Structure

```
gym-track/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database models & relations
│   ├── src/
│   │   ├── analytics/          # Streaks, volume trends, PR aggregations
│   │   ├── auth/               # JWT auth & OTP password recovery
│   │   ├── exercises/          # Exercise database queries & filters
│   │   ├── profile/            # User preferences & equipment setup
│   │   ├── routines/           # Split routines management
│   │   └── workout-logs/       # Live session logging & history
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/             # Login, register, password reset flows
│   │   ├── exercises/          # Exercise catalog & movement guides
│   │   ├── history/            # Workout history logs & PR showcase
│   │   ├── profile/            # User settings & theme toggle
│   │   ├── routines/           # Routine split builder
│   │   └── workout/            # Active live workout session logger
│   ├── components/
│   │   ├── analytics/          # Consistency rings & trend charts
│   │   ├── layout/             # Navigation bars (desktop & mobile)
│   │   ├── routines/           # Exercise picker & detail modals
│   │   ├── ui/                 # Reusable UI primitives & badges
│   │   └── workout/            # Rest timer & exercise set cards
│   ├── lib/
│   │   ├── api.ts              # Axios client with offline fallback
│   │   ├── audio.ts            # Web Audio API chime synthesizer
│   │   └── syncQueue.ts        # IndexedDB offline mutation queue
│   ├── providers/              # React Query & Theme providers
│   └── store/                  # Zustand authentication store
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- MySQL or MariaDB instance

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=4000
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/gym_track"
   JWT_SECRET="your-secure-jwt-secret"
   
   # Optional: Email service configuration for password reset OTPs
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@example.com"
   EMAIL_PASS="your-email-app-password"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the backend development server:
   ```bash
   npm run start:dev
   ```
   The backend API will run at `http://localhost:4000`.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Production Build

To build both services for production:

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
