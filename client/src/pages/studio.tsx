import { useState, useEffect, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import { useAudioCue } from "@/hooks/useAudioCue";
import { Button } from "@/components/ui/button";
import { PreviewModal } from "@/components/PreviewModal";
import { Camera, AlertCircle, Loader2 } from "lucide-react";
import { compositeImage, loadImage } from "@/utils/compositor";
import type { Bandana, BackgroundScene } from "@shared/schema";
import redBandanaPath from "@assets/generated_images/Red_tribal_bandana_headband_429c26b4.png";
import flameBandanaPath from "@assets/generated_images/Orange_flame_bandana_headband_5333090e.png";
import tealBandanaPath from "@assets/generated_images/Teal_ocean_bandana_headband_5495ec20.png";
import beachBgPath from "@assets/generated_images/Tropical_island_beach_paradise_76942181.png";
import campfireBgPath from "@assets/generated_images/Tribal_campfire_with_torches_0e4d6140.png";
import tribalCouncilBgPath from "@assets/generated_images/Tribal_council_night_scene_d967f43c.png";
import logoPath from "@assets/generated_images/Survivor_50_official_logo_3a48e0ed.png";

// Bandana options
const BANDANAS: Bandana[] = [
  { id: "red-tribal", name: "Red Tribal", imagePath: redBandanaPath },
  { id: "flame-orange", name: "Flame Orange", imagePath: flameBandanaPath },
  { id: "ocean-teal", name: "Ocean Teal", imagePath: tealBandanaPath },
];

// Background options
const BACKGROUNDS: BackgroundScene[] = [
  { id: "beach", name: "Island Beach", imagePath: beachBgPath },
  { id: "campfire", name: "Campfire", imagePath: campfireBgPath },
  { id: "tribal-council", name: "Tribal Council", imagePath: tribalCouncilBgPath },
];

export default function Studio() {
  const { videoRef, startCamera, permissionState, error: cameraError, isReady } = useCamera();
  const { landmarks, initialize: startTracking, isTracking } = useFaceTracking();
  const { play: playCaptureCue } = useAudioCue();

  const [selectedBandana, setSelectedBandana] = useState<Bandana>(BANDANAS[0]);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundScene>(BACKGROUNDS[0]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [showHint, setShowHint] = useState(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Start face tracking when video is ready
  useEffect(() => {
    if (isReady && videoRef.current) {
      startTracking(videoRef.current);
    }
  }, [isReady, startTracking, videoRef]);

  // Hide hint when face is detected
  useEffect(() => {
    if (landmarks && landmarks.length > 0) {
      setShowHint(false);
    }
  }, [landmarks]);

  const handleCapture = async () => {
    if (!videoRef.current || !previewCanvasRef.current || !landmarks) return;

    setIsCapturing(true);
    
    try {
      // Play capture sound
      playCaptureCue();

      // Set canvas to 1080x1920 for output
      const canvas = previewCanvasRef.current;
      canvas.width = 1080;
      canvas.height = 1920;

      // Scale landmarks from video coordinate space to canvas coordinate space
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const scaleX = canvas.width / videoWidth;
      const scaleY = canvas.height / videoHeight;

      const scaledLandmarks = landmarks.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));

      // Load all required images
      const [bandanaImg, backgroundImg, logoImg] = await Promise.all([
        loadImage(selectedBandana.imagePath),
        loadImage(selectedBackground.imagePath),
        loadImage(logoPath),
      ]);

      // Composite the final image with scaled landmarks
      await compositeImage({
        canvas,
        selfieFrame: videoRef.current,
        background: backgroundImg,
        bandana: bandanaImg,
        landmarks: scaledLandmarks,
        logo: logoImg,
      });

      // Convert to blob and URL for preview
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      const url = URL.createObjectURL(blob);
      setPreviewImage({ url, blob });
    } catch (error) {
      console.error("Capture failed:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClosePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
    }
  };

  // Show error states
  if (permissionState === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Camera Access Denied</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {cameraError || "Please allow camera access to use the AR Selfie Studio"}
        </p>
        <Button onClick={startCamera} data-testid="button-retry-camera">
          <Camera className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (permissionState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Camera Error</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {cameraError || "Unable to access camera"}
        </p>
        <Button onClick={startCamera} data-testid="button-retry-camera">
          <Camera className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Hidden canvas for compositing */}
      <canvas ref={previewCanvasRef} className="hidden" />

      {/* Video preview */}
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="video-camera"
        />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white font-display">Starting Camera...</p>
            </div>
          </div>
        )}

        {/* Face detection hint */}
        {isReady && showHint && !landmarks && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-6 py-4 rounded-lg backdrop-blur-sm">
            <p className="text-center font-display">Position your face in frame</p>
          </div>
        )}

        {/* Tracking indicator */}
        {isTracking && landmarks && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/90 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Face Detected
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border p-4 space-y-4">
        {/* Bandana picker */}
        <div>
          <p className="text-sm font-semibold mb-2 text-card-foreground">Bandana Style</p>
          <div className="flex gap-2">
            {BANDANAS.map((bandana) => (
              <button
                key={bandana.id}
                onClick={() => setSelectedBandana(bandana)}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedBandana.id === bandana.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate active-elevate-2"
                }`}
                data-testid={`button-bandana-${bandana.id}`}
              >
                {bandana.name}
              </button>
            ))}
          </div>
        </div>

        {/* Background picker */}
        <div>
          <p className="text-sm font-semibold mb-2 text-card-foreground">Background Scene</p>
          <div className="flex gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg)}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedBackground.id === bg.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate active-elevate-2"
                }`}
                data-testid={`button-background-${bg.id}`}
              >
                {bg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Capture button */}
        <Button
          onClick={handleCapture}
          disabled={!isReady || !landmarks || isCapturing}
          size="lg"
          className="w-full text-lg font-display font-bold uppercase tracking-wide"
          data-testid="button-capture"
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Capturing...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </>
          )}
        </Button>
      </div>

      {/* Preview modal */}
      {previewImage && (
        <PreviewModal
          imageUrl={previewImage.url}
          imageBlob={previewImage.blob}
          onClose={handleClosePreview}
          isOpen={!!previewImage}
        />
      )}
    </div>
  );
}
