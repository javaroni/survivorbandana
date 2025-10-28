import { X, Download, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shareImage, canShareFiles } from "@/utils/share";
import { downloadBlob } from "@/utils/compositor";
import { cn } from "@/lib/utils";

interface PreviewModalProps {
  imageUrl: string;
  imageBlob: Blob;
  onClose: () => void;
  isOpen: boolean;
}

export function PreviewModal({ imageUrl, imageBlob, onClose, isOpen }: PreviewModalProps) {
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(imageBlob, `survivor-50-selfie-${timestamp}.png`);
      
      toast({
        title: "Image Saved",
        description: "Your Survivor 50 selfie has been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shared = await shareImage(imageBlob, 'survivor-50-selfie.png');
    
    if (shared) {
      toast({
        title: "Shared Successfully",
        description: "Thanks for sharing your Survivor moment!",
      });
    } else {
      if (canShareFiles()) {
        toast({
          title: "Share Cancelled",
          description: "You can download the image instead.",
        });
      } else {
        toast({
          title: "Share Not Available",
          description: "Please download the image to share manually.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-scale"
      onClick={onClose}
      data-testid="modal-preview"
    >
      <div 
        className="relative w-full max-w-md mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          data-testid="button-close-preview"
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-card text-card-foreground hover-elevate active-elevate-2 flex items-center justify-center"
          aria-label="Close preview"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image preview with parchment-style frame */}
        <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-primary/50">
          <img
            src={imageUrl}
            alt="Captured selfie"
            className="w-full h-auto"
            data-testid="img-preview"
          />
          
          {/* Burned edge effect */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(232,93,4,0.3)]" />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full text-lg font-semibold uppercase tracking-wide"
            data-testid="button-download"
          >
            <Download className="w-5 h-5 mr-2" />
            Save to Device
          </Button>

          <Button
            onClick={handleShare}
            variant="secondary"
            size="lg"
            className="w-full text-lg font-semibold uppercase tracking-wide"
            data-testid="button-share"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>

          {/* CTA Link */}
          <a
            href="https://www.cbs.com/shows/survivor/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-center text-sm text-accent-foreground/80 hover:text-accent-foreground",
              "underline decoration-accent underline-offset-4 transition-colors mt-2"
            )}
            data-testid="link-learn-more"
          >
            <ExternalLink className="w-4 h-4 inline mr-1" />
            Learn More About Survivor 50
          </a>
        </div>
      </div>
    </div>
  );
}
