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

  // Calculate positions in canvas coordinates
  const centerX = foreheadCenter.x * canvasWidth;
  const centerY = foreheadCenter.y * canvasHeight;
  
  const leftTempleX = leftTemple.x * canvasWidth;
  const leftTempleY = leftTemple.y * canvasHeight;
  
  const rightTempleX = rightTemple.x * canvasWidth;
  const rightTempleY = rightTemple.y * canvasHeight;
  
  // Calculate bandana height based on forehead to eyebrow distance
  const avgBrowY = ((leftBrowOuter.y + rightBrowOuter.y + leftBrowInner.y + rightBrowInner.y) / 4) * canvasHeight;
  const bandanaHeight = (avgBrowY - centerY) * 2.2; // Cover from top of forehead to just above eyebrows
  
  // Face width for scaling
  const faceWidth = Math.abs(rightTempleX - leftTempleX);
  
  return {
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
}

/**
 * Render bandana with three-segment wrapping effect
 */
export function drawWrappedBandana(
  ctx: CanvasRenderingContext2D,
  bandanaImage: HTMLImageElement,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number
) {
  const segments = getBandanaSegments(landmarks, canvasWidth, canvasHeight);
  const imgWidth = bandanaImage.width;
  const imgHeight = bandanaImage.height;
  
  // Draw left side (rotated)
  ctx.save();
  ctx.translate(segments.left.x, segments.left.y);
  ctx.rotate((segments.left.angle * Math.PI) / 180);
  ctx.globalAlpha = 0.85; // Slightly transparent for depth
  ctx.drawImage(
    bandanaImage,
    0, 0, imgWidth * 0.35, imgHeight, // Source: left 35% of image
    -segments.left.width, 0, segments.left.width, segments.left.height // Destination
  );
  ctx.restore();
  
  // Draw center (main section with logo)
  ctx.save();
  ctx.drawImage(
    bandanaImage,
    imgWidth * 0.3, 0, imgWidth * 0.4, imgHeight, // Source: center 40% with logo
    segments.center.x - segments.center.width / 2, segments.center.y,
    segments.center.width, segments.center.height
  );
  ctx.restore();
  
  // Draw right side (rotated)
  ctx.save();
  ctx.translate(segments.right.x, segments.right.y);
  ctx.rotate((segments.right.angle * Math.PI) / 180);
  ctx.globalAlpha = 0.85; // Slightly transparent for depth
  ctx.drawImage(
    bandanaImage,
    imgWidth * 0.65, 0, imgWidth * 0.35, imgHeight, // Source: right 35% of image
    0, 0, segments.right.width, segments.right.height // Destination
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
