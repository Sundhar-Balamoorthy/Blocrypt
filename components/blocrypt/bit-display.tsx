"use client";

import { cn } from "@/lib/utils";
import type { Bit } from "@/lib/feistel";

interface BitDisplayProps {
  bits: Bit[];
  label: string;
  variant?: "l" | "r" | "f" | "key" | "xor" | "default";
  clickable?: boolean;
  onBitClick?: (index: number) => void;
  className?: string;
}

const variantColors: Record<string, string> = {
  l: "bg-[var(--bit-l)]",
  r: "bg-[var(--bit-r)]",
  f: "bg-[var(--bit-f)]",
  key: "bg-[var(--bit-key)]",
  xor: "bg-[var(--bit-xor)]",
  default: "bg-muted",
};

const variantLabelColors: Record<string, string> = {
  l: "text-[var(--bit-l)]",
  r: "text-[var(--bit-r)]",
  f: "text-[var(--bit-f)]",
  key: "text-[var(--bit-key)]",
  xor: "text-[var(--bit-xor)]",
  default: "text-muted-foreground",
};

export function BitDisplay({
  bits,
  label,
  variant = "default",
  clickable = false,
  onBitClick,
  className,
}: BitDisplayProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "w-40 text-right text-xs font-mono font-semibold shrink-0",
          variantLabelColors[variant]
        )}
      >
        {label}
      </span>
      <div className="flex gap-1">
        {bits.map((bit, i) => (
          <button
            key={i}
            disabled={!clickable}
            onClick={() => clickable && onBitClick?.(i)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded font-mono text-sm font-bold transition-all duration-200",
              bit === 1
                ? cn(variantColors[variant], "text-foreground")
                : "bg-[var(--bit-0)] text-muted-foreground",
              clickable &&
                "cursor-pointer hover:ring-2 hover:ring-ring hover:scale-110",
              !clickable && "cursor-default"
            )}
            aria-label={
              clickable
                ? `Bit ${i}: ${bit}. Click to flip.`
                : `Bit ${i}: ${bit}`
            }
          >
            {bit}
          </button>
        ))}
      </div>
    </div>
  );
}
