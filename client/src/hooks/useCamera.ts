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
          width: { ideal: 1280, max: 1280, min: 640 },
          height: { ideal: 720, max: 720, min: 360 },
        },
        audio: false,
      });

      // Apply constraints to the video track to ensure resolution is clamped
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          // First attempt: ideal/max/min constraints
          await videoTrack.applyConstraints({
            width: { ideal: 1280, max: 1280, min: 640 },
            height: { ideal: 720, max: 720, min: 360 },
          });
          
          // Verify constraints were applied
          const settings = videoTrack.getSettings();
          console.log(`📹 Applied constraints, got: ${settings.width}x${settings.height}`);
          
          // If still above 720p, force exact values
          if (settings.width && settings.height && (settings.width > 1280 || settings.height > 720)) {
            console.warn(`⚠️ Resolution ${settings.width}x${settings.height} exceeds 720p, forcing exact values...`);
            await videoTrack.applyConstraints({
              advanced: [{ width: 1280, height: 720 }]
            });
            const finalSettings = videoTrack.getSettings();
            console.log(`📹 Forced exact resolution: ${finalSettings.width}x${finalSettings.height}`);
          } else {
            console.log('✅ Resolution constraints successfully applied');
          }
        } catch (err) {
          console.warn('⚠️ Failed to apply constraints:', err);
        }
      }

      setStream(mediaStream);
      setPermissionState('granted');

      // Wait for video element to be available
      let attempts = 0;
      while (!videoRef.current && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!videoRef.current) {
        console.error('Video element never became available');
        setError('Failed to initialize video element');
        return;
      }

      console.log('Video element found, setting srcObject');
      videoRef.current.srcObject = mediaStream;
      
      // Wait for video to be ready with timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Video load timeout, forcing ready state');
          setIsReady(true);
          resolve();
        }, 5000);

        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout);
            const actualWidth = videoRef.current?.videoWidth || 0;
            const actualHeight = videoRef.current?.videoHeight || 0;
            console.log(`📹 Camera Resolution: ${actualWidth}x${actualHeight}`);
            
            // Log actual track settings
            const track = mediaStream.getVideoTracks()[0];
            if (track) {
              const settings = track.getSettings();
              console.log(`📹 Track Settings: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
            }
            
            console.log('Video metadata loaded');
            videoRef.current?.play().then(() => {
              console.log('Video playing, setting isReady to true');
              setIsReady(true);
              resolve();
            }).catch((err) => {
              console.error('Video play error:', err);
              setIsReady(true);
              resolve();
            });
          };
        }
      });
      
      console.log('Camera started, isReady should be true');
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
