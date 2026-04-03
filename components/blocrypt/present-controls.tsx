"use client";

import { Button } from "@/components/ui/button";
import { Play, SkipForward, RotateCcw } from "lucide-react";
import { MIN_PRESENT_ROUNDS, MAX_PRESENT_ROUNDS } from "@/lib/present";

interface PresentControlsProps {
  round: number;
  totalRounds: number;
  completed: boolean;
  mode: "encryption" | "decryption";
  onNextRound: () => void;
  onReset: () => void;
  onRunAll: () => void;
  onRoundsChange: (r: number) => void;
}

export function PresentControls({
  round,
  totalRounds,
  completed,
  mode,
  onNextRound,
  onReset,
  onRunAll,
  onRoundsChange,
}: PresentControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Round counter */}
      <div className="flex items-center gap-3 font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Round</span>
          <span className="text-sm font-bold text-foreground">
            {round}/{totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Mode</span>
          <span
            className={`text-sm font-bold ${
              mode === "encryption" ? "text-[var(--bit-l)]" : "text-[var(--bit-r)]"
            }`}
          >
            {mode === "encryption" ? "ENC" : "DEC"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(round / totalRounds) * 100}%` }}
        />
      </div>

      {/* Completed badge */}
      {completed && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#4ade80] font-mono text-xs font-bold">
          ✓ All rounds completed
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <Button onClick={onNextRound} disabled={completed} className="gap-1.5 w-full">
          <SkipForward className="h-4 w-4" />
          Next Round
        </Button>
        <Button variant="secondary" onClick={onRunAll} disabled={completed} className="gap-1.5 w-full">
          <Play className="h-4 w-4" />
          Run All
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-1.5 w-full">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Rounds slider */}
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Rounds:</span>
          <span className="text-xs font-mono font-bold text-foreground">{totalRounds}</span>
        </div>
        <input
          type="range"
          min={MIN_PRESENT_ROUNDS}
          max={MAX_PRESENT_ROUNDS}
          value={totalRounds}
          onChange={(e) => onRoundsChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-muted rounded accent-primary"
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{MIN_PRESENT_ROUNDS}</span>
          <span>{MAX_PRESENT_ROUNDS}</span>
        </div>
      </div>
    </div>
  );
}
