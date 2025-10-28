# Survivor 50 AR Selfie Studio

## Overview

A mobile-first web application that lets Survivor fans create personalized AR selfies by placing themselves into iconic Survivor scenes with virtual bandanas. Users can access their device camera, apply real-time face tracking to wear Survivor-style bandanas, select tropical island backgrounds, and capture high-resolution (1080×1920) images with the Survivor 50 logo overlay. The application is architected to support future video capture capabilities without requiring significant refactoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Wouter for lightweight client-side routing

**UI System**: Radix UI primitives with shadcn/ui components, styled using Tailwind CSS with a custom Survivor-themed design system featuring:
- Torch Orange (#E85D04) for primary actions
- Island Teal (#0A9396) for secondary elements  
- Warm parchment and wood-grain aesthetic throughout
- Oswald font for bold headings, Inter for body text

**State Management**: TanStack Query (React Query) for server state, React hooks for local component state

**Responsive Design**: Mobile-first approach with full viewport camera preview, optimized for 9:16 portrait orientation

### AR & Media Processing

**Face Tracking**: MediaPipe FaceMesh for real-time facial landmark detection (468 points)
- Tracks head position and rotation for accurate bandana placement
- One-Euro Filter implementation for smooth landmark tracking and reduced jitter

**Camera Access**: Web APIs (getUserMedia) with graceful permission handling
- Front-facing camera with 1280×720 preferred resolution
- Video element serves as real-time preview

**Image Compositing**: Canvas-based layering system for final capture:
1. Background scene layer (full frame)
2. Live camera feed (user's face)
3. Bandana overlay (warped to match face angle using landmark positioning)
4. Survivor 50 logo (bottom-left corner)

**Export**: Client-side PNG/JPEG generation at 1080×1920 resolution with 85-90% quality

**Audio**: Web Audio API with synthesized tribal drum sound cue on capture (no external audio files required for MVP)

### Component Structure

**Pages**:
- `Landing`: Entry point with logo, tagline, and camera permission request
- `Studio`: Main AR experience with live preview, asset pickers, and capture functionality
- `NotFound`: 404 handler

**Core Components**:
- `BandanaPicker`: Grid selector for 3 bandana styles (Red Tribal, Flame Orange, Ocean Teal)
- `BackgroundPicker`: Grid selector for 3 scenes (Island Beach, Campfire, Tribal Council)
- `CaptureButton`: Animated shutter button with ripple effect and tribal drum cue
- `PreviewModal`: Post-capture preview with download and Web Share API integration

**Custom Hooks**:
- `useCamera`: Manages camera stream lifecycle and permission states
- `useFaceTracking`: Initializes MediaPipe and processes facial landmarks
- `useAudioCue`: Handles Web Audio context and playback
- `useToast`: Manages notification system

### Data Layer

**Schema Definitions** (`shared/schema.ts`):
- `Bandana`: Asset metadata (id, name, imagePath)
- `BackgroundScene`: Scene metadata (id, name, imagePath)
- `FaceMeshResults`: MediaPipe output structure
- `CaptureSettings`: Current user selections and resolution
- `CameraPermissionState`: Permission flow tracking

**Storage**: In-memory storage implementation for user data (currently minimal usage)
- Placeholder `MemStorage` class with CRUD methods for future user profile features

### Build System

**Development**: Vite dev server with HMR, React Fast Refresh, and Replit-specific plugins
- Custom error overlay
- Cartographer for code navigation
- Dev banner for environment awareness

**Production**: 
- Client bundle output to `dist/public`
- Server bundle via esbuild (ESM format, Node platform)
- TypeScript compilation without emit (type checking only)

**Asset Handling**: Static assets served from `attached_assets/generated_images/` with Vite alias `@assets`

### API & Routing

**Backend Framework**: Express.js with TypeScript

**Middleware**:
- JSON body parsing with raw buffer preservation
- URL-encoded form data support
- Request/response logging for API endpoints

**Routes**:
- `/api/transcode`: Placeholder endpoint returning 501 for future video processing (reserved for WebM to MP4 transcoding)

**Static Serving**: Vite middleware in development, compiled assets in production

## External Dependencies

### Core Libraries

**UI & Styling**:
- Radix UI (v1.x) for accessible component primitives
- Tailwind CSS 3.x with custom theme configuration
- class-variance-authority for component variants
- Lucide React for iconography

**AR & Computer Vision**:
- `@mediapipe/face_mesh` (v0.4.1633559619) for facial landmark detection
- `@tensorflow/tfjs-core` and `@tensorflow/tfjs-backend-webgl` (v4.22.0) as MediaPipe dependencies

**State & Data**:
- `@tanstack/react-query` (v5.60.5) for asynchronous state management
- `wouter` for lightweight routing

**Database** (Configured but minimal usage):
- `@neondatabase/serverless` (v0.10.4) for PostgreSQL connectivity
- Drizzle ORM with schema defined in `shared/schema.ts`
- Connection configured via `DATABASE_URL` environment variable

**Development Tools**:
- Vite (v6.x) with React plugin
- TypeScript (v5.x) with strict mode
- esbuild for server bundling
- `@replit/vite-plugin-*` for Replit IDE integration

### Third-Party Services

**Content Delivery**:
- MediaPipe models loaded from `cdn.jsdelivr.net/npm/@mediapipe/face_mesh/`
- Google Fonts (Oswald, Inter) loaded from fonts.googleapis.com

**Browser APIs**:
- MediaDevices API (getUserMedia) for camera access
- Web Audio API for sound playback
- Canvas API for image compositing
- Web Share API for native sharing (with download fallback)

### Asset Pipeline

**Image Assets**: Pre-generated Survivor-themed graphics stored in `attached_assets/generated_images/`:
- 3 bandana overlays (PNG with transparency)
- 3 background scenes (JPG/PNG)
- Survivor 50 official logo
- All assets loaded via Vite's static import system

**Future Considerations**: 
- Video transcoding placeholder suggests FFmpeg or cloud service integration planned
- Schema includes audio context state management for expanded audio features