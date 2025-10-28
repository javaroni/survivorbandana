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

// Cache for last valid segments to prevent flickering
let lastValidSegments: any = null;

/**
 * Extract forehead landmarks that define the bandana wrap curve
 * Returns points from left temple to right temple along the forehead
 */
function getForeheadCurve(landmarks: LandmarkPoint[]): LandmarkPoint[] {
  // Create a smooth curve across the forehead using key landmarks
  // Left to right: left temple -> left brow -> center forehead -> right brow -> right temple
  const curveIndices = [
    127, // Left temple
    162, 21, 54, 103, 67, 109, 10, // Left side to center
    338, 297, 332, 284, 251, 389, 356 // Center to right temple
  ];
  
  return curveIndices.map(i => landmarks[i]).filter(Boolean);
}

/**
 * Generate triangulated mesh for smooth bandana wrapping
 * Creates a strip of quads (2 triangles each) along the forehead curve
 */
function generateBandanaMesh(landmarks: LandmarkPoint[], canvasWidth: number, canvasHeight: number) {
  const foreheadCurve = getForeheadCurve(landmarks);
  
  if (foreheadCurve.length < 3) {
    return null;
  }
  
  // Calculate bandana height based on forehead to eyebrow distance
  const foreheadTop = landmarks[10]; // Center top
  const leftBrow = landmarks[105];
  const rightBrow = landmarks[334];
  const avgBrowY = ((leftBrow?.y || 0) + (rightBrow?.y || 0)) / 2;
  const bandanaHeight = Math.max(30, Math.abs((avgBrowY - (foreheadTop?.y || 0)) * canvasHeight * 2.2));
  
  // Create quads along the curve
  const quads: Array<{
    // Screen coordinates (destination)
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
    // UV coordinates (source texture)
    uvTopLeft: { x: number; y: number };
    uvTopRight: { x: number; y: number };
    uvBottomLeft: { x: number; y: number };
    uvBottomRight: { x: number; y: number };
  }> = [];
  
  const numSegments = foreheadCurve.length - 1;
  
  for (let i = 0; i < numSegments; i++) {
    const p1 = foreheadCurve[i];
    const p2 = foreheadCurve[i + 1];
    
    // Screen coordinates
    const x1 = p1.x * canvasWidth;
    const y1 = p1.y * canvasHeight;
    const x2 = p2.x * canvasWidth;
    const y2 = p2.y * canvasHeight;
    
    // Calculate normal direction (perpendicular to curve) for bottom edge
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;
    
    // Bottom edge points (extended downward along normal)
    const bottomX1 = x1 + normalX * bandanaHeight;
    const bottomY1 = y1 + normalY * bandanaHeight;
    const bottomX2 = x2 + normalX * bandanaHeight;
    const bottomY2 = y2 + normalY * bandanaHeight;
    
    // UV coordinates (normalized 0-1 across bandana texture)
    const uLeft = i / numSegments;
    const uRight = (i + 1) / numSegments;
    
    quads.push({
      // Destination (screen space)
      topLeft: { x: x1, y: y1 },
      topRight: { x: x2, y: y2 },
      bottomLeft: { x: bottomX1, y: bottomY1 },
      bottomRight: { x: bottomX2, y: bottomY2 },
      // Source (texture UV space)
      uvTopLeft: { x: uLeft, y: 0 },
      uvTopRight: { x: uRight, y: 0 },
      uvBottomLeft: { x: uLeft, y: 1 },
      uvBottomRight: { x: uRight, y: 1 },
    });
  }
  
  return quads;
}

/**
 * Calculate bandana wrapping positions for three segments (left, center, right)
 */
export function getBandanaSegments(landmarks: LandmarkPoint[], canvasWidth: number, canvasHeight: number) {
  // Key landmark points for bandana placement
  // Forehead center: 10
  // Left temple: 127
  // Right temple: 356
  // Left eyebrow outer: 70
  // Right eyebrow outer: 300
  // Left eyebrow inner: 105
  // Right eyebrow inner: 334
  
  const foreheadCenter = landmarks[10];
  const leftTemple = landmarks[127];
  const rightTemple = landmarks[356];
  const leftBrowOuter = landmarks[70];
  const rightBrowOuter = landmarks[300];
  const leftBrowInner = landmarks[105];
  const rightBrowInner = landmarks[334];

  // Validate landmarks exist
  if (!foreheadCenter || !leftTemple || !rightTemple || 
      !leftBrowOuter || !rightBrowOuter || !leftBrowInner || !rightBrowInner) {
    // Return last valid segments if available
    if (lastValidSegments) {
      return lastValidSegments;
    }
    // Fallback to centered position
    return {
      center: { x: canvasWidth / 2, y: canvasHeight * 0.2, width: canvasWidth * 0.4, height: canvasHeight * 0.15 },
      left: { x: canvasWidth * 0.3, y: canvasHeight * 0.2, width: canvasWidth * 0.2, height: canvasHeight * 0.13, angle: 15 },
      right: { x: canvasWidth * 0.7, y: canvasHeight * 0.2, width: canvasWidth * 0.2, height: canvasHeight * 0.13, angle: -15 },
    };
  }

  // Calculate positions in canvas coordinates
  const centerX = foreheadCenter.x * canvasWidth;
  const centerY = foreheadCenter.y * canvasHeight;
  
  const leftTempleX = leftTemple.x * canvasWidth;
  const leftTempleY = leftTemple.y * canvasHeight;
  
  const rightTempleX = rightTemple.x * canvasWidth;
  const rightTempleY = rightTemple.y * canvasHeight;
  
  // Calculate bandana height based on forehead to eyebrow distance
  const avgBrowY = ((leftBrowOuter.y + rightBrowOuter.y + leftBrowInner.y + rightBrowInner.y) / 4) * canvasHeight;
  const rawBandanaHeight = (avgBrowY - centerY) * 2.2;
  
  // Clamp to positive value to prevent flipping (minimum 30px)
  const bandanaHeight = Math.max(30, rawBandanaHeight);
  
  // Face width for scaling
  const faceWidth = Math.abs(rightTempleX - leftTempleX);
  
  const segments = {
    center: {
      x: centerX,
      y: centerY,
      width: faceWidth * 0.6, // Center section width
      height: bandanaHeight,
    },
    left: {
      x: leftTempleX,
      y: leftTempleY,
      width: faceWidth * 0.35, // Side section width
      height: bandanaHeight * 0.9,
      angle: 15, // Degrees to rotate for wrapping effect
    },
    right: {
      x: rightTempleX,
      y: rightTempleY,
      width: faceWidth * 0.35,
      height: bandanaHeight * 0.9,
      angle: -15, // Degrees to rotate for wrapping effect
    },
  };
  
  // Cache valid segments
  lastValidSegments = segments;
  
  return segments;
}

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
 * Render bandana with simple positioning that follows face landmarks
 */
export function drawWrappedBandana(
  ctx: CanvasRenderingContext2D,
  bandanaImage: HTMLImageElement,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number
) {
  // Get key forehead landmarks
  const foreheadTop = landmarks[10];
  const leftTemple = landmarks[127];
  const rightTemple = landmarks[356];
  const leftBrow = landmarks[105];
  const rightBrow = landmarks[334];
  
  // Validate landmarks
  if (!foreheadTop || !leftTemple || !rightTemple || !leftBrow || !rightBrow) {
    return; // Don't render if we don't have valid landmarks
  }
  
  // Calculate bandana position
  const centerX = foreheadTop.x * canvasWidth;
  const centerY = foreheadTop.y * canvasHeight;
  
  const leftX = leftTemple.x * canvasWidth;
  const rightX = rightTemple.x * canvasWidth;
  const faceWidth = Math.abs(rightX - leftX);
  
  // Calculate height based on forehead to eyebrow distance
  const avgBrowY = ((leftBrow.y + rightBrow.y) / 2) * canvasHeight;
  const bandanaHeight = Math.max(40, Math.abs(avgBrowY - centerY) * 2.5);
  
  // Make bandana slightly wider than face for wrapping appearance
  const bandanaWidth = faceWidth * 1.2;
  
  // Position bandana at top of forehead
  const x = centerX - bandanaWidth / 2;
  const y = centerY - bandanaHeight * 0.3; // Offset upward to sit on forehead
  
  // Draw bandana
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    bandanaImage,
    x, y,
    bandanaWidth, bandanaHeight
  );
  ctx.restore();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getBandanaSegments and drawWrappedBandana instead
 */
export function getForeheadPosition(landmarks: LandmarkPoint[], canvasWidth: number, canvasHeight: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const segments = getBandanaSegments(landmarks, canvasWidth, canvasHeight);
  return segments.center;
}

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
    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawWrappedBandana(ctx, bandanaImage, landmarks, drawWidth, drawHeight);
    ctx.restore();
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
