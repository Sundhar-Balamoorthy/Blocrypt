"use client";

import { cn } from "@/lib/utils";
import type { Bit } from "@/lib/feistel";

interface BitDisplayProps {
  bits: Bit[];
  label: string;
  variant?: "l" | "r" | "f" | "key" | "xor" | "default";
  clickable?: boolean;
  onBitClick?: (index: number) => void;
  /** Optional mask of bits to highlight (e.g. changed bits) */
  highlight?: boolean[];
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
  highlight,
  className,
}: BitDisplayProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span 
        className={cn(
          "w-24 text-right text-[10px] font-black uppercase tracking-tighter shrink-0",
          variantLabelColors[variant]
        )}
      >
        {label}
      </span>
      <div className="flex gap-1.5 min-w-fit">
        {bits.map((bit, i) => {
          const isHighlighted = highlight?.[i];
          return (
            <button
              key={i}
              disabled={!clickable}
              onClick={() => clickable && onBitClick?.(i)}
              className={cn(
                "w-11 h-11 shrink-0 flex items-center justify-center rounded-lg font-mono text-lg font-black transition-all duration-300",
                bit === 1
                  ? cn(variantColors[variant], "text-foreground")
                  : "bg-[var(--bit-0)] text-muted-foreground",
                clickable &&
                  "cursor-pointer hover:ring-2 hover:ring-ring hover:scale-110",
                isHighlighted && "ring-2 ring-red-400",
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
          );
        })}
      </div>
    </div>
  );
}
