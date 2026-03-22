# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**druzi** is a private social platform for staying connected with close friends through photos, music, goals, and daily moments. It's an invite-only platform with JWT authentication, web push notifications, and Spotify integration.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, CSS Modules
- **Backend**: Node.js + Express, SQLite + Drizzle ORM
- **Deployment**: Docker (multi-stage build)

## Development Commands

### Running the Application

```bash
# Run both frontend and backend in development
npm run dev

# Run individually
npm run dev:frontend  # Frontend: http://localhost:5173
npm run dev:backend   # Backend: http://localhost:3000
```

### Building

```bash
# Build both frontend and backend
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm run test:frontend
npm run test:backend
```

### Code Quality

```bash
# Lint all code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Database Management

```bash
# Generate Drizzle migrations (from backend directory)
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio
```

## Project Architecture

### Workspace Structure

This is a monorepo using npm workspaces with two main packages:

- **frontend/**: React application (Vite + TypeScript)
- **backend/**: Express API server (TypeScript + Drizzle ORM)

### Backend Architecture

**Entry Point**: `backend/src/index.ts` → imports `app.ts` and starts server on port 3000

**Key Layers**:

1. **Routes** (`src/routes/`): Express route handlers
   - Auth, posts, feed, users, notifications, admin, music, lists, uploads

2. **Services** (`src/services/`): Business logic layer
   - `auth.service.ts`: User authentication, invite codes, JWT/refresh token management
   - `post.service.ts`: Post creation, reactions, comments
   - `user.service.ts`: User profile management
   - `notification.service.ts`: Web push notifications, daily reminders (cron jobs)
   - `music.service.ts`: Spotify API integration
   - `list.service.ts`: Collaborative list management

3. **Middleware** (`src/middleware/`):
   - `auth.ts`: JWT token verification, adds `req.user` to Express Request
   - `admin.ts`: Admin role verification
   - `https.ts`: HTTPS enforcement in production (behind reverse proxy)
   - `upload.ts`: Multer configuration for file uploads

4. **Database** (`src/db/`):
   - `schema.ts`: Drizzle ORM schema definitions (users, posts, media, reactions, comments, etc.)
   - `index.ts`: Database initialization
   - Database file: `data/druzi.db` (SQLite)

**Authentication Flow**:

- JWT access tokens (short-lived) + refresh tokens (long-lived, stored hashed in DB)
- Access token in `Authorization: Bearer <token>` header
- Refresh endpoint: `POST /api/auth/refresh` with refresh token in body
- `authMiddleware` verifies access tokens and populates `req.user`

**File Uploads**:

- Avatars: `uploads/avatars/`
- Post media: `uploads/media/`
- Served via authenticated routes: `/uploads/*` (requires token)

### Frontend Architecture

**Entry Point**: `frontend/src/main.tsx` → renders `App.tsx`

**Key Components**:

1. **Context** (`src/contexts/`):
   - `AuthContext.tsx`: Global auth state, token management, auto-refresh logic

2. **API Client** (`src/services/api/`):
   - `client.ts`: Axios wrapper with auth token injection and refresh logic
   - API modules: `auth.ts`, `posts.ts`, `users.ts`, `notifications.ts`, `music.ts`, `lists.ts`, `admin.ts`

3. **Components** organized by feature:
   - `auth/`: Login/registration screens
   - `feed/`: Post feed, create post, reactions, comments
   - `profile/`: User profiles, calendar, archive gallery
   - `admin/`: Admin dashboard, user management, invite codes, testing tools
   - `music/`: Spotify search, music sharing
   - `lists/`: Collaborative lists, list items
   - `camera/`: Camera capture for posts (front/back camera support)
   - `layout/`: Header, navigation, footer
   - `common/`: Shared components (avatars, media, loading, errors)

4. **Hooks** (`src/hooks/`):
   - `useCamera.ts`: Camera API integration
   - `useVideoRecording.ts`: Video recording
   - `useBeRealCapture.ts`: Front + back camera simultaneous capture
   - `useNotifications.ts`: Web push notification subscription
   - `useAuthenticatedMedia.ts`: Fetch media with auth tokens

**Navigation**: Single-page app with state-based navigation (no router)

- Nav modes: `feed`, `profile`, `admin`
- Managed in `App.tsx` via `activeNav` state

### Database Schema

Key tables:

- `users`: User accounts (username, displayName, avatar, passwordHash, birthday)
- `posts`: User posts (text, location, linkUrl)
- `media`: Photos/videos attached to posts (filename, mimeType, width, height, durationMs)
- `reactions`: Kaomoji reactions to posts
- `comments`: Comments on posts
- `musicShares`: Spotify track shares with mood kaomoji
- `lists` + `listItems`: Collaborative lists
- `inviteCodes`: Invite code system (used/unused, expiration)
- `refreshTokens`: Refresh token storage (hashed)
- `pushSubscriptions`: Web push notification endpoints
- `notificationPreferences`: Per-user notification settings

All tables use text IDs (nanoid) except for junction/preference tables.

## Environment Configuration

### Backend `.env` (required)

Located at `backend/.env`:

```env
PORT=3000
NODE_ENV=development

# JWT secrets (change in production!)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Admin password
ADMIN_PASSWORD=your-admin-password

# Web Push (generate with web-push library)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Spotify API (optional)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

## Docker Deployment

**Multi-stage build**:

1. Stage 1: Build frontend (Vite production build)
2. Stage 2: Build backend (TypeScript compilation)
3. Stage 3: Production image (Node 22 Alpine)
   - Frontend assets copied to `public/` directory
   - Backend serves frontend in production via `express.static`
   - Exposes port 80

**Persistent volumes needed**:

- `/app/data` - SQLite database
- `/app/uploads` - User-uploaded media (avatars, post media)

**Build and run**:

```bash
docker build -t druzi .
docker run -d -p 80:80 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  druzi
```

## Important Development Notes

### First-Time Setup

1. Install dependencies: `npm install`
2. Create `backend/.env` with required variables
3. Start dev servers: `npm run dev`
4. Navigate to http://localhost:5173
5. Create admin account (username must be "admin")
6. Generate invite codes in admin panel
7. Use invite codes to register additional users

### Admin Account

- Username must be exactly `admin` (hardcoded in `backend/src/routes/auth.ts`)
- Admin role checked via `ADMIN_USERNAME` constant (`admin`)
- Admin middleware: `backend/src/middleware/admin.ts`
- Admin-only features: user management, invite codes, platform stats, testing tools

### Security Considerations

- HTTPS enforced in production via `httpsEnforcement` middleware (checks `X-Forwarded-Proto` header)
- JWT access tokens: short-lived (15 min default)
- Refresh tokens: long-lived (7 days default), stored hashed in DB
- Passwords hashed with bcrypt
- File uploads sanitized and processed with Sharp (images)
- CORS enabled for development

### Notification System

- Web Push API for browser notifications
- Cron job for daily reminders (time randomized daily)
- Notification preferences per user
- VAPID keys required for web push

### API Structure

All API routes under `/api/*`:

- `/api/auth/*` - Authentication (register, login, refresh, invite)
- `/api/posts/*` - Post CRUD, reactions, comments
- `/api/feed` - Combined feed of posts and music
- `/api/users/*` - User profiles
- `/api/music/*` - Spotify search and music sharing
- `/api/lists/*` - Collaborative lists
- `/api/notifications/*` - Push subscription management
- `/api/admin/*` - Admin operations

Uploads served via `/uploads/*` (requires authentication).

## Testing

- Frontend tests: Vitest + React Testing Library
- Backend tests: Vitest
- Test files: `*.test.ts` or `*.test.tsx` (co-located with source)
- Test setup: `src/test/setup.ts` in each workspace
