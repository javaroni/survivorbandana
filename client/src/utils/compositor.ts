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
 * Ultra-simple, crash-proof bandana rendering
 * Works with face-api.js 68-point landmarks
 * NOTE: Caller is responsible for managing ctx.save()/restore() and transforms
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
    const leftInnerX = leftInner.x * canvasWidth;
    const rightInnerX = rightInner.x * canvasWidth;
    
    // Calculate forehead position (above eyebrows)
    const eyebrowCenterY = (
      (leftEyebrow.y + rightEyebrow.y + leftInner.y + rightInner.y) / 4
    ) * canvasHeight;
    
    const foreheadCenterX = ((leftX + rightX) / 2);
    
    // Calculate bandana dimensions
    const faceWidth = Math.abs(rightX - leftX);
    const bandanaWidth = faceWidth * 1.4; // Slightly wider than face
    const bandanaHeight = bandanaWidth * 0.35; // Aspect ratio for bandana
    
    // Position bandana above eyebrows
    const x = foreheadCenterX - bandanaWidth / 2;
    const y = eyebrowCenterY - bandanaHeight * 0.8; // Position mostly above eyebrows
    
    // Draw simple rectangle - no save/restore (caller handles it)
    ctx.drawImage(bandanaImage, x, y, bandanaWidth, bandanaHeight);
    
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
  if (bandanaImage && landmarks && landmarks.length > 0) {
    try {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      drawWrappedBandana(ctx, bandanaImage, landmarks, drawWidth, drawHeight);
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
