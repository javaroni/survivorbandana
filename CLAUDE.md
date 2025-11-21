# CLAUDE.md - AI Assistant Guide

## Project Overview

**Survivor 50 AR Selfie Studio** - A mobile-first, responsive web application that allows Survivor fans to create branded AR selfies by wearing virtual bandanas, selecting island backgrounds, and capturing 1080x1920 photos with real-time face tracking.

## Tech Stack

### Frontend
- **React 18** with TypeScript 5.6.3
- **Vite 5.4.x** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query v5** - Server state management
- **Tailwind CSS 3.4.x** - Utility-first styling
- **shadcn/ui** (new-york style) - UI component library
- **Framer Motion** - Animations
- **face-api.js / TensorFlow.js** - Face detection and landmark tracking

### Backend
- **Express.js 4.x** with TypeScript
- **Drizzle ORM** - Database toolkit (PostgreSQL)
- **WebSocket** support via `ws` package

### Build Tools
- **tsx** - TypeScript execution
- **esbuild** - Production bundling
- **PostCSS + Autoprefixer**

## Directory Structure

```
survivorbandana/
├── client/                    # Frontend React application
│   ├── index.html             # HTML entry with Google Fonts
│   ├── public/
│   │   └── models/            # face-api.js model files
│   └── src/
│       ├── main.tsx           # React entry point
│       ├── App.tsx            # Router and providers
│       ├── index.css          # Global CSS with Tailwind + custom animations
│       ├── components/
│       │   ├── ui/            # shadcn/ui components (50+ files)
│       │   ├── BandanaPicker.tsx
│       │   ├── BackgroundPicker.tsx
│       │   ├── CaptureButton.tsx
│       │   └── PreviewModal.tsx
│       ├── hooks/
│       │   ├── useCamera.ts       # Camera access & stream management
│       │   ├── useFaceTracking.ts # face-api.js integration
│       │   └── useAudioCue.ts     # Web Audio drum sound
│       ├── pages/
│       │   ├── landing.tsx    # Home page with CTA
│       │   ├── studio.tsx     # Main AR experience
│       │   └── not-found.tsx
│       ├── lib/
│       │   ├── queryClient.ts # TanStack Query setup
│       │   └── utils.ts       # cn() utility for classnames
│       └── utils/
│           ├── compositor.ts  # Canvas layering & export
│           ├── filters.ts     # One-Euro filter for smoothing
│           └── share.ts       # Web Share API with fallbacks
├── server/                    # Express.js backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # Route registration
│   ├── vite.ts                # Vite dev server integration
│   └── routes/
│       └── transcode.ts       # Placeholder for video transcoding
├── shared/
│   └── schema.ts              # Shared TypeScript types with Zod schemas
├── attached_assets/           # Project assets (bandanas, backgrounds, logo)
├── replit.md                  # Detailed project documentation
└── design_guidelines.md       # UI/UX design specifications
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# TypeScript type checking
npm run check

# Push database schema
npm run db:push
```

## Path Aliases

Configure in `tsconfig.json` and `vite.config.ts`:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

## Code Conventions

### File Naming
- **Components**: PascalCase (e.g., `PreviewModal.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCamera.ts`)
- **Utilities**: camelCase (e.g., `compositor.ts`)
- **Pages**: lowercase (e.g., `studio.tsx`, `landing.tsx`)

### Component Patterns
- Use functional components with hooks
- Default exports for pages
- Named exports for components
- Include `data-testid` attributes for testing
- Props interfaces defined inline or in the same file

### Styling Patterns
- Use Tailwind utility classes
- Use `cn()` utility from `@/lib/utils` for conditional classes
- CSS variables define the color theme (see `index.css`)
- Custom animations are defined in `index.css`

### State Management
- `useState`/`useRef` for local component state
- Custom hooks for reusable logic (camera, face tracking, audio)
- TanStack Query for server state (configured but minimal usage currently)

### Type Definitions
- Zod schemas in `shared/schema.ts`
- Infer TypeScript types from Zod schemas
- Use explicit type imports

### Error Handling
- Try/catch with user-friendly toast messages
- Console logging with emoji prefixes for debugging (e.g., `console.log("📸 Starting capture...")`)

## Key Files Reference

### Core Application
- `client/src/pages/studio.tsx` - Main AR experience (309 lines)
- `client/src/pages/landing.tsx` - Landing page
- `client/src/App.tsx` - App shell with routing and providers

### Custom Hooks
- `client/src/hooks/useCamera.ts` - Camera stream management, permissions
- `client/src/hooks/useFaceTracking.ts` - face-api.js integration, landmark detection
- `client/src/hooks/useAudioCue.ts` - Web Audio synthesis for capture sound

### Utilities
- `client/src/utils/compositor.ts` - Canvas compositing (bandana + background + video + logo)
- `client/src/utils/filters.ts` - One-Euro filter for smooth tracking
- `client/src/utils/share.ts` - Web Share API wrapper with fallbacks

### Shared Types
- `shared/schema.ts` - Bandana, BackgroundScene, LandmarkPoint, CaptureSettings schemas

## Color Palette (Survivor Theme)

### Primary Colors
- **Torch Orange**: `hsl(22 95% 48%)` / #E85D04
- **Island Teal**: `hsl(181 89% 31%)` / #0A9396
- **Warm Yellow**: `hsl(43 100% 51%)` / #FFBA08

### Neutral Base
- **Parchment** (background): `hsl(38 56% 90%)` / #F4E9D7
- **Wood Brown** (dark): `hsl(21 43% 21%)` / #4A2C1F

### Typography
- **Display font**: Oswald (rugged headings)
- **Body font**: Inter (readable text)

## Application Flow

1. **Landing Page** (`/`) - User sees intro and taps "Start"
2. **Studio Page** (`/studio`):
   - Camera initialization via `useCamera` hook
   - Face tracking initialization via `useFaceTracking` hook
   - Bandana selection (BandanaPicker component)
   - Background selection (BackgroundPicker component)
   - Photo capture (CaptureButton → compositeImage utility)
   - Preview modal with share/download options

## Common Tasks

### Adding a New Bandana
1. Add image to `attached_assets/generated_images/`
2. Update bandana options in `shared/schema.ts`
3. Reference in `BandanaPicker.tsx`

### Adding a New Background
1. Add image to `attached_assets/generated_images/`
2. Update background options in `shared/schema.ts`
3. Reference in `BackgroundPicker.tsx`

### Modifying UI Components
- shadcn/ui components are in `client/src/components/ui/`
- Use `cn()` for conditional class merging
- Follow new-york style conventions from components.json

### Adding a New API Route
1. Create route file in `server/routes/`
2. Register in `server/routes.ts`
3. Add shared types to `shared/schema.ts` if needed

## Testing Notes

**Current State**: No automated tests configured

**Manual Testing Required** for:
- Camera permissions flow
- Face detection accuracy
- Bandana positioning
- Photo capture and composition
- Share/download functionality

**Browser Requirements**:
- Modern browser with WebRTC support
- HTTPS required for camera access in production
- Mobile-first design (test on mobile devices)

## Performance Considerations

- Face tracking throttled to ~15 fps
- One-Euro filter reduces jitter in landmark detection
- Canvas rendering for efficient image compositing
- face-api.js models loaded from local public folder (5-10 second initial load)
- Output images: 1080x1920 PNG

## Environment Requirements

- Node.js 20+
- `DATABASE_URL` environment variable (for Drizzle ORM)
- HTTPS for production camera access

## Important Notes

1. **No ESLint/Prettier configured** - Follow existing code style
2. **Database is placeholder** - Drizzle configured but schema only has frontend types
3. **Video transcoding placeholder** - `/api/transcode` returns 501, reserved for future
4. **Mobile-first** - Always test on mobile viewports
5. **Camera-dependent** - Core features require camera access

## Additional Documentation

- `replit.md` - Comprehensive project documentation with implementation details
- `design_guidelines.md` - Detailed UI/UX specifications and design system

## Server Configuration

- Express server runs on PORT 5000
- Request logging middleware for API calls
- Vite middleware in development, static serving in production
- WebSocket support configured
