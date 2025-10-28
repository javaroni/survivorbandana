import type { BackgroundScene } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BackgroundPickerProps {
  backgrounds: BackgroundScene[];
  selected: BackgroundScene | null;
  onSelect: (background: BackgroundScene) => void;
  className?: string;
}

export function BackgroundPicker({ backgrounds, selected, onSelect, className }: BackgroundPickerProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        Choose Your Scene
      </p>
      <div className="grid grid-cols-3 gap-3">
        {backgrounds.map((background) => {
          const isSelected = selected?.id === background.id;
          
          return (
            <button
              key={background.id}
              onClick={() => onSelect(background)}
              data-testid={`button-background-${background.id}`}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border-4 transition-all",
                "hover-elevate active-elevate-2",
                isSelected
                  ? "border-primary shadow-[0_0_20px_rgba(232,93,4,0.5)]"
                  : "border-border"
              )}
              aria-label={`Select ${background.name} background`}
            >
              <img
                src={background.imagePath}
                alt={background.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
