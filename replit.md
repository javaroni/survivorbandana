# Survivor 50 AR Selfie Studio

## Project Overview
A mobile-first, responsive web application that allows Survivor fans to create branded AR selfies by wearing virtual bandanas, selecting island backgrounds, and capturing 1080×1920 photos with face tracking.

**Live URL**: Access via Replit's web preview on port 5000

## Technical Stack
- **Frontend**: React 18 + Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom Survivor theme
- **Face Tracking**: MediaPipe Face Mesh (468 landmarks) with One-Euro filter smoothing
- **AR Rendering**: HTML5 Canvas with real-time overlay compositing
- **Audio**: Web Audio API (synthesized tribal drum cue)
- **Sharing**: Web Share API with download fallback
- **Fonts**: Oswald (display/headings), Inter (body text)

## Key Features Implemented

### 1. Landing Page (`/`)
- Survivor 50 logo with animated entrance
- "Step Into the Game" tagline
- Parchment texture background with torch flicker effects
- Start button to access AR Studio

### 2. AR Studio (`/studio`)
- **Live Camera Preview**: Front-facing camera with face detection
- **Real-time Face Tracking**: MediaPipe Face Mesh with smooth landmark tracking
- **Bandana Overlay**: 3 styles (Red Tribal, Flame Orange, Ocean Teal) that track head movement
- **Background Selection**: 3 scenes (Island Beach, Campfire, Tribal Council)
- **Photo Capture**: 
  - Compositing layers: Background → Video frame → Bandana → Logo watermark
  - Output: 1080×1920 PNG
  - Survivor 50 logo positioned bottom-left with 48px inset
- **Audio Cue**: Tribal drum sound on capture
- **Preview Modal**: 
  - Full-screen image preview
  - Download to device
  - Web Share API integration
  - "Learn More" CTA link

### 3. Error Handling
- Camera permission denial with retry
- No camera detected with helpful message
- Face detection guidance ("Position your face in frame")
- Share fallback when Web Share API unavailable

## Design System

### Color Palette
- **Primary (Torch Orange)**: `hsl(22 95% 48%)` - #E85D04
- **Secondary (Island Teal)**: `hsl(181 89% 31%)` - #0A9396
- **Accent (Warm Yellow)**: `hsl(43 100% 51%)` - #FFBA08
- **Background (Parchment)**: `hsl(38 56% 90%)` - #F4E9D7
- **Dark (Wood Brown)**: `hsl(21 43% 21%)` - #4A2C1F

### Typography
- **Display Font**: Oswald (rugged, bold headings)
- **Body Font**: Inter (clean, readable)

### Custom Animations
- `animate-torch-flicker` - Subtle opacity pulse (3s)
- `animate-pulse-glow` - Orange glow effect (2s)
- `animate-ripple` - Expanding ring on capture (0.6s)
- `animate-fade-in-scale` - Entrance animation (0.8s)
- `animate-slide-up` - Bottom sheet slide (0.3s)

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── BandanaPicker.tsx      # 3-style bandana selector
│   │   ├── BackgroundPicker.tsx   # 3-scene background selector
│   │   ├── CaptureButton.tsx      # Circular capture button with pulse
│   │   └── PreviewModal.tsx       # Full-screen preview with share/download
│   ├── hooks/
│   │   ├── useCamera.ts           # Camera access & stream management
│   │   ├── useFaceTracking.ts     # MediaPipe integration & filtering
│   │   └── useAudioCue.ts         # Web Audio API drum sound
│   ├── pages/
│   │   ├── landing.tsx            # Home page with CTA
│   │   └── studio.tsx             # Main AR experience
│   ├── utils/
│   │   ├── compositor.ts          # Canvas layering & export (1080×1920)
│   │   ├── filters.ts             # One-Euro filter for landmark smoothing
│   │   └── share.ts               # Web Share API with fallbacks
│   └── index.css                  # Survivor color system & animations
├── index.html                      # Oswald & Inter fonts, SEO meta tags
└── tailwind.config.ts              # Extended with display font family

server/
├── routes/
│   └── transcode.ts                # Placeholder endpoint (501) for future video
└── routes.ts                       # Express route registration

shared/
└── schema.ts                       # TypeScript types (Bandana, BackgroundScene, etc.)

attached_assets/
└── generated_images/               # All generated assets (bandanas, backgrounds, logo)
```

## Generated Assets
All visual assets were AI-generated for this project:

**Bandanas** (3):
- Red_tribal_bandana_headband_429c26b4.png
- Orange_flame_bandana_headband_5333090e.png
- Teal_ocean_bandana_headband_5495ec20.png

**Backgrounds** (3):
- Tropical_island_beach_paradise_76942181.png (Beach)
- Tribal_campfire_with_torches_0e4d6140.png (Campfire)
- Tribal_council_night_scene_d967f43c.png (Tribal Council)

**Logo**:
- Survivor_50_official_logo_3a48e0ed.png

## Testing

### Manual Testing Required
Due to the AR nature of this app, manual testing on a real device with camera is required to verify:
- MediaPipe face detection works with actual camera feed
- Bandana overlay correctly tracks head movement
- Photo capture creates proper 1080×1920 composited images
- Share functionality works on mobile devices

### Automated Testing Results
- Navigation flow verified ✓
- UI components render correctly ✓
- Error handling works as expected ✓
- Camera permission flow functions properly ✓

**Note**: Playwright cannot test AR features without a physical camera device.

## Performance Considerations

### Target Performance
- **Live Preview**: 24-30 fps on recent iOS/Android devices
- **Face Tracking**: One-Euro filter smooths landmarks for stable overlay
- **Capture**: < 2 seconds from button press to preview modal

### Optimizations Implemented
1. **One-Euro Filter**: Reduces jitter in face landmark tracking
2. **Canvas Rendering**: Efficient layer compositing
3. **Lazy Loading**: MediaPipe loads on-demand from CDN
4. **Audio Synthesis**: Generated drum sound (no external audio files needed)
5. **Image Preloading**: Selected bandana image preloaded before capture

## Future Enhancements (Not in MVP)

### Video Capture Mode
- Canvas stream capture (3-5 second clips)
- MediaRecorder for WebM recording
- `/api/transcode` endpoint for WebM→MP4 conversion
- Recording countdown and progress bar UI
- Toggle between Photo/Video modes

### Analytics Integration
- Google Analytics 4 event tracking
- Meta Pixel for capture/share metrics
- User engagement analytics

### Additional Features
- More bandana styles and backgrounds
- Face filters and effects
- Social media direct posting
- User gallery of saved selfies

## Known Limitations

1. **MediaPipe Loading**: First load requires ~5-10 seconds to download face mesh model from CDN
2. **Browser Support**: Requires modern browser with `getUserMedia` support
3. **HTTPS Required**: Camera access only works over HTTPS
4. **Mobile Performance**: May vary on older devices due to MediaPipe processing

## Development Notes

### Running Locally
```bash
npm install
npm run dev
```
Application runs on `http://localhost:5000`

### Environment Requirements
- Node.js 20+
- Modern browser with camera support
- HTTPS for production deployment

### Key Dependencies
- `@mediapipe/face_mesh`: Face landmark detection
- `@tensorflow/tfjs-core` + `@tensorflow/tfjs-backend-webgl`: TensorFlow backend
- `framer-motion`: Animation library
- `wouter`: Lightweight routing
- Tailwind CSS + shadcn/ui: Styling system

## Deployment Checklist
- ✓ All assets generated and imported
- ✓ Design system configured with Survivor theme
- ✓ Camera and face tracking implemented
- ✓ Photo capture pipeline complete
- ✓ Error handling comprehensive
- ✓ Mobile-first responsive design
- ✓ SEO meta tags added
- ✓ Loading states polished
- ✓ Share functionality with fallbacks

## Support
For issues or questions about this implementation, refer to:
- `design_guidelines.md` - Detailed design specifications
- MediaPipe Face Mesh docs: https://google.github.io/mediapipe/solutions/face_mesh
- Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API

---
**Project Status**: ✅ Complete and Ready for Manual Testing
**Last Updated**: October 28, 2025
