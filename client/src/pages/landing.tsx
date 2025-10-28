import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Play } from "lucide-react";
import survivorLogo from "@assets/generated_images/Survivor_50_official_logo_3a48e0ed.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setLocation("/studio");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* Parchment texture background with warm gradient overlay */}
      <div 
        className="absolute inset-0 opacity-20 bg-repeat" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3' fill='%234A2C1F' /%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-3/10 pointer-events-none" />
      
      {/* Torch flicker effect corners */}
      <div className="absolute top-8 left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-torch-flicker" />
      <div className="absolute bottom-8 right-8 w-32 h-32 bg-chart-3/20 rounded-full blur-3xl animate-torch-flicker" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md animate-fade-in-scale">
        {/* Logo */}
        <div className="w-full max-w-[280px] sm:max-w-[320px]">
          <img
            src={survivorLogo}
            alt="Survivor 50"
            className="w-full h-auto drop-shadow-2xl"
            data-testid="img-logo"
          />
        </div>

        {/* Tagline */}
        <h1 
          className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground text-center uppercase tracking-tight"
          data-testid="text-tagline"
        >
          Step Into the Game
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground text-center max-w-sm leading-relaxed">
          Wear a Survivor bandana, choose your island scene, and capture your ultimate Survivor moment.
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleStart}
          size="lg"
          className="w-64 h-14 text-lg font-semibold uppercase tracking-wide shadow-2xl"
          data-testid="button-start"
        >
          <Play className="w-5 h-5 mr-2" />
          Start
        </Button>

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Camera access required • Works best in portrait mode
        </p>
      </div>
    </div>
  );
}
