import { z } from "zod";

// Bandana type definition
export const bandanaSchema = z.object({
  id: z.string(),
  name: z.string(),
  imagePath: z.string(),
});

export type Bandana = z.infer<typeof bandanaSchema>;

// Background scene type definition
export const backgroundSceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  imagePath: z.string(),
});

export type BackgroundScene = z.infer<typeof backgroundSceneSchema>;

// Face tracking landmark point
export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

// Face mesh results from MediaPipe
export interface FaceMeshResults {
  multiFaceLandmarks?: LandmarkPoint[][];
  image?: HTMLCanvasElement | HTMLVideoElement;
}

// Capture settings
export interface CaptureSettings {
  bandana: Bandana | null;
  background: BackgroundScene | null;
  resolution: {
    width: number;
    height: number;
  };
}

// Export format
export const exportFormatSchema = z.enum(['png', 'jpeg']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

// Camera permission state
export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'error';

// Audio context state
export type AudioContextState = 'suspended' | 'running' | 'closed';
