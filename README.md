# TOEIC Green

A full-stack web app for practicing the TOEIC Listening & Reading exam. Users can take mock tests that mirror the real TOEIC format, review their answers in detail, study vocabulary through curated flashcard collections, and track their progress over time.

> 🌐 **Live in production — try it now at [https://toeicgreen.com](https://toeicgreen.com)**
> No setup required. Just open the site, sign up (email/password or Google), and start practicing. The local setup below is only for development. See [Live Site](#live-site) for details.
> Production architecture and the latest verified release are recorded in
> [`docs/production-status.md`](docs/production-status.md).

---

## Table of Contents

- [Live Site](#live-site)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [Authentication](#authentication)
- [Practice & Test Taking](#practice--test-taking)
- [Vocabulary System](#vocabulary-system)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Deployment](#deployment)

---

## Live Site

**TOEIC Green is deployed and running in production with real users.** You don't need to clone the repo or configure anything locally to experience it — just open the live site and use it directly.

| Surface | URL |
|---------|-----|
| 🌐 Web app | **https://toeicgreen.com** |
| 🔌 API | https://api.toeicgreen.com/api |

### How to try it

1. Go to **[https://toeicgreen.com](https://toeicgreen.com)**.
2. Sign up with **email + password** (you'll receive a real verification email) or **Sign in with Google**.
3. Open **Practice** → pick a test → take a full mock exam or a partial practice session → submit and review your scored result question by question.
4. Explore **vocabulary collections**, study them in flashcard mode, build your **personal word list**, and check your **progress** dashboard.

> The [Getting Started](#getting-started) section below is **only needed for local development**. To simply use the app, the live site has everything already set up (database, media, email, OAuth).

The domain `toeicgreen.com` is registered and DNS-managed through **Hostinger**. The app is split across managed cloud services — see [Deployment](#deployment) for the full production architecture.

---

## Project Structure

This is a monorepo with two independent applications:

```
toeic-green/
├── back-end/               # NestJS API server (port 2409)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Authentication (JWT, OAuth, email verification)
│   │   │   ├── practice/   # Tests, attempts, scoring, comments
│   │   │   ├── explore/    # Vocabulary collections
│   │   │   ├── vocabulary/ # Personal word lists
│   │   │   ├── profile/    # User profiles
│   │   │   ├── users/      # User management
│   │   │   ├── comments/   # Test discussion threads
│   │   │   └── mail/       # Email service (SMTP/Resend)
│   │   ├── config/         # NestJS config modules (validated on startup)
│   │   └── main.ts         # App bootstrap
│   ├── prisma/
│   │   ├── schema.prisma   # Full database schema
│   │   └── migrations/     # SQL migration history
│   ├── scripts/            # Seeding and data upload scripts
│   ├── deploy/             # AWS production runtime + legacy deployment scripts
│   └── docker-compose.yml  # Local PostgreSQL + Redis
│
├── front-end/              # Next.js web app (port 6868)
│   └── src/
│       ├── app/            # App Router pages and layouts
│       ├── features/       # Feature-specific components and hooks
│       ├── lib/            # Shared utilities (API client, auth)
│       └── components/     # Reusable UI components
│
└── docs/                   # Architecture, status, specs, and implementation plans
```

---

## Tech Stack

### Backend
| What | Technology |
|------|-----------|
| Framework | NestJS 11 with SWC compiler |
| Language | TypeScript 5.7 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Auth | JWT (access + refresh token rotation) |
| Cache / Rate limiting | In-process cache + Nest throttler; memory-backed rate limits on the current single EC2, optional Redis mode for horizontal scaling |
| File storage | Cloudflare R2 (S3-compatible) |
| Email | Nodemailer via Gmail SMTP (dev) / Resend (production) |
| OAuth | Google (authorization code flow) + GitHub |

### Frontend
| What | Technology |
|------|-----------|
| Framework | Next.js 16 with App Router |
| UI library | React 19 |
| Styling | Tailwind CSS 3.4 |
| Server state | TanStack Query (React Query) 5 |
| Animation | Framer Motion 12 |
| Language | TypeScript |

### Infrastructure
- Docker + Docker Compose for local development
- AWS EC2 + Docker Compose + Caddy for backend deployment (live at `api.toeicgreen.com`)
- Vercel for frontend deployment (live at `toeicgreen.com`)
- Domain & DNS managed on Hostinger
- AWS SSM Parameter Store for production backend secrets

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL and Redis)

### Setup

**1. Clone and install dependencies**

```bash
git clone <repo>
cd EnglishUsuk_sys
npm install          # root deps
cd back-end && npm install
cd ../front-end && npm install
```

**2. Start the local database and cache**

```bash
# From root
npm run db:up
```

This starts a PostgreSQL 16 container on port 5432 and a Redis 7 container on port 6379.

**3. Configure environment variables**

```bash
cp back-end/.env.example back-end/.env
# Fill in the required values — see Environment Variables section below
```

For the frontend:
```bash
# front-end/.env.local
NEXT_PUBLIC_API_URL=http://localhost:2409/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**4. Run database migrations and seed data**

```bash
cd back-end
npx prisma migrate dev        # Apply migrations
npm run prisma:generate       # Generate Prisma client
npm run seed:toeic            # Seed TOEIC test data
npm run seed:flashcards       # Seed vocabulary collections
```

**5. Start both apps**

```bash
# From root, two separate terminals
npm run dev:backend      # NestJS on :2409
npm run dev:frontend     # Next.js on :6868
```

---

## Environment Variables

All backend env vars are validated at startup via Joi. If something required is missing or malformed, the app exits immediately with an error.

### Server

```env
PORT=2409
FRONTEND_URL=http://localhost:6868
CORS_ALLOWED_ORIGINS=             # Optional extra origins, comma-separated
```

### Database

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toeicgreen?schema=public"
# Optional locally; Prisma migrations fall back to DATABASE_URL when unset.
DIRECT_URL="postgresql://user:password@localhost:5432/toeicgreen?schema=public"
```

For production with Supabase + PgBouncer:
```env
DATABASE_URL="postgresql://user:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@aws-0-region.pooler.supabase.com:5432/postgres"
```

The API runtime uses `DATABASE_URL`. Prisma deployment migrations prefer
`DIRECT_URL` so they do not run through transaction pooling.

### Rate-limit storage

```env
THROTTLE_STORAGE="memory" # Current single-instance production default

# Required only when THROTTLE_STORAGE=redis:
REDIS_URL="redis://localhost:6379"
# REDIS_URL="rediss://default:password@your-instance.upstash.io:6379"
```

`memory` keeps rate limiting inside the API process and does not construct a
Redis client. Select `redis` only when multiple API processes need shared
counters and the Redis service, credentials, and quota have been verified.

### JWT

```env
JWT_SECRET="at-least-32-characters-long-secret"
JWT_REFRESH_SECRET="different-at-least-32-char-secret"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
```

### Email (SMTP via Gmail)

```env
MAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-gmail@gmail.com"
SMTP_APP_PASSWORD="your-16-char-app-password"
EMAIL_FROM="TOEIC Green <your-gmail@gmail.com>"
EMAIL_VERIFICATION_URL="http://localhost:6868/verify-email"
```

### Google OAuth

```env
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

### Cloudflare R2

```env
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY="your-r2-access-key"
R2_SECRET_KEY="your-r2-secret-key"
R2_BUCKET_NAME="toeic-green-assets"
R2_PUBLIC_URL="https://assets.toeicgreen.com"
```

### Production extras

```env
TRUST_PROXY="1"         # Number of proxy hops (for correct IP in rate limiting)
COOKIE_SECURE="true"    # Force Secure flag on refresh token cookie
COOKIE_DOMAIN=""        # Optional cookie domain restriction
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                    │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  Server      │    │  Client      │    │ Broadcast│  │
│  │  Components  │    │  Components  │    │ Channel  │  │
│  │  (SSR/ISR)   │    │  + React     │    │ (tabs    │  │
│  │              │    │    Query     │    │  sync)   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┘  │
│         │                   │                           │
│         │  fetch (server)   │  fetch (client)           │
└─────────┼───────────────────┼───────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              NestJS API  (:2409/api/*)                  │
│                                                         │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │
│  │  auth  │ │ practice │ │ explore │ │  vocabulary │  │
│  └────────┘ └──────────┘ └─────────┘ └─────────────┘  │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Prisma    │    │  Throttler   │    │ Cloudflare│  │
│  │ (PostgreSQL │    │ (memory now; │    │    R2     │  │
│  │   queries)  │    │ Redis opt-in)│    │  (media)  │  │
│  └─────────────┘    └──────────────┘    └───────────┘  │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│    PostgreSQL 16     │
│   (main database)   │
└─────────────────────┘
```

### Key design decisions

**Caching and throttling:** Hot-path data (test catalog, questions) is cached
in-memory on the backend with short TTLs (60s for tests, 5 minutes for
questions). Rate-limit storage is selected explicitly through
`THROTTLE_STORAGE`; the current single-process production deployment uses
`memory`. Redis is reserved for an explicit multi-process deployment and is not
an automatic runtime fallback.

**Refresh token rotation:** Each time a user refreshes their session, the old refresh token is revoked and a new one is issued. This means stolen refresh tokens become invalid after the first legitimate use.

**Multi-tab coordination:** The frontend uses the Web Locks API (with BroadcastChannel as fallback) to ensure only one tab calls `/auth/refresh` at a time. Other tabs wait for the result and reuse the new token — no redundant refresh calls.

**Server components + client components:** Next.js server components handle initial data fetching (test catalog, user session on page load). Client components take over for interactive parts (the test-taking interface, real-time timer, etc.).

---

## Authentication

### Overview

Three login methods are supported. The key rule is **one email = one method** — if you registered with Google, you can't also create a password account with the same email, and vice versa.

```
                        ┌──────────────────────┐
                        │      /api/auth/       │
                        └──────────┬───────────┘
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
     ┌────────────────┐  ┌───────────────┐  ┌───────────────┐
     │ Email/Password  │  │ Google OAuth  │  │ GitHub OAuth  │
     └────────┬───────┘  └───────┬───────┘  └───────┬───────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │  issueSession(user)    │
                     │  - Generate JWT (15m)  │
                     │  - Generate refresh    │
                     │    token (7d / 8h)     │
                     │  - Store session hash  │
                     │    in DB               │
                     └────────────────────────┘
                                  │
                    ┌─────────────┴───────────────┐
                    ▼                             ▼
           accessToken (JSON)         refresh_token cookie
           returned in body           httpOnly, Secure, SameSite
```

### Registration (email/password)

```
POST /api/auth/register
         │
         ├── Normalize email
         ├── Check email not already taken (User table or PendingRegistration)
         ├── Hash password (bcrypt, 12 rounds)
         ├── Insert into PendingRegistration (not a real User yet)
         ├── Send verification email with token
         │
         └── User clicks email link → POST /api/auth/verify-email
                   │
                   ├── Validate token (not expired, not used)
                   ├── Create User from PendingRegistration data
                   ├── Mark emailVerifiedAt = now()
                   ├── Delete PendingRegistration
                   └── Auto-login (issue session)
```

This two-step flow ensures we never create User rows for unverified emails.

### Google OAuth

```
User clicks "Sign in with Google"
         │
         ▼
Google → returns authorization code
         │
         ▼
POST /api/auth/google  { code: "..." }
         │
         ├── Exchange code for Google token (backend-side)
         ├── Extract email, Google sub (unique ID), name, picture
         │
         ├── [Existing Google user]
         │     └── Find OAuthAccount by provider+sub → issue session
         │
         ├── [Email exists as password account]
         │     └── Throw ConflictException (must use password login)
         │
         └── [New user]
               ├── Create User + UserProfile + OAuthAccount (in transaction)
               ├── Handle P2002 race condition (concurrent signups)
               └── Issue session
```

### Token lifecycle

```
  Login
    │
    ├── accessToken (JWT, 15min)        → In memory on client
    └── refreshToken (JWT, 7d)          → httpOnly cookie

  Every API request
    └── Authorization: Bearer <accessToken>

  Token expires (401 response)
    │
    └── POST /api/auth/refresh
          │   (sends refresh_token cookie automatically)
          │
          ├── Verify refresh token signature
          ├── Check session in DB (not revoked, not expired)
          ├── Revoke old session
          ├── Issue new accessToken + refreshToken
          └── Set new refresh_token cookie

  Page load / SSR
    └── GET /api/auth/bootstrap
          └── Returns {user, profile} from refresh cookie
              (cached 15s in-memory — deduplicates SSR + hydration calls)
```

### Security measures

- Refresh tokens are stored as SHA-256 hashes in the database, not plaintext
- `COOKIE_SECURE=true` in production ensures the cookie only travels over HTTPS
- Rate limits per endpoint: login (5/60s), register (3/60s), refresh (20/60s), bootstrap (60/60s)
- Email verification tokens and password reset tokens are single-use (marked with `usedAt`)

---

## Practice & Test Taking

### Test structure

A TOEIC Listening & Reading test has 200 questions across 7 parts:

| Part | Section | Format |
|------|---------|--------|
| Part 1 | Listening | Photograph description (6 questions) |
| Part 2 | Listening | Question-response (25 questions) |
| Part 3 | Listening | Short conversations (39 questions) |
| Part 4 | Listening | Short talks (30 questions) |
| Part 5 | Reading | Incomplete sentences (30 questions) |
| Part 6 | Reading | Text completion (16 questions) |
| Part 7 | Reading | Reading comprehension (54 questions) |

Questions can belong to a `QuestionGroup` (shared audio clip, image, or passage), or stand alone.

### Full test flow

```
User visits /practice
      │
      ▼
GET /api/practice/tests  (cached 60s)
      │   Returns test catalog with attempt history
      │
      ▼
User picks a test → /practice/[testId]/start
      │
      ▼
GET /api/practice/tests/[slug]/questions  (cached 5min)
      │   Returns all 200 questions (images, audio URLs, options)
      │
      ▼
User clicks "Begin" → /practice/[testId]/test
      │
      ├── Client-side timer counts down (120 minutes)
      ├── Answers stored in local React state
      ├── Questions navigable by number or part
      ├── Questions can be flagged for review
      │
      ▼
User submits (or timer hits 0)
      │
      ▼
POST /api/practice/tests/[slug]/attempts
      │   Payload: { answers: {questionId: "A"|"B"|...}, flaggedIds, mode, duration }
      │
      ├── Load questions from DB, verify they belong to this test
      ├── Score each question (selectedAnswer === correctAnswer)
      ├── Calculate TOEIC scaled score if full test:
      │     Listening raw (0-100) → scale table (5-495)
      │     Reading raw (0-100)   → scale table (5-495)
      │     Total = L + R (10-990)
      │
      ├── Create PracticeAttempt + AttemptAnswer rows (transaction)
      ├── Invalidate test catalog cache (attempt count changed)
      │
      └── Return full result object (no second DB query)
            │
            ▼
User redirects to /practice/[testId]/results/[attemptId]
      │
      └── Shows: score, accuracy, time spent, per-question review
            (correct answer, user's answer, explanation, part breakdown)
```

### Scoring

Scaled score only applies to full tests (all 200 questions). For partial practice sessions, only raw accuracy is shown.

The scale follows TOEIC's official conversion table. The backend uses linear interpolation between anchor points, for example:

```
Raw score →  0   10   20   30   40   50 ... 100
Scaled    →  5   35   80  130  175  220 ...  495
```

Both listening and reading sections are scored independently then summed.

---

## Vocabulary System

There are two separate vocabulary features:

### Explore (curated collections)

Word lists sourced from external vocabularies (Study4, Zenlish, etc.), organized into collections by topic or difficulty level. Each word has:
- Pronunciation phonetics
- Part of speech
- Vietnamese translation
- Example sentences with translations
- Audio file (human-recorded, not TTS)
- Cover image

Users can browse collections, save them, and enter a review/study mode that works like a flashcard session. Progress is tracked per user per collection.

### Personal vocabulary

Users can add their own words to a personal list. These are completely separate from the Explore collections. Each word entry can include phonetic, part of speech, meaning, example sentence, and audio.

---

## Database Schema

The full schema is in `back-end/prisma/schema.prisma`. Here's a visual overview:

```
USER & AUTH
═══════════
User ──────────┬── UserProfile
               ├── OAuthAccount[]         (google, github)
               ├── RefreshSession[]       (active sessions)
               ├── EmailVerificationToken[]
               └── PasswordResetToken[]

PendingRegistration                       (transient, pre-verification)


PRACTICE
════════
Test ──────────┬── TestPart[] ────────────┬── QuestionGroup[] ──── Question[]
               │                          └── Question[]
               ├── PracticeAttempt[] ─────────── AttemptAnswer[]
               └── TestComment[]          (threaded, soft-delete)


VOCABULARY
══════════
ExploreCollection ─── ExploreWord[] ─────── ExploreWordExample[]
                                    └────── WordRating[]

ExploreProgress   (User × ExploreCollection progress)
UserVocabulary    (personal word list per user)
```

### Key model details

**User**
```
id              UUID (PK)
email           unique string
passwordHash    nullable (null for OAuth-only accounts)
displayName     string
avatarUrl       nullable
role            "USER" | "ADMIN"
status          "ACTIVE" | "SUSPENDED"
emailVerifiedAt nullable timestamp
```

**RefreshSession**
```
id          UUID (PK)
userId      FK → User
tokenHash   SHA-256 of actual refresh token
expiresAt   timestamp
revokedAt   nullable (set on logout)
```

**Test**
```
id              int (PK)
slug            unique (e.g. "practice-toeic-1")
title           string
type            "LISTENING_READING" | "SPEAKING_WRITING"
durationMinutes int (default 120)
totalQuestions  int (default 200)
accessLevel     "FREE" | "PRO"
isPublished     bool
```

**PracticeAttempt**
```
id              BigInt (PK)
publicId        UUID (used in client-facing URLs)
userId          FK → User
testId          FK → Test
mode            "FULL_TEST" | "PRACTICE"
status          "IN_PROGRESS" | "COMPLETED"
correctCount    int
totalCount      int
scaledScore     nullable int (5-990, for full tests only)
durationSeconds int
startedAt       timestamp
completedAt     nullable timestamp
```

**AttemptAnswer**
```
attemptId       FK → PracticeAttempt  ┐ composite PK
questionId      FK → Question         ┘
selectedAnswer  nullable char ('A'|'B'|'C'|'D') — null = skipped
isCorrect       bool
isFlagged       bool
```

**ExploreCollection**
```
id              int (PK)
slug            unique
source          "study4" | "zenlish" | ...
title           string
category        string
level           string
wordCount       int
isPublished     bool
sortOrder       int
```

---

## API Reference

All routes are prefixed with `/api`. The backend runs on port 2409.

### Auth

| Method | Endpoint | Rate limit | Description |
|--------|----------|-----------|-------------|
| POST | `/auth/register` | 3/60s | Register with email + password |
| POST | `/auth/verify-email` | 5/60s | Verify email with token from link |
| POST | `/auth/resend-verification` | 3/60s | Resend verification email |
| POST | `/auth/login` | 5/60s | Login with email + password |
| POST | `/auth/google` | 10/60s | Login/register with Google code |
| GET  | `/auth/bootstrap` | 60/60s | Get session from refresh cookie (page load) |
| POST | `/auth/refresh` | 20/60s | Refresh access token |
| POST | `/auth/logout` | 20/60s | Revoke refresh token |
| POST | `/auth/forgot-password` | 3/60s | Send password reset email |
| POST | `/auth/verify-reset-otp` | 5/60s | Verify reset OTP |
| POST | `/auth/reset-password` | 3/60s | Set new password |

### Practice

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/practice/tests` | No | List all published tests (cached 60s) |
| GET | `/practice/tests/me` | Yes | Tests with user attempt history |
| GET | `/practice/tests/:slug` | No | Single test details |
| GET | `/practice/tests/:slug/questions` | Yes | All questions for a test |
| POST | `/practice/tests/:slug/attempts` | Yes | Submit a completed attempt |
| GET | `/practice/tests/:slug/attempts/latest` | Yes | Latest attempt result |
| GET | `/practice/tests/:slug/attempts/:id` | Yes | Specific attempt result |
| GET | `/practice/attempts/recent` | Yes | Recent 20 attempts across all tests |
| GET | `/practice/stats/me` | Yes | Overall stats (accuracy, best score, etc.) |

### Explore

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/explore/collections` | No | Browse collections |
| GET | `/explore/collections/:slug` | No | Collection details + words |
| POST | `/explore/progress/:collectionId` | Yes | Update study progress |

### Vocabulary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vocabulary` | Yes | User's word list |
| POST | `/vocabulary` | Yes | Add a word |
| PATCH | `/vocabulary/:id` | Yes | Update a word |
| DELETE | `/vocabulary/:id` | Yes | Remove a word |

### Profile & Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Yes | Get own profile |
| PATCH | `/profile` | Yes | Update profile |
| GET | `/comments/tests/:testId` | No | Get threaded comments for a test |
| POST | `/comments/tests/:testId` | Yes | Post a comment |
| PATCH | `/comments/:id` | Yes | Edit own comment |
| DELETE | `/comments/:id` | Yes | Delete own comment (soft delete) |

---

## Frontend Routes

All protected routes redirect to `/login` if no session is found.

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Landing page |
| `/login` | No | Login / sign up |
| `/verify-email` | No | Email verification from link |
| `/forgot-password` | No | Password reset request |
| `/practice` | Yes | Test catalog |
| `/practice/[testId]/start` | Yes | Pre-test screen (confirm, select mode) |
| `/practice/[testId]/test` | Yes | Full-screen test interface |
| `/practice/[testId]/results/latest` | Yes | Latest result for this test |
| `/practice/[testId]/results/[attemptId]` | Yes | Specific attempt review |
| `/explore` | Yes | Browse vocabulary collections |
| `/explore/[slug]` | Yes | Collection word list |
| `/explore/[slug]/review` | Yes | Flashcard study mode |
| `/vocabulary` | Yes | Personal word list |
| `/progress` | Yes | Learning stats dashboard |
| `/profile` | Yes | User profile |
| `/profile/edit` | Yes | Edit profile |

### How data flows from server to client

```
Page visit (e.g. /practice)
      │
      ▼
Next.js Server Component (async)
      │
      ├── fetchAuthBootstrap()  →  GET /auth/bootstrap  (from cookie)
      │     Returns: { user, profile } or null
      │
      └── fetchPracticeTests()  →  GET /practice/tests
            Returns: test catalog (ISR cached on CDN)
                  │
                  ▼
            Render HTML with data baked in
                  │
                  ▼
            Client hydrates → React Query takes over for mutations/refetches
```

---

## Deployment

### Local development

```bash
npm run db:up          # Start PostgreSQL + Redis via Docker
npm run dev:backend    # NestJS with hot reload (:2409)
npm run dev:frontend   # Next.js dev server (:6868)
```

### Backend Docker build

```bash
cd back-end
docker build -t toeic-green-api .
docker run -p 2409:2409 --env-file .env.production toeic-green-api
```

The Dockerfile uses a multi-stage build:
1. **builder** stage — installs all deps, compiles TypeScript with SWC, generates Prisma client
2. **runner** stage — copies only compiled output and production node_modules (no dev tooling)

### Production environment (live)

The app is **live at [https://toeicgreen.com](https://toeicgreen.com)**. Here is the actual production setup powering it:

| Concern | Service | Details |
|---------|---------|---------|
| Domain registrar / DNS | **Hostinger** | `toeicgreen.com` is bought and DNS-managed here |
| Frontend hosting | **Vercel** | Next.js app (project root `front-end`), served at `toeicgreen.com` |
| Backend hosting | **AWS EC2** | One ARM64 `t4g.small` in `ap-northeast-1`; Caddy terminates TLS and proxies the NestJS container at `api.toeicgreen.com` |
| Database | **Supabase** (PostgreSQL) | Runtime via PgBouncer pooler (`:6543`, `pgbouncer=true`); migrations via direct connection (`:5432`) |
| Cache / Rate limiting | **Process memory** | Current single-process rate-limit counters; optional Redis mode is retained for future horizontal scaling |
| File storage | **Cloudflare R2** | Images & audio, served from a public CDN origin |
| Email | **Resend** | Domain verified; sends from `no-reply@toeicgreen.com` |
| Secrets | **AWS SSM Parameter Store** | SecureString values rendered on EC2 during deployment; runtime env files are not committed |

#### Domain & DNS (Hostinger)

Both the frontend and the API live under the **same registrable domain** (`toeicgreen.com`). This is required so the `SameSite=Strict` refresh-token cookie (scoped to `Domain=.toeicgreen.com`) is sent to both the web app and the API.

| Record | Host | Points to | Purpose |
|--------|------|-----------|---------|
| `A` | `@` | Vercel IP | `toeicgreen.com` → frontend (Vercel) |
| `CNAME` | `www` | `toeicgreen.com` | `www` alias |
| `A` | `api` | AWS Elastic IPv4 | `api.toeicgreen.com` → Caddy on EC2 |
| `A` | `aws-api` | AWS Elastic IPv4 | Retained operational/staging hostname for independent verification |
| `TXT` / `MX` | Resend records | Resend | DKIM / SPF / DMARC for email deliverability |

> Current status is in [`docs/production-status.md`](docs/production-status.md).
> The authoritative deploy, verification, rollback, and maintenance procedure is
> [`back-end/deploy/aws/README.md`](back-end/deploy/aws/README.md).

#### AWS runtime configuration

- One EC2 instance and one API process are currently deployed; this topology is
  not high availability.
- Caddy and the API run through the production Compose definition under
  `back-end/deploy/aws/`.
- Releases are immutable and tagged from an audited 40-character Git SHA.
- The deploy script renders SSM secrets, builds the API and migrator, runs
  `prisma migrate deploy`, applies health gates, and preserves rollback evidence
  when routing verification fails.
- Legacy provider scripts remain in `back-end/deploy/` for history or an
  explicitly planned recovery; they are not the current production path.

### Seeding

```bash
cd back-end
npm run seed:toeic         # Insert TOEIC test data from toeic-crawler output
npm run seed:flashcards    # Insert vocabulary collections
npm run r2:flashcards      # Upload word images and audio to Cloudflare R2
```

---

## Development Notes

**Checking DB with Prisma Studio:**
```bash
cd back-end
npx prisma studio      # Opens visual DB browser at localhost:5555
```

**Running a migration after schema change:**
```bash
npx prisma migrate dev --name describe-your-change
npm run prisma:generate
```

**Resetting the local database:**
```bash
npx prisma migrate reset    # Drops and re-applies all migrations + seeds
```
