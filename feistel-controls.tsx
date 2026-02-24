"use client";

import { Button } from "@/components/ui/button";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Zap,
} from "lucide-react";

interface FeistelControlsProps {
  round: number;
  totalRounds: number;
  completed: boolean;
  mode: "encryption" | "decryption";
  onNextRound: () => void;
  onReset: () => void;
  onRunAll?: () => void;
}

export function FeistelControls({
  round,
  totalRounds,
  completed,
  mode,
  onNextRound,
  onReset,
  onRunAll,
}: FeistelControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5">
          <span className="text-xs font-mono text-muted-foreground">
            ROUND
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {round}/{totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5">
          <span className="text-xs font-mono text-muted-foreground">MODE</span>
          <span className="font-mono text-sm font-bold text-foreground uppercase">
            {mode === "encryption" ? "ENC" : "DEC"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={onNextRound}
          disabled={completed}
          size="sm"
          className="gap-1.5"
        >
          <ChevronRight className="h-4 w-4" />
          Next Round
        </Button>

        {onRunAll && (
          <Button
            onClick={onRunAll}
            disabled={completed}
            size="sm"
            variant="secondary"
            className="gap-1.5"
          >
            <Play className="h-4 w-4" />
            Run All
          </Button>
        )}

        <Button
          onClick={onReset}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {completed && (
        <div className="flex items-center gap-2 text-xs font-mono rounded-md bg-[var(--bit-r)]/15 text-[var(--bit-r)] px-3 py-2">
          <Zap className="h-3.5 w-3.5" />
          All {totalRounds} rounds completed
        </div>
      )}
    </div>
  );
}
