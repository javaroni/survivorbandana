import { useState, useEffect, useRef } from 'react';
import type { CameraPermissionState } from '@shared/schema';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = async () => {
    try {
      setError(null);
      setPermissionState('prompt');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                setIsReady(true);
                resolve();
              });
            };
          }
        });
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
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    stream,
    permissionState,
    error,
    startCamera,
    stopCamera,
    isReady,
  };
}
