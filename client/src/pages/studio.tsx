import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BandanaPicker } from "@/components/BandanaPicker";
import { BackgroundPicker } from "@/components/BackgroundPicker";
import { CaptureButton } from "@/components/CaptureButton";
import { PreviewModal } from "@/components/PreviewModal";
import { useCamera } from "@/hooks/useCamera";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import { useAudioCue } from "@/hooks/useAudioCue";
import { compositeImage, loadImage, drawWrappedBandana } from "@/utils/compositor";
import type { Bandana, BackgroundScene } from "@shared/schema";

import survivorBandana from "@assets/bandana_artwork_1761672466949.png";

import beachBg from "@assets/generated_images/Tropical_island_beach_paradise_76942181.png";
import campfireBg from "@assets/generated_images/Tribal_campfire_with_torches_0e4d6140.png";
import tribalCouncilBg from "@assets/generated_images/Tribal_council_night_scene_d967f43c.png";

const BANDANAS: Bandana[] = [
  { id: "survivor", name: "Survivor 50", imagePath: survivorBandana },
];

const BACKGROUNDS: BackgroundScene[] = [
  { id: "beach", name: "Island Beach", imagePath: beachBg },
  { id: "campfire", name: "Campfire", imagePath: campfireBg },
  { id: "tribal", name: "Tribal Council", imagePath: tribalCouncilBg },
];

export default function Studio() {
  const [, setLocation] = useLocation();
  const [selectedBandana, setSelectedBandana] = useState<Bandana | null>(BANDANAS[0]);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundScene | null>(BACKGROUNDS[0]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandanaImageRef = useRef<HTMLImageElement | null>(null);

  const { videoRef, permissionState, error: cameraError, startCamera, isReady } = useCamera();
  const { landmarks, isTracking, initialize: initTracking, error: trackingError } = useFaceTracking();
  const { play: playAudioCue, initializeAudio } = useAudioCue();

  // Initialize camera and face tracking on mount
  useEffect(() => {
    const init = async () => {
      console.log('Starting camera initialization...');
      await startCamera();
      console.log('Camera started');
      await initializeAudio();
      console.log('Audio initialized');
    };
    init();
  }, []);

  // Start face tracking when camera is ready
  useEffect(() => {
    console.log('isReady changed:', isReady, 'videoRef.current:', !!videoRef.current);
    if (isReady && videoRef.current) {
      console.log('Initializing face tracking...');
      initTracking(videoRef.current);
    }
  }, [isReady, initTracking]);

  // Load bandana image when selection changes
  useEffect(() => {
    if (selectedBandana) {
      console.log('Loading bandana image:', selectedBandana.imagePath);
      loadImage(selectedBandana.imagePath).then(img => {
        console.log('Bandana image loaded:', img.width, 'x', img.height);
        bandanaImageRef.current = img;
      }).catch(err => {
        console.error('Failed to load bandana image:', err);
      });
    }
  }, [selectedBandana]);

  // Render live preview with bandana overlay
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isReady) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Mirror the video horizontally for selfie mode
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Draw bandana overlay if face detected
          if (landmarks && landmarks.length > 0 && bandanaImageRef.current) {
            // Apply same mirroring as video for consistency
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            drawWrappedBandana(ctx, bandanaImageRef.current, landmarks, canvas.width, canvas.height);
            ctx.restore();
          }
        }
      } catch (error) {
        console.error('Render error:', error);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isReady, landmarks]);

  const handleCapture = async () => {
    if (!videoRef.current || !selectedBackground || isCapturing) {
      console.log('Capture blocked:', { 
        hasVideo: !!videoRef.current, 
        hasBackground: !!selectedBackground, 
        isCapturing 
      });
      return;
    }

    setIsCapturing(true);
    console.log('Starting capture with background:', selectedBackground.name);

    try {
      // Play audio cue
      await playAudioCue();

      // Small delay for audio feedback
      await new Promise(resolve => setTimeout(resolve, 100));

      // Load background image
      console.log('Loading background image:', selectedBackground.imagePath);
      const bgImage = await loadImage(selectedBackground.imagePath);
      console.log('Background loaded successfully');
      
      // Composite the final image
      console.log('Compositing image...');
      const blob = await compositeImage({
        backgroundImage: bgImage,
        videoFrame: videoRef.current,
        bandanaImage: bandanaImageRef.current,
        landmarks: landmarks,
      });
      console.log('Composite complete');

      const url = URL.createObjectURL(blob);
      setCapturedImage({ url, blob });
      setShowPreview(true);
    } catch (error) {
      console.error('Capture failed:', error);
      alert('Capture failed: ' + (error as Error).message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  };

  if (permissionState === 'denied' || cameraError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-xl text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-display font-bold text-card-foreground">
            Camera Access Required
          </h2>
          <p className="text-muted-foreground">
            {cameraError || "Please allow camera access to use the AR Selfie Studio."}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={startCamera} data-testid="button-retry-camera">
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => setLocation("/")} data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-card">
      {/* Hidden video element - always rendered so ref works */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />

      {!isReady ? (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-display font-bold text-foreground">
              Preparing Your Adventure...
            </h2>
            <p className="text-muted-foreground">
              Initializing camera and face tracking
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-card-border bg-card/80 backdrop-blur-md z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-display font-bold uppercase tracking-wide">
              AR Studio
            </h1>
            <div className="w-10" />
          </header>

          {/* Camera Preview */}
          <div className="flex-1 relative bg-black overflow-hidden">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="canvas-preview"
            />

            {/* Face detection indicator */}
            {!isTracking && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full z-20">
                <p className="text-xs text-white">Position your face in frame</p>
              </div>
            )}

            {trackingError && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive/90 backdrop-blur-sm px-4 py-2 rounded-full z-20">
                <p className="text-xs text-destructive-foreground">{trackingError}</p>
              </div>
            )}

            {/* Capture Button (centered at bottom) */}
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
              <CaptureButton
                onCapture={handleCapture}
                disabled={!isTracking || !selectedBackground}
                isCapturing={isCapturing}
              />
            </div>
          </div>

          {/* Picker Panel */}
          <div className="bg-card/90 backdrop-blur-lg border-t border-card-border p-4 space-y-4 animate-slide-up">
            <BandanaPicker
              bandanas={BANDANAS}
              selected={selectedBandana}
              onSelect={setSelectedBandana}
            />
            
            <BackgroundPicker
              backgrounds={BACKGROUNDS}
              selected={selectedBackground}
              onSelect={setSelectedBackground}
            />
          </div>

          {/* Preview Modal */}
          {capturedImage && (
            <PreviewModal
              imageUrl={capturedImage.url}
              imageBlob={capturedImage.blob}
              onClose={handleClosePreview}
              isOpen={showPreview}
            />
          )}
        </>
      )}
    </div>
  );
}
