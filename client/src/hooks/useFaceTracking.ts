import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { LandmarkPoint } from '@shared/schema';

export interface UseFaceTrackingReturn {
  landmarks: LandmarkPoint[] | null;
  isTracking: boolean;
  initialize: (videoElement: HTMLVideoElement) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useFaceTracking(): UseFaceTrackingReturn {
  const [landmarks, setLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modelsLoadedRef = useRef<boolean>(false);
  const lastProcessTimeRef = useRef<number>(0);

  const processFrame = useCallback(async () => {
    if (!videoElementRef.current || !modelsLoadedRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const videoElement = videoElementRef.current;
    const now = performance.now();
    
    // Throttle to ~15 fps (66ms per frame) for stability
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    if (timeSinceLastProcess < 66) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      try {
        lastProcessTimeRef.current = now;
        
        // Detect face with landmarks (68 points)
        const detection = await faceapi
          .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224, // Smaller = faster, less accurate
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks();
        
        if (detection && detection.landmarks) {
          // Convert face-api.js landmarks to our format
          const positions = detection.landmarks.positions;
          const normalizedLandmarks = positions.map((point) => ({
            x: point.x / videoElement.videoWidth,
            y: point.y / videoElement.videoHeight
          }));
          
          setLandmarks(normalizedLandmarks);
          setIsTracking(true);
        } else {
          setLandmarks(null);
          setIsTracking(false);
        }
      } catch (err) {
        console.error('Face tracking error:', err);
        // Don't crash, just continue
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  const initialize = async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      videoElementRef.current = videoElement;

      console.log('Loading face-api.js models...');
      
      // Load only the models we need (tiny models for speed)
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
      
      console.log('✅ face-api.js models loaded successfully!');
      modelsLoadedRef.current = true;

      // Start the tracking loop
      console.log('Starting face tracking loop...');
      animationFrameRef.current = requestAnimationFrame(processFrame);
      
    } catch (err) {
      console.error('Failed to initialize face tracking:', err);
      setError('Face tracking unavailable. Please refresh to try again.');
      setIsTracking(false);
    }
  };

  const stop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    modelsLoadedRef.current = false;
    setLandmarks(null);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    landmarks,
    isTracking,
    initialize,
    stop,
    error,
  };
}
