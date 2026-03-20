# druzi

A private social platform for staying connected with close friends through photos, music, goals, and daily moments.

## Features

### Social Feed

- **Photo & Video Posts**: Share moments with friends using front/back camera capture
- **Reactions**: React to posts with kaomoji (´・ω・`)
- **Comments**: Have conversations on posts
- **Location Tags**: Add location context to your posts
- **Link Sharing**: Attach links with previews

### Music Sharing

- **Spotify Integration**: Search and share songs from Spotify
- **Mood Tags**: Tag songs with kaomoji moods (energized, chill, in my feels, etc.)
- **Music Feed**: See what your friends are listening to

### Goals & Achievements

- **Set Goals**: Create goals with target counts and optional deadlines
- **Track Progress**: Log achievements with proof posts (photos/videos)
- **Friend Support**: Get cheers from friends on your goals
- **Visibility Control**: Keep goals private or share with friends

### Collaborative Lists

- **Shared Lists**: Create lists that friends can contribute to
- **Use Cases**: Movie recommendations, restaurant wishlist, book clubs, etc.
- **Voting**: Mark items as completed
- **Activity Feed**: See recent list updates

### Notifications

- **Push Notifications**: Web push support for daily reminders and friend activity
- **Customizable**: Control which notifications you receive
- **Daily Reminders**: Get prompted to share or check in

### User Features

- **Invite-Only**: Controlled growth through invite codes
- **User Profiles**: Avatars, birthdays, and user info
- **Admin Dashboard**: Stats, activity monitoring, and user management
- **Secure Auth**: JWT + refresh tokens with HTTPS enforcement

## Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite for build tooling
- CSS Modules for styling
- Camera API for photo/video capture

**Backend:**

- Node.js + Express
- SQLite + Drizzle ORM
- JWT authentication with refresh tokens
- Web Push API for notifications
- Spotify Web API integration

**Deployment:**

- Docker (single container)
- Multi-stage build
- Production-optimized

## Project Structure

```
.
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # API client
│   │   ├── styles/        # CSS modules
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth & security
│   │   └── db/            # Database schema
│   ├── drizzle/           # Migrations
│   └── package.json
├── Dockerfile         # Production build
└── package.json       # Workspace root
```

## Development Setup

### Prerequisites

- Node.js 20+
- npm

### 1. Install Dependencies

```bash
npm install
```

### 2. Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# Admin setup
ADMIN_PASSWORD=your-admin-password

# Web Push (generate with: npm run generate-vapid)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Spotify API (optional, for music sharing)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

### 3. Run Development Servers

```bash
# Both frontend and backend
npm run dev

# Or separately:
npm run dev:frontend  # Frontend: http://localhost:5173
npm run dev:backend   # Backend: http://localhost:3000
```

### 4. First-time Setup

1. Navigate to http://localhost:5173
2. Create the admin account (username: `admin`)
3. Generate invite codes in the admin panel
4. Use invite codes to register new users

## Production Deployment

### Docker Build

```bash
docker build -t druzi .
```

### Run Container

```bash
docker run -d \
  -p 80:80 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e ADMIN_PASSWORD=your-admin-password \
  -e VAPID_PUBLIC_KEY=your-key \
  -e VAPID_PRIVATE_KEY=your-key \
  -e VAPID_SUBJECT=mailto:you@example.com \
  druzi
```

### Environment Variables

All backend environment variables are required in production. Use Docker volumes to persist:

- `/app/data` - SQLite database
- `/app/uploads` - User-uploaded media

### HTTPS Enforcement

The app enforces HTTPS in production when behind a reverse proxy. Ensure your proxy sets the `X-Forwarded-Proto` header.

## Scripts

```bash
# Development
npm run dev              # Run both frontend & backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build            # Build both frontend & backend
npm run build:frontend   # Frontend only
npm run build:backend    # Backend only

# Code Quality
npm run lint             # Lint all code
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run test             # Run tests
```

## API Overview

The backend exposes a RESTful API at `/api/*`:

### Authentication

- `POST /api/auth/register` - Register new user (requires invite code)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Posts & Feed

- `GET /api/feed` - Get feed of posts
- `POST /api/posts` - Create post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/react` - Add reaction
- `POST /api/posts/:id/comments` - Add comment

### Music

- `GET /api/music/search` - Search Spotify
- `POST /api/music` - Share a song
- `GET /api/music/recent` - Recent music shares

### Goals

- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `POST /api/goals/:id/achieve` - Log achievement
- `POST /api/goals/:id/cheer` - Send cheer

### Lists

- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create list
- `POST /api/lists/:id/items` - Add item to list

### Moods

- `GET /api/moods/today` - Get today's mood
- `POST /api/moods/today` - Set today's mood
- `GET /api/moods/history` - Get mood history

### Admin (requires admin role)

- `GET /api/admin/stats` - Platform statistics
- `POST /api/admin/invite-codes` - Generate invite codes
- `GET /api/admin/users` - Manage users

Full API documentation available at `GET /api`

## Contributing

This is a private project. When contributing:

1. Follow existing code style (enforced by ESLint/Prettier)
2. Write tests for new features
3. Keep commits atomic and descriptive
4. Pre-commit hooks will run linting and formatting

## License

Private - All Rights Reserved
