"use client";

import type { FeistelState } from "@/lib/feistel";
import { BitDisplay } from "./bit-display";

interface RoundDetailViewProps {
  state: FeistelState;
}

export function RoundDetailView({ state }: RoundDetailViewProps) {
  const lastRound =
    state.history.length > 0
      ? state.history[state.history.length - 1]
      : null;

  if (!lastRound) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-card border border-border">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Initial State
        </h3>
        <BitDisplay bits={state.L} label="L (Current)" variant="l" />
        <BitDisplay bits={state.R} label="R (Current)" variant="r" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-card border border-border">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Round {lastRound.round} Detail ({lastRound.mode})
      </h3>

      <div className="flex flex-col gap-2 py-2">
        <BitDisplay bits={lastRound.prevL} label="Input L" variant="l" />
        <BitDisplay bits={lastRound.prevR} label="Input R" variant="r" />

        <div className="border-t border-border my-1" />

        <BitDisplay
          bits={lastRound.roundKeyBits}
          label={`Key K${lastRound.round} (${lastRound.roundKey})`}
          variant="key"
        />
        <BitDisplay
          bits={lastRound.fOutput}
          label={
            lastRound.mode === "encryption"
              ? "F(R, K)"
              : "F(L, K)"
          }
          variant="f"
        />
        <BitDisplay
          bits={lastRound.xorResult}
          label={
            lastRound.mode === "encryption"
              ? "L XOR F(R,K)"
              : "R XOR F(L,K)"
          }
          variant="xor"
        />

        <div className="border-t border-border my-1" />

        <BitDisplay bits={lastRound.newL} label="Output L" variant="l" />
        <BitDisplay bits={lastRound.newR} label="Output R" variant="r" />
      </div>
    </div>
  );
}
