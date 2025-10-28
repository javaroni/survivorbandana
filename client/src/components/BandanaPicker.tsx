import type { Bandana } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BandanaPickerProps {
  bandanas: Bandana[];
  selected: Bandana | null;
  onSelect: (bandana: Bandana) => void;
  className?: string;
}

export function BandanaPicker({ bandanas, selected, onSelect, className }: BandanaPickerProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        Choose Your Bandana
      </p>
      <div className="grid grid-cols-3 gap-3">
        {bandanas.map((bandana) => {
          const isSelected = selected?.id === bandana.id;
          
          return (
            <button
              key={bandana.id}
              onClick={() => onSelect(bandana)}
              data-testid={`button-bandana-${bandana.id}`}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border-4 transition-all",
                "hover-elevate active-elevate-2",
                isSelected
                  ? "border-primary shadow-[0_0_20px_rgba(232,93,4,0.5)]"
                  : "border-border"
              )}
              aria-label={`Select ${bandana.name} bandana`}
            >
              <img
                src={bandana.imagePath}
                alt={bandana.name}
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
