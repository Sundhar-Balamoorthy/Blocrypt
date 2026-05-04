"use client";

import { Button } from "@/components/ui/button";
import { SkipForward, RotateCcw, Zap } from "lucide-react";

interface SDESControlsProps {
  step: number;
  completed: boolean;
  mode: "encryption" | "decryption";
  onNextStep: () => void;
  onReset: () => void;
  onRunAll: () => void;
}

const STEP_LABELS = [
  "Ready — press Next Step to begin",
  "After IP (Initial Permutation)",
  "After f_K (Round 1)",
  "After SW (Swap Halves)",
  "After f_K (Round 2) + IP⁻¹ — Done ✓",
];

export function SDESControls({
  step,
  completed,
  mode,
  onNextStep,
  onReset,
  onRunAll,
}: SDESControlsProps) {
  const handleReset = () => {
    onReset();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Step counter */}
      <div className="flex items-center gap-3 font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Step
          </span>
          <span className="text-sm font-bold text-foreground">
            {step}/4
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Mode
          </span>
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
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(step / 4) * 100}%`,
            background: "linear-gradient(90deg, #818cf8, #60a5fa, #34d399, #f59e0b, #fbbf24)",
          }}
        />
      </div>

      {/* Current step label */}
      <div className="px-3 py-2 rounded-md bg-card border border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Current Step
        </span>
        <p className="text-xs font-mono text-foreground mt-0.5">
          {STEP_LABELS[step]}
        </p>
      </div>

      {/* Status */}
      {completed && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#4ade80] font-mono text-xs font-bold">
          ✓ All steps completed
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Next Step */}
        <Button
          onClick={onNextStep}
          disabled={completed}
          className="gap-1.5 w-full"
        >
          <SkipForward className="h-4 w-4" />
          Next Step
        </Button>

        {/* Run All */}
        <Button
          variant="outline"
          onClick={onRunAll}
          disabled={completed}
          className="gap-1.5 w-full"
        >
          <Zap className="h-4 w-4" />
          Run All
        </Button>

        {/* Reset */}
        <Button
          variant="ghost"
          onClick={handleReset}
          className="gap-1.5 w-full"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
