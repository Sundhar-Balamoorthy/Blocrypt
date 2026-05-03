"use client";

import { Button } from "@/components/ui/button";
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  Zap,
  Info
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 border border-border">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            ROUND
          </span>
          <span className="font-mono text-lg font-black text-primary">
            {round}/{totalRounds}
          </span>
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-popover text-[10px] rounded border border-border hidden group-hover:block z-50">
              Ciphers process data in sequential rounds. More rounds = more security.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 border border-border">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">MODE</span>
          <span
            className={`font-mono text-lg font-black uppercase ${
              mode === "encryption" ? "text-[var(--bit-l)]" : "text-[var(--bit-r)]"
            }`}
          >
            {mode === "encryption" ? "ENC" : "DEC"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={onNextRound}
          disabled={completed}
          size="lg"
          className="gap-2 h-12 px-6 text-sm font-bold shadow-lg shadow-primary/10"
        >
          <ChevronRight className="h-5 w-5" />
          Next Round
        </Button>

        {onRunAll && (
          <Button
            onClick={onRunAll}
            disabled={completed}
            size="lg"
            variant="secondary"
            className="gap-2 h-12 px-6 text-sm font-bold border border-primary/10"
          >
            <Play className="h-5 w-5" />
            Run All
          </Button>
        )}

        <Button
          onClick={onReset}
          size="lg"
          variant="outline"
          className="gap-2 h-12 px-6 text-sm font-bold border-primary/10 hover:bg-primary/5"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </Button>
      </div>

      {completed && (
        <div className="flex items-center gap-3 text-sm font-bold rounded-xl bg-emerald-500/10 text-emerald-500 px-4 py-3 border border-emerald-500/20 animate-in zoom-in-95 duration-300">
          <Zap className="h-4 w-4 fill-current" />
          Simulation complete! Final state reached.
        </div>
      )}
    </div>
  );
}
