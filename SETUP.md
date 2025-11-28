# Development Setup Guide

This guide covers setting up the development environment with linting, formatting, and pre-commit hooks.

## Prerequisites

- Node.js >= 20.0.0
- npm

## Quick Start

1. **Install root dependencies** (includes husky, lint-staged, prettier):

```bash
npm install
```

2. **Install workspace dependencies**:

```bash
npm install -w frontend
npm install -w backend
```

3. **Initialize Husky** (if not automatically done):

```bash
npx husky init
```

## Available Scripts

### Root Level

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend                             |
| `npm run dev:backend`  | Start only the backend                              |
| `npm run build`        | Build both frontend and backend                     |
| `npm run lint`         | Run ESLint on both workspaces                       |
| `npm run lint:fix`     | Run ESLint with auto-fix                            |
| `npm run format`       | Format all files with Prettier                      |
| `npm run format:check` | Check formatting without changes                    |
| `npm run test`         | Run frontend tests                                  |

### Frontend

```bash
npm run dev -w frontend        # Start dev server
npm run build -w frontend      # Build for production
npm run lint -w frontend       # Lint TypeScript/React files
npm run lint:fix -w frontend   # Lint with auto-fix
npm run test -w frontend       # Run tests
```

### Backend

```bash
npm run dev -w backend         # Start dev server with hot reload
npm run build -w backend       # Compile TypeScript
npm run lint -w backend        # Lint TypeScript files
npm run lint:fix -w backend    # Lint with auto-fix
npm run db:generate -w backend # Generate Drizzle migrations
npm run db:migrate -w backend  # Run migrations
npm run db:studio -w backend   # Open Drizzle Studio
```

## Code Quality Tools

### ESLint

Both frontend and backend use ESLint 9 with flat config:

- **Frontend**: `frontend/eslint.config.js` - React + TypeScript rules
- **Backend**: `backend/eslint.config.js` - Node.js + TypeScript rules

### Prettier

Shared config at root level: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Pre-commit Hooks

Husky + lint-staged runs on every commit:

1. ESLint with auto-fix on staged `.ts/.tsx` files
2. Prettier formatting on all staged files

Configuration: `.lintstagedrc.json`

## CSS Architecture

The frontend uses a modular CSS architecture:

```
frontend/src/styles/
├── index.css              # Main entry - imports all modules
├── _variables.css         # CSS custom properties (design tokens)
├── _base.css              # Reset, typography, global elements
├── _utilities.css         # Utility classes, animations
├── _responsive.css        # Media queries
└── components/
    ├── _buttons.css       # Button variants
    ├── _forms.css         # Form elements
    ├── _header.css        # Header & navigation
    ├── _footer.css        # Footer
    ├── _modal.css         # Modal dialogs
    ├── _feed.css          # Feed layout
    ├── _post-card.css     # Post card component
    ├── _reactions.css     # Reaction badges & picker
    ├── _camera.css        # Camera capture UI
    ├── _profile.css       # Profile & friends
    ├── _notifications.css # Notification settings
    └── _admin.css         # Admin panel
```

### CSS Naming Conventions

- Use BEM-like naming: `.block`, `.block--modifier`, `.block__element`
- Prefix with component name: `.post-card`, `.post-header`
- Use CSS variables from `_variables.css`

## IDE Setup

### VSCode

Recommended extensions (`.vscode/extensions.json`):

- Prettier - Code formatter
- ESLint
- Auto Rename Tag

Settings are preconfigured in `.vscode/settings.json`:

- Format on save enabled
- ESLint auto-fix on save
- Prettier as default formatter

## Troubleshooting

### Husky hooks not running

```bash
npx husky install
chmod +x .husky/pre-commit
```

### ESLint errors on fresh clone

```bash
npm install
npm run lint:fix
```

### CSS not loading

Make sure `App.tsx` imports: `import './styles/index.css'`
