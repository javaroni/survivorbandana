// client/src/hooks/useFaceTracking.ts
import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";
import type { LandmarkPoint } from "@shared/schema";

export interface UseFaceTrackingReturn {
  landmarks: LandmarkPoint[] | null;
  isTracking: boolean;
  initialize: (videoEl: HTMLVideoElement) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useFaceTracking(): UseFaceTrackingReturn {
  const [landmarks, setLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTsRef = useRef<number>(0);
  const modelsLoadedRef = useRef(false);
  const lastDetectionRef = useRef<number>(0);
  const missedFramesRef = useRef<number>(0);

  // Load models once
  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) return;
    try {
      const url = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(url),
      ]);
      modelsLoadedRef.current = true;
    } catch (e: any) {
      throw new Error(`Failed to load face-api models: ${e?.message ?? e}`);
    }
  }, []);

  const processFrame = useCallback(async () => {
    const loop = async (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!videoRef.current) return;

      // throttle ~15 fps
      if (ts - lastTsRef.current < 66) return;
      lastTsRef.current = ts;

      try {
        const det = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          )
          .withFaceLandmarks(true);

        if (det?.landmarks) {
          // Face detected - reset missed frames counter
          missedFramesRef.current = 0;
          lastDetectionRef.current = ts;
          
          // Convert to your LandmarkPoint type
          const pts = det.landmarks.positions.map((p) => ({ x: p.x, y: p.y })) as LandmarkPoint[];
          setLandmarks(pts);
        } else {
          // Face not detected - increment missed frames
          missedFramesRef.current += 1;
          
          // Only clear landmarks after 10 consecutive missed frames (~600ms)
          // This prevents flashing when detection is intermittent
          if (missedFramesRef.current > 10) {
            setLandmarks(null);
          }
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const initialize = useCallback(
    async (videoEl: HTMLVideoElement) => {
      try {
        setError(null);
        videoRef.current = videoEl;
        await loadModels();
        setIsTracking(true);
        await processFrame();
      } catch (e: any) {
        setError(e?.message ?? String(e));
        setIsTracking(false);
      }
    },
    [loadModels, processFrame]
  );

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsTracking(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { landmarks, isTracking, initialize, stop, error };
}
