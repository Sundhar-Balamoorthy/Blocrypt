"use client";

import { cn } from "@/lib/utils";
import type { Bit } from "@/lib/feistel";

// Use -1 to represent an unfilled "hidden" bit
export type PracticeBit = Bit | -1;

interface PracticeBitDisplayProps {
  bits: PracticeBit[]; // The student's current input
  answer: Bit[]; // The correct answer
  hiddenIndices: number[]; // Which indices were hidden
  label: string;
  variant?: "l" | "r" | "f" | "key" | "xor" | "default";
  onBitClick?: (index: number) => void;
  showFeedback?: boolean; 
}

const variantColors: Record<string, string> = {
  l: "bg-[var(--bit-l)]",
  r: "bg-[var(--bit-r)]",
  f: "bg-[var(--bit-f)]",
  key: "bg-[var(--bit-key)]",
  xor: "bg-[var(--bit-xor)]",
  default: "bg-muted",
};

export function PracticeBitDisplay({
  bits,
  answer,
  hiddenIndices,
  label,
  variant = "default",
  onBitClick,
  showFeedback = false,
}: PracticeBitDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-right text-[14px] leading-tight font-mono font-bold shrink-0 text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <div className="flex gap-2">
        {answer.map((correctBit, i) => {
          const isHidden = hiddenIndices.includes(i);
          const studentBit = bits[i];
          const isCorrect = studentBit === correctBit;
          
          const isFilled = studentBit !== -1;
 
          return (
            <button
              key={i}
              disabled={!isHidden}
              onClick={() => isHidden && onBitClick?.(i)}
              className={cn(
                "w-12 h-12 shrink-0 flex items-center justify-center rounded-lg font-mono text-lg font-bold transition-all duration-200",
                // Non-hidden bits (given)
                !isHidden && (correctBit === 1 ? cn(variantColors[variant], "text-foreground") : "bg-[var(--bit-0)] text-muted-foreground opacity-60"),
                
                // Hidden but unfilled
                isHidden && !isFilled && "bg-secondary/40 border-2 border-dashed border-border text-muted-foreground/50",
                
                // Hidden and filled
                isHidden && isFilled && (studentBit === 1 ? "bg-primary text-primary-foreground" : "bg-[var(--bit-0)] text-muted-foreground"),
                
                // Feedback
                showFeedback && isHidden && isFilled && (isCorrect ? "ring-4 ring-green-500" : "ring-4 ring-red-500 ring-offset-2 ring-offset-background"),
                
                isHidden ? "cursor-pointer hover:ring-2 hover:ring-ring" : "cursor-default"
              )}
            >
              {!isHidden ? correctBit : (studentBit === -1 ? "?" : studentBit)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
