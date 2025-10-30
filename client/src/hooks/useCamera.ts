import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraPermissionState } from "@shared/schema";

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  permissionState: CameraPermissionState;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isReady: boolean;
}

export function useCamera(): UseCameraReturn {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedRef = useRef(false);
  
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    // If already running, just ensure video is attached
    if (startedRef.current && streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      return;
    }

    try {
      setError(null);
      
      // Guard against StrictMode double-invoke in development
      if (startedRef.current && import.meta.env.DEV) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, max: 1280, min: 640 },
          height: { ideal: 720, max: 720, min: 360 },
        },
        audio: false,
      });

      // Apply constraints to video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            width: { ideal: 1280, max: 1280, min: 640 },
            height: { ideal: 720, max: 720, min: 360 },
          });
          
          const settings = videoTrack.getSettings();
          console.log(`📹 Camera: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
        } catch (err) {
          console.warn('⚠️ Failed to apply constraints:', err);
        }
      }

      streamRef.current = stream;
      startedRef.current = true;
      setPermissionState('granted');

      // Attach to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            console.log('✅ Camera ready');
            setIsReady(true);
          }).catch((err) => {
            console.error('Video play error:', err);
            setIsReady(true);
          });
        };
      } else {
        setIsReady(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionState('denied');
          setError('Camera permission was denied. Please allow camera access to continue.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermissionState('error');
          setError('No camera found on this device.');
        } else {
          setPermissionState('error');
          setError('Failed to access camera. Please try again.');
        }
      }
      
      startedRef.current = false;
      streamRef.current = null;
      setIsReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    startedRef.current = false;
    setIsReady(false);
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream: streamRef.current,
    permissionState,
    error,
    startCamera,
    stopCamera,
    isReady,
  };
}
