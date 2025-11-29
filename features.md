# Implementation Plan: New Features

This document details all the features that were implemented in the batch change. Use this as an implementation plan to re-implement features incrementally and in a controlled manner.

---

## Table of Contents

1. [Overview](#overview)
2. [Feature 1: Music Moments](#feature-1-music-moments)
3. [Feature 2: Hangouts / Meetup Proposals](#feature-2-hangouts--meetup-proposals)
4. [Feature 3: Shared Lists](#feature-3-shared-lists)
5. [Infrastructure Changes](#infrastructure-changes)
6. [Implementation Order Recommendation](#implementation-order-recommendation)
7. [File Inventory](#file-inventory)

---

## Overview

Three major features were implemented:

| Feature           | Description                                                             | Complexity |
| ----------------- | ----------------------------------------------------------------------- | ---------- |
| **Music Moments** | Share what you're listening to with posts, profile "On Repeat" section  | Medium     |
| **Hangouts**      | Propose meetups, RSVP system, visibility controls                       | High       |
| **Shared Lists**  | Collaborative lists (watch, eat, music, read, custom), voting, claiming | High       |

### Stats Summary

- **New Backend Files**: 8 files
- **New Frontend Components**: 16 files
- **New Database Tables**: 8 tables
- **New API Endpoints**: ~25 endpoints
- **New CSS Rules**: ~1300 lines

---

## Feature 1: Music Moments

### Description

Allow users to share what they're listening to. Music can be:

- Attached to posts
- Displayed on user profiles as "On Repeat" (most recent 3 tracks)
- Searched via Spotify API integration

### Database Schema

```sql
CREATE TABLE `music_shares` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `post_id` text,                    -- NULL if standalone share
  `spotify_track_id` text,
  `track_name` text NOT NULL,
  `artist_name` text NOT NULL,
  `album_name` text,
  `album_art_url` text,
  `preview_url` text,                -- 30-sec Spotify preview
  `external_url` text,               -- Spotify link
  `mood_kaomoji` text,               -- e.g. "(ノ◕ヮ◕)ノ♪"
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
);
```

### API Endpoints

| Method | Endpoint                      | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/music/search?q={query}` | Search Spotify for tracks                |
| GET    | `/api/music/recent`           | Get recent music shares from all users   |
| POST   | `/api/music`                  | Create a new music share                 |
| GET    | `/api/music/:id`              | Get a specific music share               |
| DELETE | `/api/music/:id`              | Delete own music share                   |
| GET    | `/api/music/spotify/status`   | Check if Spotify is configured           |
| GET    | `/api/users/:id/music`        | Get user's "On Repeat" (recent 3 shares) |

### Backend Services

**`spotify.service.ts`** - Spotify API integration:

- Uses Client Credentials flow (no user login required)
- Token caching with automatic refresh
- Functions: `searchTracks()`, `getTrack()`, `isSpotifyConfigured()`

**`music.service.ts`** - Music share CRUD:

- `createMusicShare()` - Create new share (optionally attached to post)
- `getRecentMusicShares()` - Get feed of recent shares
- `getUserOnRepeat()` - Get user's top 3 recent shares
- `getMusicShareById()` - Get single share with user info
- `getMusicShareByPostId()` - Get share attached to a post
- `deleteMusicShare()` - Delete (owner only)
- `getMusicSharesForPosts()` - Batch fetch for enriching feed

### Frontend Components

| Component         | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `MusicPicker.tsx` | Modal for searching and selecting tracks, mood selection |
| `MusicShare.tsx`  | Display a music share card (full and compact modes)      |
| `OnRepeat.tsx`    | Profile section showing user's recent 3 shares           |
| `index.ts`        | Barrel export                                            |

### Configuration

Requires environment variables:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

### Type Definitions

```typescript
interface MusicShare {
  id: string;
  userId: string;
  postId: string | null;
  spotifyTrackId: string | null;
  trackName: string;
  artistName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  moodKaomoji: string | null;
  createdAt: Date;
  user?: UserInfo;
}

interface SpotifyTrack {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  externalUrl: string;
}

const MUSIC_MOOD_KAOMOJIS = [
  { kaomoji: '(ノ◕ヮ◕)ノ♪', label: 'Energized' },
  { kaomoji: '(︶｡︶✽)', label: 'Chill' },
  { kaomoji: '(；へ；)', label: 'In my feels' },
  { kaomoji: '(◕‿◕)♡', label: 'Romantic' },
  { kaomoji: '(⌐■_■)', label: 'Cool' },
  { kaomoji: '(╯°□°)╯', label: 'Intense' },
];
```

### UI/UX Details

- **Create Post Flow**: Added "~> Music" button to select a track to attach
- **Music Preview**: Shows attached track with album art in compose mode
- **Profile Section**: "On Repeat" displays below profile header
- **30-sec Preview**: Play button on album art (uses Spotify preview URL)

---

## Feature 2: Hangouts / Meetup Proposals

### Description

Allow users to propose casual meetups with their friends. Features:

- Create hangout proposals with optional time/location
- Time flexibility options: exact, flexible (~ish), open (sometime?)
- RSVP system: In, Maybe, Out (with kaomoji)
- Visibility controls (all friends or specific invites)
- Status progression: proposed → confirmed → completed

### Database Schema

```sql
-- Main hangout table
CREATE TABLE `hangouts` (
  `id` text PRIMARY KEY NOT NULL,
  `creator_id` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `location` text,
  `scheduled_at` integer,
  `time_flexibility` text DEFAULT 'flexible',  -- 'exact' | 'flexible' | 'open'
  `visibility` text DEFAULT 'all',             -- 'all' | 'specific'
  `status` text DEFAULT 'proposed',            -- 'proposed' | 'confirmed' | 'completed' | 'cancelled'
  `created_at` integer NOT NULL,
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- For 'specific' visibility
CREATE TABLE `hangout_invites` (
  `id` text PRIMARY KEY NOT NULL,
  `hangout_id` text NOT NULL,
  `user_id` text NOT NULL,
  FOREIGN KEY (`hangout_id`) REFERENCES `hangouts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- RSVP responses
CREATE TABLE `hangout_rsvps` (
  `id` text PRIMARY KEY NOT NULL,
  `hangout_id` text NOT NULL,
  `user_id` text NOT NULL,
  `status` text NOT NULL,   -- 'in' | 'maybe' | 'out'
  `created_at` integer NOT NULL,
  FOREIGN KEY (`hangout_id`) REFERENCES `hangouts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### API Endpoints

| Method | Endpoint                 | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| GET    | `/api/hangouts`          | Get all active hangouts visible to user |
| GET    | `/api/hangouts/:id`      | Get specific hangout with RSVPs         |
| POST   | `/api/hangouts`          | Create new hangout proposal             |
| PATCH  | `/api/hangouts/:id`      | Update hangout (creator only)           |
| DELETE | `/api/hangouts/:id`      | Delete/cancel hangout (creator only)    |
| POST   | `/api/hangouts/:id/rsvp` | RSVP to a hangout                       |

### Backend Service Functions

**`hangout.service.ts`**:

- `createHangout()` - Create with optional specific invites
- `getVisibleHangouts()` - Get hangouts based on visibility rules
- `getHangoutById()` - Get with creator info and all RSVPs
- `updateHangout()` - Update status, details (creator only)
- `deleteHangout()` - Soft delete via status = 'cancelled'
- `rsvpToHangout()` - Create/update RSVP
- `canViewHangout()` - Visibility permission check

### Frontend Components

| Component           | Purpose                           |
| ------------------- | --------------------------------- |
| `HangoutsList.tsx`  | Main hangouts page with list view |
| `HangoutCard.tsx`   | Single hangout display with RSVPs |
| `CreateHangout.tsx` | Modal for creating new hangout    |
| `RsvpButtons.tsx`   | RSVP button group with kaomoji    |
| `index.ts`          | Barrel export                     |

### Type Definitions

```typescript
type HangoutStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';
type TimeFlexibility = 'exact' | 'flexible' | 'open';
type RsvpStatus = 'in' | 'maybe' | 'out';

interface Hangout {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduledAt: Date | null;
  timeFlexibility: TimeFlexibility;
  visibility: 'all' | 'specific';
  status: HangoutStatus;
  createdAt: Date;
  creator?: UserInfo;
  rsvps?: HangoutRsvp[];
}

interface HangoutRsvp {
  id: string;
  hangoutId: string;
  userId: string;
  status: RsvpStatus;
  createdAt: Date;
  user?: UserInfo;
}

const RSVP_KAOMOJIS: Record<RsvpStatus, { kaomoji: string; label: string }> = {
  in: { kaomoji: '(◕‿◕)', label: "I'm in!" },
  maybe: { kaomoji: '(；一_一)', label: 'Maybe...' },
  out: { kaomoji: '(╥﹏╥)', label: "Can't make it" },
};
```

### UI/UX Details

- **Navigation**: New "HANGS" nav item in header
- **Empty State**: Friendly kaomoji with "Propose a Hang" CTA
- **Time Display**: Shows "~ish" or "sometime?" based on flexibility
- **RSVP Summary**: Shows grouped counts with usernames for "in"
- **Creator Actions**: Confirm, Mark as Done, Cancel buttons

---

## Feature 3: Shared Lists

### Description

Collaborative lists for groups. Features:

- List types: watch, eat, music, read, custom (with icons)
- Add items with title, subtitle, note, external link
- Vote on items (upvote system)
- Mark items complete with optional review and rating
- Gift list mode: hide from specific user, claim items
- Visibility controls: all, specific collaborators, private

### Database Schema

```sql
-- Main list table
CREATE TABLE `lists` (
  `id` text PRIMARY KEY NOT NULL,
  `creator_id` text NOT NULL,
  `title` text NOT NULL,
  `type` text NOT NULL,              -- 'watch' | 'eat' | 'music' | 'read' | 'custom'
  `visibility` text DEFAULT 'all',   -- 'all' | 'specific' | 'private'
  `hidden_from_user_id` text,        -- For gift lists
  `created_at` integer NOT NULL,
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hidden_from_user_id`) REFERENCES `users`(`id`)
);

-- For 'specific' visibility
CREATE TABLE `list_collaborators` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL,
  `user_id` text NOT NULL,
  FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- List items
CREATE TABLE `list_items` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL,
  `added_by_id` text NOT NULL,
  `title` text NOT NULL,
  `subtitle` text,                   -- artist, location, author, etc.
  `note` text,                       -- recommendation note
  `external_url` text,
  `image_url` text,
  `completed` integer DEFAULT 0,
  `completed_by_id` text,
  `completed_note` text,             -- mini review
  `rating` integer,                  -- 1-5 stars
  `claimed_by_id` text,              -- for gift lists
  `order` integer DEFAULT 0,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`added_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`completed_by_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`claimed_by_id`) REFERENCES `users`(`id`)
);

-- Item upvotes
CREATE TABLE `list_item_votes` (
  `id` text PRIMARY KEY NOT NULL,
  `item_id` text NOT NULL,
  `user_id` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`item_id`) REFERENCES `list_items`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### API Endpoints

| Method | Endpoint                             | Description                       |
| ------ | ------------------------------------ | --------------------------------- |
| GET    | `/api/lists`                         | Get all lists visible to user     |
| GET    | `/api/lists/:id`                     | Get list with all items           |
| POST   | `/api/lists`                         | Create new list                   |
| PATCH  | `/api/lists/:id`                     | Update list (creator only)        |
| DELETE | `/api/lists/:id`                     | Delete list (creator only)        |
| POST   | `/api/lists/:id/items`               | Add item to list                  |
| PATCH  | `/api/lists/:id/items/:itemId`       | Update item (complete, rating)    |
| DELETE | `/api/lists/:id/items/:itemId`       | Delete item                       |
| POST   | `/api/lists/:id/items/:itemId/vote`  | Toggle vote on item               |
| POST   | `/api/lists/:id/items/:itemId/claim` | Toggle claim on item (gift lists) |

### Backend Service Functions

**`list.service.ts`**:

- `createList()` - Create with optional collaborators
- `getVisibleLists()` - Get lists based on visibility rules
- `getListById()` - Get with items, votes, user info
- `updateList()` - Update title, visibility (creator only)
- `deleteList()` - Delete (creator only)
- `addListItem()` - Add item to list
- `updateListItem()` - Mark complete, add review/rating
- `deleteListItem()` - Delete (adder or creator only)
- `voteForItem()` - Toggle vote
- `claimItem()` - Toggle claim for gift lists
- `canViewList()` / `canAddToList()` - Permission checks

### Frontend Components

| Component          | Purpose                              |
| ------------------ | ------------------------------------ |
| `ListsBrowser.tsx` | Main lists page with grid view       |
| `ListDetail.tsx`   | Single list view with items          |
| `ListCard.tsx`     | List card for grid view              |
| `ListItem.tsx`     | Single item with vote/claim/complete |
| `CreateList.tsx`   | Modal for creating new list          |
| `AddListItem.tsx`  | Modal for adding items               |
| `index.ts`         | Barrel export                        |

### Type Definitions

```typescript
type ListType = 'watch' | 'eat' | 'music' | 'read' | 'custom';
type ListVisibility = 'all' | 'specific' | 'private';

interface List {
  id: string;
  creatorId: string;
  title: string;
  type: ListType;
  visibility: ListVisibility;
  hiddenFromUserId: string | null;
  createdAt: Date;
  creator?: UserInfo;
  items?: ListItem[];
  itemCount?: number;
}

interface ListItem {
  id: string;
  listId: string;
  addedById: string;
  title: string;
  subtitle: string | null;
  note: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  completed: boolean;
  completedById: string | null;
  completedNote: string | null;
  rating: number | null;
  claimedById: string | null;
  order: number;
  createdAt: Date;
  addedBy?: UserInfo;
  completedBy?: UserInfo;
  claimedBy?: UserInfo;
  votes?: number;
  hasVoted?: boolean;
}

const LIST_TYPE_INFO: Record<ListType, { icon: string; label: string }> = {
  watch: { icon: '▶', label: 'Watch Together' },
  eat: { icon: '◎', label: 'Places to Try' },
  music: { icon: '♪', label: 'Music Recs' },
  read: { icon: '◇', label: 'Reading List' },
  custom: { icon: '#', label: 'Custom List' },
};
```

### UI/UX Details

- **Navigation**: New "LISTS" nav item in header
- **Type Selection**: Icon grid for choosing list type
- **Item Display**: Checkbox, title, subtitle, note, vote button
- **Complete Flow**: Modal for adding review + 1-5 star rating
- **Gift Mode**: "(secret gift list)" notice, claim buttons
- **Completed Section**: Separated at bottom with divider

---

## Infrastructure Changes

### Navigation Update

**NavMode type** expanded:

```typescript
type NavMode = 'feed' | 'hangs' | 'lists' | 'profile' | 'admin';
```

**Header.tsx** - Added two new nav buttons:

- `HANGS` → `onNavChange('hangs')`
- `LISTS` → `onNavChange('lists')`

### App.tsx Routing

```tsx
{
  activeNav === 'hangs' && <HangoutsList token={token} userId={user.id} />;
}
{
  activeNav === 'lists' && <ListsBrowser token={token} userId={user.id} />;
}
```

### Backend Routes Registration

**app.ts** additions:

```typescript
import musicRoutes from './routes/music.js';
import hangoutsRoutes from './routes/hangouts.js';
import listsRoutes from './routes/lists.js';

app.use('/api/music', musicRoutes);
app.use('/api/hangouts', hangoutsRoutes);
app.use('/api/lists', listsRoutes);
```

### Configuration

**config.ts** additions:

```typescript
spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
```

### CreatePost Integration

Music integration added to post creation flow:

- New "~> Music" button in selection mode
- `selectedTrack` and `selectedMood` state
- Music preview component in compose mode
- Creates music share attached to post after post creation

---

## Implementation Order Recommendation

### Phase 1: Music Moments (Lowest Dependencies)

**Order:**

1. Database: Add `music_shares` table
2. Backend: `spotify.service.ts` (external API)
3. Backend: `music.service.ts` (CRUD)
4. Backend: `music.ts` routes
5. Backend: Add route to `app.ts`
6. Backend: Add config for Spotify credentials
7. Frontend: Types in `types/index.ts`
8. Frontend: API functions in `services/api.ts`
9. Frontend: `MusicShare.tsx` (display component)
10. Frontend: `MusicPicker.tsx` (search/select)
11. Frontend: `OnRepeat.tsx` (profile section)
12. Frontend: Integrate into Profile component
13. Frontend: Integrate into CreatePost component
14. CSS: Add music styles

**Why First:**

- No dependencies on other new features
- Spotify integration is self-contained
- Can be tested independently

### Phase 2: Hangouts (Medium Dependencies)

**Order:**

1. Database: Add `hangouts`, `hangout_invites`, `hangout_rsvps` tables
2. Backend: `hangout.service.ts`
3. Backend: `hangouts.ts` routes
4. Backend: Add route to `app.ts`
5. Frontend: Types (Hangout, Rsvp, etc.)
6. Frontend: API functions
7. Frontend: `RsvpButtons.tsx`
8. Frontend: `HangoutCard.tsx`
9. Frontend: `CreateHangout.tsx`
10. Frontend: `HangoutsList.tsx`
11. Frontend: Add to navigation + routing
12. CSS: Add hangouts styles

**Why Second:**

- More tables but straightforward relationships
- RSVP system is contained within feature

### Phase 3: Shared Lists (Highest Complexity)

**Order:**

1. Database: Add `lists`, `list_collaborators`, `list_items`, `list_item_votes` tables
2. Backend: `list.service.ts`
3. Backend: `lists.ts` routes
4. Backend: Add route to `app.ts`
5. Frontend: Types (List, ListItem, etc.)
6. Frontend: API functions
7. Frontend: `ListItem.tsx`
8. Frontend: `ListCard.tsx`
9. Frontend: `AddListItem.tsx`
10. Frontend: `CreateList.tsx`
11. Frontend: `ListDetail.tsx`
12. Frontend: `ListsBrowser.tsx`
13. Frontend: Add to navigation + routing
14. CSS: Add lists styles

**Why Last:**

- Most complex data model (4 tables)
- Most frontend components
- Gift list logic adds complexity

---

## File Inventory

### New Backend Files (8)

```
backend/src/routes/
├── hangouts.ts          (174 lines)
├── lists.ts             (234 lines)
└── music.ts             (131 lines)

backend/src/services/
├── hangout.service.ts   (311 lines)
├── list.service.ts      (466 lines)
├── music.service.ts     (159 lines)
└── spotify.service.ts   (162 lines)

backend/drizzle/
└── 0002_new_features.sql (108 lines)
```

### New Frontend Files (16)

```
frontend/src/components/hangouts/
├── CreateHangout.tsx    (174 lines)
├── HangoutCard.tsx      (193 lines)
├── HangoutsList.tsx     (109 lines)
├── index.ts
└── RsvpButtons.tsx      (37 lines)

frontend/src/components/lists/
├── AddListItem.tsx      (exists, not shown)
├── CreateList.tsx       (109 lines)
├── index.ts
├── ListCard.tsx         (exists, not shown)
├── ListDetail.tsx       (181 lines)
├── ListItem.tsx         (177 lines)
└── ListsBrowser.tsx     (114 lines)

frontend/src/components/music/
├── index.ts
├── MusicPicker.tsx      (225 lines)
├── MusicShare.tsx       (162 lines)
└── OnRepeat.tsx         (71 lines)
```

### Modified Files

**Backend:**

- `app.ts` - Route imports and registration
- `config.ts` - Spotify config
- `db/schema.ts` - New tables and types
- `drizzle/meta/_journal.json` - Migration journal
- `routes/users.ts` - Music endpoint

**Frontend:**

- `App.tsx` - Routing for new sections
- `App.css` - ~1300 lines of new styles
- `components/feed/CreatePost.tsx` - Music integration
- `components/layout/Header.tsx` - New nav items
- `components/profile/Profile.tsx` - OnRepeat section
- `constants/text.ts` - Nav labels
- `services/api.ts` - ~380 lines of new API functions
- `types/index.ts` - ~165 lines of new type definitions

---

## Testing Checklist

### Music Moments

- [ ] Spotify search returns results
- [ ] Can select track and mood
- [ ] Can attach music to post
- [ ] Music shows on post
- [ ] On Repeat shows on profile
- [ ] 30-sec preview plays
- [ ] Can delete own music shares

### Hangouts

- [ ] Can create hangout
- [ ] Hangout appears in list
- [ ] Can RSVP (in/maybe/out)
- [ ] RSVP count updates
- [ ] Creator can confirm/cancel
- [ ] Time flexibility displays correctly

### Shared Lists

- [ ] Can create list with type
- [ ] List appears in browser
- [ ] Can add items
- [ ] Can vote on items
- [ ] Can mark complete with review
- [ ] Rating displays correctly
- [ ] Can delete own items
- [ ] Gift list hides from user
- [ ] Can claim items on gift list

---

## Notes

- All features use the existing auth middleware
- All features cascade delete properly
- All visibility checks are in service layer
- CSS uses existing design tokens (var(--bg), var(--fg), etc.)
- All features have empty states with kaomoji
- All API responses follow existing patterns
