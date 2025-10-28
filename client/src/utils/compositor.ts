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
 * Get forehead position for bandana placement (wraps around forehead)
 */
export function getForeheadPosition(landmarks: LandmarkPoint[], canvasWidth: number, canvasHeight: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // Use eyebrow landmarks for bandana placement
  // MediaPipe Face Mesh landmark indices:
  // Left eyebrow: 223, 222, 221, 189, 244, 233, 232, 231, 230, 229, 228
  // Right eyebrow: 443, 442, 441, 413, 464, 453, 452, 451, 450, 449, 448
  // Forehead center: 10, 151, 9
  // Temple points: 127 (left), 356 (right)
  const bandanaIndices = [
    10, 151, 9, // Center forehead line
    223, 222, 221, 189, 244, 233, 232, 231, // Left eyebrow
    443, 442, 441, 413, 464, 453, 452, 451, // Right eyebrow
    127, 356, // Temples for width
  ];
  
  const bandanaPoints = bandanaIndices.map(i => landmarks[i]).filter(Boolean);
  
  if (bandanaPoints.length === 0) {
    // Fallback to full face bounds
    const bbox = getFaceBoundingBox(landmarks);
    return {
      x: bbox.minX * canvasWidth,
      y: bbox.minY * canvasHeight,
      width: bbox.width * canvasWidth,
      height: bbox.height * canvasHeight * 0.25,
    };
  }

  const bbox = getFaceBoundingBox(bandanaPoints);
  const faceBox = getFaceBoundingBox(landmarks);

  // Position bandana to wrap around the forehead/eyebrow area
  // Extend width beyond face for wrapping effect
  const bandanaWidth = faceBox.width * canvasWidth * 1.3; // 30% wider for wrap
  const bandanaHeight = bbox.height * canvasHeight * 1.8; // Taller to cover forehead properly
  
  return {
    x: (faceBox.centerX * canvasWidth) - (bandanaWidth / 2), // Center on face
    y: bbox.minY * canvasHeight - (bandanaHeight * 0.4), // Position above eyebrows
    width: bandanaWidth,
    height: bandanaHeight,
  };
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
    const bandanaPos = getForeheadPosition(landmarks, drawWidth, drawHeight);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.drawImage(
      bandanaImage,
      bandanaPos.x,
      bandanaPos.y,
      bandanaPos.width,
      bandanaPos.height
    );
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
