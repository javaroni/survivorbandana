import { useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
}

export function CaptureButton({ onCapture, disabled, isCapturing }: CaptureButtonProps) {
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = () => {
    if (disabled || isCapturing) return;
    
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    
    onCapture();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isCapturing}
        data-testid="button-capture"
        className={cn(
          "relative w-20 h-20 rounded-full bg-primary text-primary-foreground",
          "shadow-lg border-4 border-primary-border",
          "flex items-center justify-center",
          "transition-transform active:scale-95",
          disabled ? "opacity-50 cursor-not-allowed" : "animate-pulse-glow cursor-pointer"
        )}
        aria-label="Capture photo"
      >
        <Camera className="w-8 h-8" />
        
        {/* Concentric circles design */}
        <div className="absolute inset-0 rounded-full border-2 border-primary-foreground/30" />
        <div className="absolute inset-2 rounded-full border-2 border-primary-foreground/20" />
      </button>

      {/* Ripple effect on capture */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border-4 border-primary animate-ripple" />
        </div>
      )}
    </div>
  );
}
