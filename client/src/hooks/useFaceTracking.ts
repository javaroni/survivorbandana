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

      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: FaceMeshResults) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const rawLandmarks = results.multiFaceLandmarks[0];
          
          // Apply One-Euro filter to smooth landmarks
          const smoothedLandmarks = rawLandmarks.map((point, index) => {
            if (!filtersRef.current.has(index)) {
              filtersRef.current.set(index, new PointFilter({
                minCutoff: 1.0,
                beta: 0.007,
                dcutoff: 1.0,
              }));
            }
            
            const filter = filtersRef.current.get(index)!;
            return filter.filter({ x: point.x, y: point.y });
          });

          setLandmarks(smoothedLandmarks);
          setIsTracking(true);
        } else {
          setLandmarks(null);
        }
      });

      await faceMesh.initialize();
      faceMeshRef.current = faceMesh;

      // Start processing frames
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Failed to initialize face tracking:', err);
      setError('Failed to initialize face tracking');
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
