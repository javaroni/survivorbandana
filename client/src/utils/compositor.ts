import type { LandmarkPoint } from "@shared/schema";
import survivorLogo from "@assets/generated_images/Survivor_50_official_logo_3a48e0ed.png";

export const OUTPUT_WIDTH = 1080;
export const OUTPUT_HEIGHT = 1920;

/**
 * Load an image from a path
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Create a canvas for compositing
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Get the bounding box of face landmarks for bandana placement
 */
export function getFaceBoundingBox(landmarks: LandmarkPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  landmarks.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

// MediaPipe-specific helper functions removed - incompatible with face-api.js 68-point landmarks

/**
 * Calculate affine transform matrix from source quad to destination quad
 */
function calculateQuadTransform(
  srcQuad: { topLeft: {x: number, y: number}, topRight: {x: number, y: number}, bottomLeft: {x: number, y: number} },
  dstQuad: { topLeft: {x: number, y: number}, topRight: {x: number, y: number}, bottomLeft: {x: number, y: number} }
): { a: number; b: number; c: number; d: number; e: number; f: number } {
  // Affine transform maps source coordinates to destination
  // [a c e]   [x]   [x']
  // [b d f] * [y] = [y']
  // [0 0 1]   [1]   [1 ]
  
  const src = srcQuad;
  const dst = dstQuad;
  
  // Set up the system of equations
  const x0 = src.topLeft.x, y0 = src.topLeft.y;
  const x1 = src.topRight.x, y1 = src.topRight.y;
  const x2 = src.bottomLeft.x, y2 = src.bottomLeft.y;
  
  const u0 = dst.topLeft.x, v0 = dst.topLeft.y;
  const u1 = dst.topRight.x, v1 = dst.topRight.y;
  const u2 = dst.bottomLeft.x, v2 = dst.bottomLeft.y;
  
  // Solve for affine transform coefficients
  const denom = x0 * (y1 - y2) - x1 * (y0 - y2) + x2 * (y0 - y1);
  
  if (Math.abs(denom) < 1e-10) {
    // Degenerate case, return identity
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  }
  
  const a = (u0 * (y1 - y2) - u1 * (y0 - y2) + u2 * (y0 - y1)) / denom;
  const b = (v0 * (y1 - y2) - v1 * (y0 - y2) + v2 * (y0 - y1)) / denom;
  const c = (x0 * (u1 - u2) - x1 * (u0 - u2) + x2 * (u0 - u1)) / denom;
  const d = (x0 * (v1 - v2) - x1 * (v0 - v2) + x2 * (v0 - v1)) / denom;
  const e = (x0 * (y1 * u2 - y2 * u1) - x1 * (y0 * u2 - y2 * u0) + x2 * (y0 * u1 - y1 * u0)) / denom;
  const f = (x0 * (y1 * v2 - y2 * v1) - x1 * (y0 * v2 - y2 * v0) + x2 * (y0 * v1 - y1 * v0)) / denom;
  
  return { a, b, c, d, e, f };
}

/**
 * Calculate head rotation (yaw) from face landmarks
 * Returns angle in degrees: negative = turned left, positive = turned right
 */
function calculateHeadYaw(landmarks: LandmarkPoint[], isMirrored: boolean = false): number {
  // Use face outline points to detect rotation
  // Left jaw: 0, Right jaw: 16, Nose tip: 30
  const leftJaw = landmarks[0];
  const rightJaw = landmarks[16];
  const noseTip = landmarks[30];
  const noseBridge = landmarks[27];
  
  if (!leftJaw || !rightJaw || !noseTip || !noseBridge) {
    return 0;
  }
  
  // Calculate face center from jaw points
  const faceCenterX = (leftJaw.x + rightJaw.x) / 2;
  
  // Nose offset from center indicates rotation
  // When head turns left, nose moves left of center (negative)
  // When head turns right, nose moves right of center (positive)
  const noseOffsetX = noseTip.x - faceCenterX;
  
  // Convert to approximate angle (empirically tuned)
  // Typical nose offset range is about -0.15 to +0.15 in normalized coords
  let angle = noseOffsetX * 300; // Scale to degrees
  
  // Flip angle for mirrored contexts (selfie mode)
  if (isMirrored) {
    angle = -angle;
  }
  
  // Clamp to reasonable range
  return Math.max(-60, Math.min(60, angle));
}

/**
 * Simple perspective-based bandana rendering
 * Uses transform matrix to apply 3D perspective effect
 */
export function drawWrappedBandana(
  ctx: CanvasRenderingContext2D,
  bandanaImage: HTMLImageElement,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number,
  mirroredContext: boolean = false
) {
  try {
    // Validate everything
    if (!ctx || !bandanaImage || !landmarks || landmarks.length < 68) {
      return;
    }
    
    if (!bandanaImage.complete || bandanaImage.naturalWidth === 0) {
      return;
    }
    
    // face-api.js 68-point model indices:
    // Left eyebrow outer: 17, Right eyebrow outer: 26
    // Left eyebrow inner: 21, Right eyebrow inner: 22
    const leftEyebrow = landmarks[17];
    const rightEyebrow = landmarks[26];
    const leftInner = landmarks[21];
    const rightInner = landmarks[22];
    
    if (!leftEyebrow || !rightEyebrow || !leftInner || !rightInner) {
      return;
    }
    
    // Convert to pixel coordinates
    const leftX = leftEyebrow.x * canvasWidth;
    const rightX = rightEyebrow.x * canvasWidth;
    const leftY = leftEyebrow.y * canvasHeight;
    const rightY = rightEyebrow.y * canvasHeight;
    
    // Calculate forehead position (above eyebrows)
    const eyebrowCenterY = (
      (leftEyebrow.y + rightEyebrow.y + leftInner.y + rightInner.y) / 4
    ) * canvasHeight;
    
    const foreheadCenterX = ((leftX + rightX) / 2);
    
    // Calculate bandana dimensions
    const faceWidth = Math.abs(rightX - leftX);
    const bandanaWidth = faceWidth * 1.3; // Slightly wider for better wrap
    const bandanaHeight = bandanaWidth * 0.35;
    
    // Calculate head rotation
    const headYaw = calculateHeadYaw(landmarks, mirroredContext);
    
    // Position bandana above eyebrows
    const centerY = eyebrowCenterY - bandanaHeight * 0.7;
    
    // Slight tilt based on eyebrow angle
    const eyebrowTilt = Math.atan2(rightY - leftY, rightX - leftX);
    
    ctx.save();
    ctx.translate(foreheadCenterX, centerY);
    ctx.rotate(eyebrowTilt);
    
    // Apply perspective transform based on head rotation
    // This creates a trapezoid effect that simulates wrapping
    const skewAmount = headYaw / 60 * 0.3; // Scale rotation to skew amount
    
    // Calculate corner positions for perspective transform
    // When head turns left, left side appears closer (larger)
    // When head turns right, right side appears closer (larger)
    const leftScale = 1 + Math.max(0, -headYaw / 60) * 0.3;
    const rightScale = 1 + Math.max(0, headYaw / 60) * 0.3;
    
    // Top-left corner
    const x0 = -bandanaWidth / 2 * leftScale;
    const y0 = -bandanaHeight / 2;
    
    // Top-right corner
    const x1 = bandanaWidth / 2 * rightScale;
    const y1 = -bandanaHeight / 2;
    
    // Bottom-right corner
    const x2 = bandanaWidth / 2 * rightScale;
    const y2 = bandanaHeight / 2;
    
    // Bottom-left corner
    const x3 = -bandanaWidth / 2 * leftScale;
    const y3 = bandanaHeight / 2;
    
    // Use setTransform to apply perspective
    // This maps the bandana image onto the trapezoid defined by our corners
    const srcWidth = bandanaImage.width;
    const srcHeight = bandanaImage.height;
    
    // Simple approach: divide bandana into 3 sections with different scaling
    const sectionWidth = bandanaWidth / 3;
    const sections = [
      { x: x0, scale: leftScale, sourceX: 0 },
      { x: 0, scale: 1, sourceX: srcWidth / 3 },
      { x: sectionWidth, scale: rightScale, sourceX: srcWidth * 2 / 3 }
    ];
    
    sections.forEach((section, i) => {
      ctx.save();
      
      // Position and scale each section
      const xOffset = (i - 1) * sectionWidth;
      ctx.translate(xOffset, 0);
      ctx.scale(section.scale, 1);
      
      // Add slight rotation to outer sections for wrapping effect
      if (i === 0) {
        ctx.rotate(Math.max(0, -headYaw / 60) * 0.2);
      } else if (i === 2) {
        ctx.rotate(Math.max(0, headYaw / 60) * -0.2);
      }
      
      // Darken edges that are turned away
      const brightness = i === 1 ? 1 : 0.85;
      ctx.globalAlpha = brightness;
      
      ctx.drawImage(
        bandanaImage,
        section.sourceX, 0, srcWidth / 3, srcHeight,
        -sectionWidth / 2, -bandanaHeight / 2, sectionWidth, bandanaHeight
      );
      
      ctx.restore();
    });
    
    ctx.restore();
    
  } catch (error) {
    // Silently fail - don't crash the render loop
    console.warn('Bandana render error:', error);
    return;
  }
}

/**
 * Legacy function - NO LONGER COMPATIBLE with face-api.js 68-point landmarks
 * @deprecated Removed - was designed for MediaPipe 468-point landmarks
 */

interface CompositeOptions {
  backgroundImage: HTMLImageElement;
  videoFrame: HTMLVideoElement;
  bandanaImage: HTMLImageElement | null;
  landmarks: LandmarkPoint[] | null;
  outputWidth?: number;
  outputHeight?: number;
}

/**
 * Composite all layers into final image
 * Order: background → video frame → bandana → logo
 */
export async function compositeImage(options: CompositeOptions): Promise<Blob> {
  const {
    backgroundImage,
    videoFrame,
    bandanaImage,
    landmarks,
    outputWidth = OUTPUT_WIDTH,
    outputHeight = OUTPUT_HEIGHT,
  } = options;

  const canvas = createCanvas(outputWidth, outputHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // 1. Draw background (fill entire canvas)
  ctx.drawImage(backgroundImage, 0, 0, outputWidth, outputHeight);

  // 2. Draw video frame (centered, maintaining aspect ratio)
  const videoAspect = videoFrame.videoWidth / videoFrame.videoHeight;
  const outputAspect = outputWidth / outputHeight;
  
  let drawWidth = outputWidth;
  let drawHeight = outputHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > outputAspect) {
    drawHeight = outputHeight;
    drawWidth = drawHeight * videoAspect;
    offsetX = -(drawWidth - outputWidth) / 2;
  } else {
    drawWidth = outputWidth;
    drawHeight = drawWidth / videoAspect;
    offsetY = -(drawHeight - outputHeight) / 2;
  }

  ctx.drawImage(videoFrame, offsetX, offsetY, drawWidth, drawHeight);

  // 3. Draw bandana overlay (if face detected and bandana selected)
  // Note: landmarks come from mirrored tracking feed, but final photo should
  // be non-mirrored. We need to flip landmarks horizontally to match non-mirrored video.
  if (bandanaImage && landmarks && landmarks.length > 0) {
    try {
      // Un-mirror the landmarks (flip horizontally)
      const unmirroredLandmarks = landmarks.map(point => ({
        x: 1 - point.x, // Flip x coordinate
        y: point.y       // Keep y coordinate
      }));
      
      ctx.save();
      ctx.translate(offsetX, offsetY);
      
      // Use un-mirrored landmarks with mirroredContext=false for final photo
      drawWrappedBandana(ctx, bandanaImage, unmirroredLandmarks, drawWidth, drawHeight, false);
      ctx.restore();
    } catch (error) {
      console.error('Error drawing bandana in composite:', error);
      ctx.restore(); // Ensure we restore even on error
    }
  }

  // 4. Draw Survivor 50 logo watermark (bottom-left, 48px inset)
  const logo = await loadImage(survivorLogo);
  const logoWidth = 120;
  const logoHeight = (logo.height / logo.width) * logoWidth;
  const logoInset = 48;

  ctx.drawImage(
    logo,
    logoInset,
    outputHeight - logoHeight - logoInset,
    logoWidth,
    logoHeight
  );

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
