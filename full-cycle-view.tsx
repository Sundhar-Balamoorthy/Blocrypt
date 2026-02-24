"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Bit,
  type FullCycleResult,
  runFullCycle,
  DEFAULT_PLAINTEXT,
  DEFAULT_KEYS,
  DEFAULT_ROUNDS,
} from "@/lib/feistel";
import { BitDisplay } from "./bit-display";
import { RoundSchematic } from "./round-schematic";
import { Play, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

export function FullCycleView() {
  const [result, setResult] = useState<FullCycleResult | null>(null);

  const handleRunCycle = useCallback(() => {
    const r = runFullCycle(
      DEFAULT_PLAINTEXT as Bit[],
      DEFAULT_ROUNDS,
      DEFAULT_KEYS
    );
    setResult(r);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleRunCycle} className="gap-1.5">
          <Play className="h-4 w-4" />
          Run Full Cycle
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          Encrypt {DEFAULT_ROUNDS} rounds, then Decrypt {DEFAULT_ROUNDS} rounds
        </span>
      </div>

      {result && (
        <ScrollArea className="h-[680px] w-full rounded-lg border border-border bg-card">
          <div className="p-6 flex flex-col gap-6">
            {/* Original plaintext */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Original Plaintext
              </span>
              <BitDisplay
                bits={result.original}
                label="Plaintext"
                variant="l"
              />
            </div>

            {/* ── Encryption Phase ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#3b82f6]/30" />
                <span className="text-xs font-mono font-bold text-[#60a5fa] uppercase tracking-wider px-2">
                  Encryption Phase
                </span>
                <div className="h-px flex-1 bg-[#3b82f6]/30" />
              </div>

              {result.encryptionHistory.map((round, i) => (
                <div key={`enc-${i}`} className="flex flex-col items-center gap-1">
                  <RoundSchematic round={round} phase="encryption" />
                  {i < result.encryptionHistory.length - 1 && (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Ciphertext */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
              <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest">
                Ciphertext
              </span>
              <BitDisplay
                bits={result.ciphertext}
                label="Cipher"
                variant="f"
              />
            </div>

            {/* ── Decryption Phase ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#22c55e]/30" />
                <span className="text-xs font-mono font-bold text-[#4ade80] uppercase tracking-wider px-2">
                  Decryption Phase
                </span>
                <div className="h-px flex-1 bg-[#22c55e]/30" />
              </div>

              {result.decryptionHistory.map((round, i) => (
                <div key={`dec-${i}`} className="flex flex-col items-center gap-1">
                  <RoundSchematic round={round} phase="decryption" />
                  {i < result.decryptionHistory.length - 1 && (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Verification */}
            <div
              className={`flex items-center gap-2 rounded-md px-4 py-3 font-mono text-sm font-bold ${
                result.success
                  ? "bg-[#22c55e]/15 text-[#4ade80]"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {result.success
                ? "ROUND-TRIP SUCCESSFUL - Recovered matches original"
                : "RECOVERY FAILED - Mismatch detected"}
            </div>

            {/* Recovered */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Recovered Plaintext
              </span>
              <BitDisplay
                bits={result.recovered}
                label="Recovered"
                variant="r"
              />
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
