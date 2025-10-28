# Survivor 50 AR Selfie Studio - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from immersive, adventure-themed applications like National Geographic's AR experiences and Instagram's camera filters, while maintaining Survivor's distinctive rugged, tribal aesthetic. This is an experience-focused, visually-rich application where the interface should feel like stepping into the Survivor universe.

## Core Design Principles
1. **Immersive Theming**: Every element should reinforce the Survivor island survival experience
2. **Mobile-First Camera UI**: Minimize interface chrome to maximize camera preview visibility
3. **Tactile, Weathered Aesthetic**: Everything should feel handcrafted, worn, and authentic to island life
4. **Immediate Impact**: Users should feel transported to Survivor the moment the app loads

## Typography

**Primary Heading Font**: Bold stencil or military-style typeface (e.g., Oswald Bold, Impact, or similar rugged sans-serif)
- Landing headline: text-4xl to text-5xl (40-48px), font-bold, uppercase, letter-spacing tight
- Section headers: text-2xl to text-3xl (24-30px), font-bold, uppercase

**Body Font**: Clean, readable sans-serif (e.g., Inter, Open Sans)
- Instructions/UI text: text-sm to text-base (14-16px), font-medium
- Button labels: text-base (16px), font-semibold, uppercase with tracking-wide

**Hierarchy**: Use dramatic size jumps between heading levels (4xl → 2xl → base) to create clear visual emphasis

## Layout System

**Spacing Units**: Use Tailwind spacing of 2, 4, 6, 8, 12, and 16 for consistency
- Component padding: p-4 (16px) for mobile, p-6 (24px) for larger elements
- Section spacing: space-y-8 (32px) between major UI groups
- Button padding: px-8 py-4 (32px horizontal, 16px vertical)

**Mobile-First Viewport Management**:
- Landing screen: Full viewport (h-screen) with centered content
- AR Studio: Full viewport with camera preview, UI overlays positioned at top/bottom edges
- Preserve safe areas: pt-safe-top pb-safe-bottom for iOS notch/home indicator

**Grid Structure**:
- Picker thumbnails: grid-cols-3 with gap-3 (12px spacing)
- Single-column layout throughout (no multi-column needed for this camera-focused UI)

## Color Palette

**Primary Colors**:
- Torch Orange: #E85D04 (CTAs, active states, fire accents)
- Island Teal: #0A9396 (secondary buttons, highlights)
- Warm Yellow: #FFBA08 (accent elements, glow effects)

**Neutral Base**:
- Parchment Light: #F4E9D7 (light backgrounds, text on dark)
- Wood Brown: #4A2C1F (dark backgrounds, borders)
- Charcoal: #1A1A1A (deep shadows, text on light)

**Functional Colors**:
- Success: #38A169 (confirmation states)
- Warning: #DD6B20 (attention states)
- Error: #E53E3E (denied permissions, errors)

## Component Design Library

### Landing Screen
- **Hero Section**: Full viewport with parchment texture background, subtle wood grain overlay at 20% opacity
- **Logo**: Survivor 50 logo centered, max-width of 280px on mobile, animated fade-in with scale
- **Tagline**: "Step Into the Game" in stencil font, text-3xl, positioned below logo with margin-top of 6
- **CTA Button**: Large torch-orange button (w-64, h-14) with uppercase text, slight shadow, and pulsing glow animation suggesting urgency
- **Atmospheric Elements**: Animated torch flicker effect in corners using CSS keyframes, ambient warm gradient overlay (orange to yellow, 10% opacity)

### AR Studio Interface
- **Camera Preview**: Full viewport background, maintain 9:16 aspect ratio with letterboxing if needed
- **Top Bar**: Minimal header (h-16) with semi-transparent dark background (bg-black/40 backdrop-blur-md), contains back button and title
- **Picker Drawers**: 
  - Bottom-sheet style panels that slide up from bottom
  - Semi-transparent background (bg-wood-brown/90 backdrop-blur-lg)
  - Bandana/Background thumbnails as rounded squares (w-20 h-20) with burned-edge borders using box-shadow
  - Active selection highlighted with torch-orange border (border-4) and glow effect
- **Picker Labels**: Small text above thumbnails, text-xs uppercase tracking-wide in parchment color

### Capture Button
- **Design**: Large circular button (w-20 h-20) positioned bottom-center with mb-8
- **Styling**: Bamboo-textured background with tribal pattern border, concentric circles design reminiscent of torch/target
- **States**: 
  - Default: Subtle pulse animation
  - Active (pressed): Scale down slightly with haptic-like animation
  - Capturing: Quick flash effect with expanding ring animation
- **Audio Indicator**: Brief visual ripple when drum cue plays

### Preview Modal
- **Overlay**: Full-screen modal with dark semi-transparent backdrop (bg-black/80)
- **Image Container**: Centered preview with parchment-style frame border, max-width of 90vw
- **Frame Treatment**: Burned-edge effect using drop-shadow, subtle torch-light glow around edges
- **Action Buttons**: 
  - Horizontal button group at bottom (space-x-4)
  - "Save to Device" as primary torch-orange button
  - "Share" as secondary teal button with island aesthetic
  - Buttons have bamboo texture and tribal accent lines
- **CTA Link**: "Learn More About Survivor 50" as text link below buttons, underlined with teal color

### Buttons & Interactions
- **Primary Buttons**: Torch-orange background with uppercase text, px-8 py-4, rounded-lg, shadow-lg
- **Secondary Buttons**: Outlined teal border with transparent fill, hover fills with teal/20
- **Icon Buttons**: Circular (w-12 h-12) with centered icon, semi-transparent background
- **Disabled State**: Reduced opacity (opacity-50) with desaturated color

## Textures & Visual Effects

**Background Treatments**:
- Landing: Parchment texture with subtle paper grain, warm gradient overlay from top-left (orange/20) to bottom-right (yellow/10)
- AR Studio: No background needed (camera preview fills viewport)
- Modals: Dark wood grain texture with heavy vignette

**Border Styles**:
- Picker thumbnails: 3px solid border with burned/torn edge effect via irregular border-radius
- Active elements: 4px torch-orange border with outer glow (box-shadow: 0 0 20px rgba(232,93,4,0.5))
- Containers: Double-line bamboo-style borders using CSS pseudo-elements

**Shadow System**:
- Subtle elevation: shadow-md for floating elements
- Dramatic depth: shadow-2xl for modals and capture preview
- Glow effects: Custom box-shadow with orange/yellow for CTAs and active states

## Animations

**Minimal, Purpose-Driven Motion**:
- Landing entrance: Logo fades in with slight scale (0.95 → 1.0) over 800ms
- Picker transitions: Slide up from bottom with ease-out, 300ms duration
- Button interactions: Scale down (0.95) on press, 100ms
- Capture flash: Quick white overlay fade (0 → 1 → 0) over 200ms
- Audio cue visual: Concentric ripple effect from capture button, 400ms

**Performance Constraint**: All animations must maintain 60fps on mobile devices; use transform and opacity only

## Images

**Hero Image**: No traditional hero image on landing screen - replaced by immersive parchment texture with logo as focal point

**Asset Integration**:
- **Bandana Overlays**: Three PNG assets with transparency, rendered as WebGL textures for face-tracking performance
- **Background Scenes**: Three high-resolution JPEGs (1080×1920):
  1. Beach scene with turquoise water and palm trees
  2. Campfire scene with tribal torches and orange glow
  3. Tribal council scene with tiki torches and dramatic lighting
- **Survivor 50 Logo**: Transparent PNG watermark, positioned at bottom-left with 48px inset, rendered at 120px width

## Responsive Behavior

**Mobile Portrait (Default - 9:16)**:
- All spacing and sizing optimized for this primary viewport
- Touch targets minimum 48px for accessibility
- Picker thumbnails sized for easy one-handed selection

**Tablet/Desktop**:
- Center camera preview with max-width of 480px (maintaining 9:16)
- Add subtle side panels with tribal pattern texture
- Increase logo size to 320px on landing
- Button text increases to text-lg

## Accessibility Considerations

- High contrast between text and backgrounds (minimum WCAG AA)
- Touch targets meet 48px minimum size requirement
- Clear focus indicators with torch-orange outline for keyboard navigation
- Audio cue has visual confirmation (flash + ripple) for hearing-impaired users
- Camera permission denial shows clear error message with retry option

## Loading & State Management

**Loading States**:
- Camera initializing: Parchment background with "Preparing your adventure..." text and torch flicker animation
- Face mesh loading: Subtle progress indicator with tribal pattern animation
- Export processing: "Crafting your memory..." with spinning torch icon

**Error States**:
- Camera denied: Full-screen message with retry button and manual permission instructions
- No face detected: Gentle on-screen tooltip near top "Position your face in frame"
- Export failed: Toast notification with retry option

This design creates an immersive, adventure-themed experience that feels authentic to Survivor's brand while maintaining excellent usability for the core AR selfie capture functionality.