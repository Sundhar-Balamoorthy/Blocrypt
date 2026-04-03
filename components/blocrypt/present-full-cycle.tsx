"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import {
  type Bit,
  type PRESENTFullCycleResult,
  presentFullCycle,
  DEFAULT_PRESENT_PLAINTEXT,
  DEFAULT_PRESENT_KEY80,
  DEFAULT_PRESENT_ROUNDS,
} from "@/lib/present";

function NibbleDisplay({ 
  bits, 
  label, 
  clickable, 
  onBitClick 
}: { 
  bits: (0|1)[]; 
  label: string;
  clickable?: boolean;
  onBitClick?: (idx: number) => void;
}) {
  if (!bits || bits.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 16 }, (_, n) => (
          <div key={n} className="flex gap-0.5 border border-border/50 rounded px-0.5 py-0.5">
            {bits.slice(n * 4, n * 4 + 4).map((bit, j) => {
              const idx = n * 4 + j;
              return (
                <button
                  key={j}
                  disabled={!clickable}
                  onClick={() => clickable && onBitClick?.(idx)}
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all
                    ${bit === 1 ? "bg-[var(--bit-f)] text-foreground" : "bg-[var(--bit-0)] text-muted-foreground"}
                    ${clickable ? "cursor-pointer hover:ring-1 hover:ring-ring hover:scale-110" : "cursor-default"}
                  `}
                >
                  {bit}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PresentFullCycle() {
  const [plaintext, setPlaintext] = useState<Bit[]>(DEFAULT_PRESENT_PLAINTEXT as Bit[]);
  const [key80, setKey80] = useState<Bit[]>(DEFAULT_PRESENT_KEY80 as Bit[]);
  const [result, setResult] = useState<PRESENTFullCycleResult | null>(null);
  const [rounds, setRounds] = useState(DEFAULT_PRESENT_ROUNDS);

  const handleRun = useCallback(() => {
    const r = presentFullCycle(plaintext, key80, rounds);
    setResult(r);
  }, [plaintext, key80, rounds]);

  const handleReset = useCallback(() => setResult(null), []);

  const handleFlipPlaintext = useCallback((idx: number) => {
    const newP = [...plaintext];
    newP[idx] = (newP[idx] === 0 ? 1 : 0) as Bit;
    setPlaintext(newP as Bit[]);
    if (result) setResult(presentFullCycle(newP as Bit[], key80, rounds));
  }, [plaintext, key80, rounds, result]);

  const handleFlipKey = useCallback((idx: number) => {
    const newK = [...key80];
    newK[idx] = (newK[idx] === 0 ? 1 : 0) as Bit;
    setKey80(newK as Bit[]);
    if (result) setResult(presentFullCycle(plaintext, newK as Bit[], rounds));
  }, [plaintext, key80, rounds, result]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 p-4 rounded-lg bg-card border border-border">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
            Setup (bits are clickable)
          </span>
          <NibbleDisplay 
            bits={plaintext} 
            label="Plaintext (64-bit)" 
            clickable 
            onBitClick={handleFlipPlaintext} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Key (80-bit)</span>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 20 }, (_, n) => (
                <div key={n} className="flex gap-0.5 border border-border/50 rounded px-0.5 py-0.5">
                  {key80.slice(n * 4, n * 4 + 4).map((bit, j) => {
                    const idx = n * 4 + j;
                    return (
                      <button
                        key={j}
                        onClick={() => handleFlipKey(idx)}
                        className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-mono font-bold transition-all
                          ${bit === 1 ? "bg-[var(--bit-key)] text-foreground" : "bg-[var(--bit-0)] text-muted-foreground"}
                          cursor-pointer hover:ring-1 hover:ring-ring
                        `}
                      >
                        {bit}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap border-t border-border pt-3">
          <Button onClick={handleRun} className="gap-1.5">
            <Play className="h-4 w-4" />
            Run Full Cycle
          </Button>
          <Button variant="secondary" onClick={handleReset} className="gap-1.5">Reset</Button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-mono text-muted-foreground">Rounds:</span>
            <input
              type="range" min={1} max={8} value={rounds}
              onChange={(e) => { setRounds(parseInt(e.target.value)); if (result) handleRun(); }}
              className="w-24 h-1.5 bg-muted rounded accent-primary"
            />
            <span className="text-xs font-mono font-bold text-foreground w-4">{rounds}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        Encrypts 64-bit plaintext through {rounds} PRESENT round(s), then decrypts and verifies round-trip.
      </p>

      {result && (
        <div className="flex flex-col gap-6 p-6 rounded-lg border border-border bg-card">
          {/* Plaintext */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/40 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Original Plaintext (64-bit)</span>
            <NibbleDisplay bits={result.plaintext} label="Plain" />
          </div>

          {/* Encryption */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#3b82f6]/30" />
              <span className="text-xs font-mono font-bold text-[#60a5fa] uppercase tracking-wider px-2">Encryption</span>
              <div className="h-px flex-1 bg-[#3b82f6]/30" />
            </div>
            {result.encryptState.history.map((r) => (
              <div key={r.round} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Round {r.round}: addRoundKey → S-box{!r.isLastRound ? " → P-layer" : " (no P-layer)"}
                </span>
                {!r.isLastRound && r.afterPLayer.length > 0 && (
                  <NibbleDisplay bits={r.afterPLayer} label="Round output" />
                )}
                {r.isLastRound && <NibbleDisplay bits={r.afterSBox} label="After S-box (final round)" />}
              </div>
            ))}
          </div>

          {/* Ciphertext */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest">Ciphertext (64-bit)</span>
            <NibbleDisplay bits={result.ciphertext} label="Cipher" />
          </div>

          {/* Decryption */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#22c55e]/30" />
              <span className="text-xs font-mono font-bold text-[#4ade80] uppercase tracking-wider px-2">Decryption</span>
              <div className="h-px flex-1 bg-[#22c55e]/30" />
            </div>
            {result.decryptState.history.map((r) => (
              <div key={r.round} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Round {r.round}: {r.isLastRound ? "S-box⁻¹ → addRoundKey" : "P-layer⁻¹ → S-box⁻¹ → addRoundKey"}
                </span>
                <NibbleDisplay bits={r.afterPLayer} label="Round output" />
              </div>
            ))}
          </div>

          {/* Recovered */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/40 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Recovered Plaintext</span>
            <NibbleDisplay bits={result.recovered} label="Recovered" />
          </div>

          {/* Verification */}
          <div className={`flex items-center gap-2 rounded-md px-4 py-3 font-mono text-sm font-bold ${
            result.success ? "bg-[#22c55e]/15 text-[#4ade80]" : "bg-destructive/15 text-destructive"
          }`}>
            {result.success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {result.success
              ? "ROUND-TRIP SUCCESSFUL — Recovered matches original"
              : "RECOVERY FAILED — Mismatch detected"}
          </div>
        </div>
      )}
    </div>
  );
}
