import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { FaceMeshResults, LandmarkPoint } from '@shared/schema';
import { PointFilter } from '@/utils/filters';

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
  
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const filtersRef = useRef<Map<number, PointFilter>>(new Map());

  const processFrame = useCallback(async () => {
    if (!faceMeshRef.current || !videoElementRef.current) {
      return;
    }

    const videoElement = videoElementRef.current;
    
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      try {
        await faceMeshRef.current.send({ image: videoElement });
      } catch (err) {
        console.error('Face tracking error:', err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  const initialize = async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      videoElementRef.current = videoElement;

      console.log('Creating FaceMesh instance...');
      
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          console.log('Loading MediaPipe file:', url);
          return url;
        },
      });

      console.log('Setting FaceMesh options...');
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false, // Disable to reduce complexity
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log('Setting up onResults callback...');
      faceMesh.onResults((results: any) => {
        try {
          if (!results || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setLandmarks(null);
            setIsTracking(false);
            return;
          }
          
          const rawLandmarks = results.multiFaceLandmarks[0];
          
          if (!rawLandmarks || !Array.isArray(rawLandmarks) || rawLandmarks.length === 0) {
            setLandmarks(null);
            setIsTracking(false);
            return;
          }
          
          // Apply One-Euro filter to smooth landmarks - with error handling
          const smoothedLandmarks = rawLandmarks.map((point: any, index: number) => {
            try {
              if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
                return { x: 0, y: 0 };
              }
              
              if (!filtersRef.current.has(index)) {
                filtersRef.current.set(index, new PointFilter({
                  minCutoff: 1.0,
                  beta: 0.007,
                  dcutoff: 1.0,
                }));
              }
              
              const filter = filtersRef.current.get(index)!;
              return filter.filter({ x: point.x, y: point.y });
            } catch (filterError) {
              // If filtering fails, return raw point
              return { x: point.x || 0, y: point.y || 0 };
            }
          });

          setLandmarks(smoothedLandmarks);
          setIsTracking(true);
        } catch (error) {
          // Silently handle errors in onResults to prevent crashes
          console.warn('Error in face tracking onResults:', error);
          setLandmarks(null);
          setIsTracking(false);
        }
      });

      console.log('Initializing MediaPipe FaceMesh...');
      await faceMesh.initialize();
      console.log('MediaPipe FaceMesh initialized successfully!');
      
      faceMeshRef.current = faceMesh;

      // Start processing frames
      console.log('Starting frame processing...');
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

    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }

    filtersRef.current.clear();
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
