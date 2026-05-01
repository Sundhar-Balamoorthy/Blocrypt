"use client";

import type { PRESENTState, PRESENTRoundState } from "@/lib/present";
import { BitDisplay } from "./bit-display";
import { SBOX, P_LAYER } from "@/lib/present";
import { Grid3X3 } from "lucide-react";

interface PresentRoundDetailViewProps {
  state: PRESENTState;
  onPlaintextFlip?: (idx: number) => void;
  onKeyFlip?: (idx: number) => void;
}

// Helper: display a 64-bit array as 16 groups of 4 (nibbles)
export function NibbleRow({ 
  bits, 
  label, 
  variant, 
  clickable, 
  onBitClick 
}: { 
  bits: (0|1)[]; 
  label: string; 
  variant: "l"|"r"|"f"|"key"|"xor"|"default";
  clickable?: boolean;
  onBitClick?: (index: number) => void;
}) {
  if (!bits || bits.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 16 }, (_, n) => (
          <div key={n} className="flex gap-0.5 border border-[#334155] rounded px-0.5 py-0.5">
            {bits.slice(n * 4, n * 4 + 4).map((bit, j) => {
              const globalIdx = n * 4 + j;
              return (
                <button
                  key={j}
                  disabled={!clickable}
                  onClick={() => clickable && onBitClick?.(globalIdx)}
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all duration-200
                    ${bit === 1
                      ? variant === "l" ? "bg-[var(--bit-l)] text-foreground"
                      : variant === "r" ? "bg-[var(--bit-r)] text-foreground"
                      : variant === "f" ? "bg-[var(--bit-f)] text-foreground"
                      : variant === "key" ? "bg-[var(--bit-key)] text-foreground"
                      : variant === "xor" ? "bg-[var(--bit-xor)] text-foreground"
                      : "bg-muted text-foreground"
                      : "bg-[var(--bit-0)] text-muted-foreground"
                    }
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

function TableGrid({ title, table, cols }: { title: string; table: number[]; cols: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-muted-foreground uppercase whitespace-nowrap">{title}</span>
      <div 
        className="grid gap-0.5 shrink-0" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {table.map((val, i) => (
          <div 
            key={i} 
            className="bg-[#1e293b] border border-[#334155] rounded p-0.5 text-center font-mono text-[8px]"
            title={`Index ${i} maps to ${val}`}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── S-Box 4×4 Lookup Table + per-nibble cards (simulator) ────────────────────
function SBoxNibbleDetails({
  afterAddKey, afterSBox,
}: { afterAddKey: (0|1)[]; afterSBox: (0|1)[] }) {
  const nibbles = Array.from({ length: 16 }, (_, n) => {
    const inNib  = afterAddKey.slice(n * 4, n * 4 + 4) as (0|1)[];
    const outNib = afterSBox.slice(n * 4, n * 4 + 4) as (0|1)[];
    const inVal  = parseInt(inNib.join(""), 2);
    const outVal = SBOX[inVal];
    const row = inVal >> 2;
    const col = inVal & 3;
    return { inNib, outNib, inVal, outVal, row, col, idx: n };
  });

  const activeRows  = new Set(nibbles.map(n => n.row));
  const activeCols  = new Set(nibbles.map(n => n.col));
  const activeCells = new Set(nibbles.map(n => `${n.row},${n.col}`));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-widest">
        S-Box — 4×4 Lookup Table (Row = bits[0,1], Col = bits[2,3])
      </span>

      {/* 4×4 S-Box Table */}
      <div className="flex flex-col gap-0.5 items-start">
        {/* Column headers */}
        <div className="flex gap-0.5" style={{ marginLeft: 32 }}>
          {[0, 1, 2, 3].map(c => (
            <div key={c} className={`w-9 text-center font-mono text-[9px] font-bold rounded py-0.5 ${
              activeCols.has(c) ? "text-[#f59e0b] bg-[#451a03]" : "text-muted-foreground"
            }`}>c{c}</div>
          ))}
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3].map(r => (
          <div key={r} className="flex gap-0.5 items-center">
            <div className={`w-7 text-center font-mono text-[9px] font-bold rounded py-0.5 ${
              activeRows.has(r) ? "text-[#f59e0b] bg-[#451a03]" : "text-muted-foreground"
            }`}>r{r}</div>
            {[0, 1, 2, 3].map(c => {
              const val = SBOX[r * 4 + c];
              const isActive = activeCells.has(`${r},${c}`);
              return (
                <div key={c} className={`w-9 h-9 flex items-center justify-center font-mono text-sm font-bold rounded ${
                  isActive
                    ? "bg-[#f59e0b] text-[#0a0f1c] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    : "bg-[#1e293b] text-muted-foreground border border-[#334155]"
                }`}>
                  {val.toString(16).toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Per-nibble lookup cards */}
      <div className="flex flex-wrap gap-1.5">
        {nibbles.map(n => (
          <div key={n.idx} className="flex flex-col items-center gap-0.5 bg-[#0f172a] border border-[#334155] rounded p-1.5 min-w-[60px]">
            <span className="text-[8px] font-mono text-muted-foreground font-bold">S{n.idx}</span>
            {/* Input bits */}
            <div className="flex gap-px">
              {n.inNib.map((b, i) => (
                <div key={i} className={`w-4 h-4 flex items-center justify-center rounded-sm text-[8px] font-mono font-bold ${
                  b === 1 ? "bg-[#78350f] text-[#f59e0b] border border-[#92400e]" : "bg-[#1e293b] text-muted-foreground border border-[#1e293b]"
                }`}>{b}</div>
              ))}
            </div>
            {/* Row/Col + result */}
            <span className="text-[7px] font-mono text-muted-foreground">
              {n.inVal.toString(16).toUpperCase()} → r{n.row}c{n.col}
            </span>
            <span className="text-[8px] font-mono font-bold bg-[#f59e0b] text-[#0a0f1c] rounded px-1.5">
              S[{n.inVal.toString(16).toUpperCase()}]={n.outVal.toString(16).toUpperCase()}
            </span>
            {/* Output bits */}
            <div className="flex gap-px">
              {n.outNib.map((b, i) => (
                <div key={i} className={`w-4 h-4 flex items-center justify-center rounded-sm text-[8px] font-mono font-bold ${
                  b === 1 ? "bg-[#78350f] text-[#f59e0b] border border-[#92400e]" : "bg-[#1e293b] text-muted-foreground border border-[#1e293b]"
                }`}>{b}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── P-Layer per-nibble permutation cards (S-DES P4 style) ────────────────────
function PLayerPermCards({
  inputBits, outputBits,
}: { inputBits: (0|1)[]; outputBits: (0|1)[] }) {
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");

  const nibbleCards = Array.from({ length: 16 }, (_, nib) => {
    const start = nib * 4;
    const bits = Array.from({ length: 4 }, (_, j) => {
      const idx = start + j;
      const dest = P_LAYER[idx];
      return {
        idx,
        inputVal: inputBits[idx] as (0|1),
        dest,
        destNib: Math.floor(dest / 4),
        outputVal: outputBits[dest] as (0|1),
      };
    });
    const destNibs = [...new Set(bits.map(b => b.destNib))].sort((a, b) => a - b);
    return { nib, bits, destNibs };
  });

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-mono text-[#34d399] uppercase tracking-widest">
        P-Layer — Per-Nibble Bit Permutation (input bits → P destinations → output bits)
      </span>
      <div className="flex flex-wrap gap-1.5">
        {nibbleCards.map(({ nib, bits, destNibs }) => (
          <div key={nib} className="flex flex-col items-center gap-1 bg-[#0f172a] border border-[#334155] rounded p-1.5 min-w-[76px]">
            <span className="text-[8px] font-mono text-muted-foreground font-bold">Nib {nib}</span>
            {/* Source bit indices (hex) */}
            <div className="flex gap-px">
              {bits.map(b => (
                <div key={b.idx} className="w-[17px] h-[15px] flex items-center justify-center rounded-sm text-[6px] font-mono font-bold bg-secondary border border-[#334155] text-muted-foreground">
                  {toHex(b.idx)}
                </div>
              ))}
            </div>
            {/* Input bits */}
            <div className="flex gap-px">
              {bits.map(b => (
                <div key={b.idx} className={`w-[17px] h-[17px] flex items-center justify-center rounded-sm text-[9px] font-mono font-bold ${
                  b.inputVal === 1 ? "bg-[#78350f] text-[#f59e0b] border border-[#92400e]" : "bg-[#1e293b] text-muted-foreground border border-[#1e293b]"
                }`}>{b.inputVal}</div>
              ))}
            </div>
            {/* P destinations (hex) */}
            <div className="flex gap-px">
              {bits.map(b => (
                <div key={b.idx} className="w-[17px] h-[15px] flex items-center justify-center rounded-sm text-[6px] font-mono font-bold bg-[#022c22] text-[#34d399] border border-[#064e3b]">
                  {toHex(b.dest)}
                </div>
              ))}
            </div>
            <span className="text-[8px] text-[#34d399] leading-none">↓</span>
            {/* Output bits */}
            <div className="flex gap-px">
              {bits.map(b => (
                <div key={b.idx} className={`w-[17px] h-[17px] flex items-center justify-center rounded-sm text-[9px] font-mono font-bold ${
                  b.outputVal === 1 ? "bg-[#064e3b] text-[#34d399] border border-[#065f46]" : "bg-[#1e293b] text-muted-foreground border border-[#1e293b]"
                }`}>{b.outputVal}</div>
              ))}
            </div>
            <span className="text-[6px] font-mono text-muted-foreground">→ nibs {destNibs.join(",")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── P-Layer Output Nibble Assembly (S-DES style) ─────────────────────────────
function PLayerOutputFormationCards({ outputBits }: { outputBits: (0|1)[] }) {
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");

  const nibbles = Array.from({ length: 16 }, (_, nib) => {
    const start = nib * 4;
    const bits = outputBits.slice(start, start + 4);
    const hexVal = parseInt(bits.join(""), 2).toString(16).toUpperCase();
    return { nib, start, bits, hexVal };
  });

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#1e293b]">
      <span className="text-[9px] font-mono text-[#34d399] uppercase tracking-widest">
        Output Nibble Assembly (bits grouped back into hex nibbles)
      </span>
      <div className="flex flex-wrap gap-1.5">
        {nibbles.map(({ nib, start, bits, hexVal }) => (
          <div key={nib} className="flex flex-col items-center gap-1 bg-[#020617] border border-[#064e3b] rounded p-1.5 min-w-[50px]">
            <span className="text-[8px] font-mono text-muted-foreground font-bold">Out Nib {nib}</span>
            {/* Bit Indices */}
            <div className="flex gap-px">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-[15px] h-[13px] flex items-center justify-center rounded-sm text-[6px] font-mono font-bold bg-[#022c22] border border-[#064e3b] text-[#34d399]">
                  {toHex(start + i)}
                </div>
              ))}
            </div>
            {/* Bits */}
            <div className="flex gap-px">
              {bits.map((b, i) => (
                <div key={i} className={`w-[15px] h-[15px] flex items-center justify-center rounded-sm text-[8px] font-mono font-bold ${
                  b === 1 ? "bg-[#064e3b] text-[#34d399] border border-[#065f46]" : "bg-[#1e293b] text-muted-foreground border border-[#1e293b]"
                }`}>{b}</div>
              ))}
            </div>
            <span className="text-[8px] text-[#34d399] leading-none">↓</span>
            {/* Hex val */}
            <div className="text-[10px] font-mono font-bold text-background bg-[#34d399] px-2 rounded-sm leading-tight">
              {hexVal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ReferenceTables() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-card border border-border mt-4 overflow-hidden">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Grid3X3 className="h-3 w-3" />
        PRESENT Reference Tables
      </h3>
      <div className="flex flex-col gap-6">
        <TableGrid title="S-Box (4-bit nibble lookup)" table={SBOX} cols={16} />
        <TableGrid title="P-Layer (64-bit permutation)" table={P_LAYER} cols={16} />
      </div>
    </div>
  );
}

function RoundCard({ r, mode }: { r: PRESENTRoundState; mode: "encryption" | "decryption" }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Round {r.round}
        </h3>
        {r.isLastRound && mode === "encryption" && (
          <span className="text-[9px] font-mono text-[#4ade80] border border-[#14532d] rounded px-1.5 py-0.5">
            Includes Final AddRoundKey
          </span>
        )}
        {r.round === 1 && mode === "decryption" && (
          <span className="text-[9px] font-mono text-[#60a5fa] border border-[#1e3a8a] rounded px-1.5 py-0.5">
            Includes Initial AddRoundKey
          </span>
        )}
      </div>

      <div className="border-t border-border pt-2 flex flex-col gap-3">
        <NibbleRow bits={r.inputState} label="Input State" variant="l" />
        
        {/* Decryption Initial Header */}
        {mode === "decryption" && r.round === 1 && r.extraRoundKey && (
          <>
            <NibbleRow bits={r.extraRoundKey} label="Initial Round Key (Kn+1)" variant="key" />
            <NibbleRow bits={r.extraAddKey!} label="After Initial addRoundKey (⊕)" variant="xor" />
            <div className="border-t border-[#1e293b] my-1" />
          </>
        )}

        {/* Standard Round Key */}
        <NibbleRow bits={r.roundKey} label={mode === "encryption" ? "Round Key (Ki)" : "Round Key (Kn-i+1)"} variant="key" />

        {mode === "encryption" ? (
          <>
            <NibbleRow bits={r.afterAddKey} label="After addRoundKey (⊕)" variant="xor" />
            <SBoxNibbleDetails afterAddKey={r.afterAddKey} afterSBox={r.afterSBox} />
            <NibbleRow bits={r.afterSBox} label="After S-Box Layer" variant="f" />
            {!r.isLastRound && (
              <>
                <PLayerPermCards inputBits={r.afterSBox} outputBits={r.afterPLayer} />
                <PLayerOutputFormationCards outputBits={r.afterPLayer} />
              </>
            )}
            <NibbleRow bits={r.afterPLayer} label="After P-Layer" variant="r" />
            
            {/* Encryption Final Footer */}
            {r.isLastRound && r.extraRoundKey && (
              <>
                <div className="border-t border-[#1e293b] my-1" />
                <NibbleRow bits={r.extraRoundKey} label="Final Round Key (Kn+1)" variant="key" />
                <NibbleRow bits={r.extraAddKey!} label="Final addRoundKey (⊕ output)" variant="xor" />
              </>
            )}
          </>
        ) : (
          <>
            <NibbleRow bits={r.afterPLayer} label="After P-Layer⁻¹" variant="xor" />
            <PLayerPermCards inputBits={r.afterPLayer} outputBits={r.inputState} />
            <PLayerOutputFormationCards outputBits={r.inputState} />
            <NibbleRow bits={r.afterSBox} label="After S-Box⁻¹ Layer" variant="f" />
            <SBoxNibbleDetails afterAddKey={r.afterPLayer} afterSBox={r.afterSBox} />
            <NibbleRow bits={r.afterAddKey} label="After addRoundKey (⊕ output)" variant="r" />
          </>
        )}
      </div>
    </div>
  );
}

export function PresentRoundDetailView({ 
  state, 
  onPlaintextFlip, 
  onKeyFlip 
}: PresentRoundDetailViewProps) {
  if (state.round === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 p-6 rounded-lg bg-card border border-border shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Initial Setup
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Click any bit to flip it. Setup your {state.mode === "encryption" ? "plaintext" : "ciphertext"} and 80-bit key before starting.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            <NibbleRow
              bits={state.plaintext}
              label={state.mode === "encryption" ? "Input Plaintext (64-bit)" : "Input Ciphertext (64-bit)"}
              variant="l"
              clickable={!!onPlaintextFlip}
              onBitClick={onPlaintextFlip}
            />

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center lg:text-left">
                Key (80-bit)
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
                {Array.from({ length: 20 }, (_, n) => (
                  <div key={n} className="flex gap-0.5 border border-[#334155] rounded px-1 py-1 bg-[#020617]">
                    {state.key80.slice(n * 4, n * 4 + 4).map((bit, j) => {
                      const idx = n * 4 + j;
                      return (
                        <button
                          key={j}
                          onClick={() => onKeyFlip?.(idx)}
                          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all duration-200
                            ${bit === 1 ? "bg-[var(--bit-key)] text-foreground" : "bg-[var(--bit-0)] text-muted-foreground hover:bg-[#334155]"}
                            cursor-pointer hover:ring-1 hover:ring-ring hover:scale-110
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

          <div className="border-t border-border mt-2 pt-4 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] animate-bounce">
              Click "Next Round" in the sidebar to begin simulation
            </p>
          </div>
        </div>
        <ReferenceTables />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state.history.map((r) => (
        <RoundCard key={r.round} r={r} mode={state.mode} />
      ))}

      {state.completed && state.ciphertext.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#451a03] border border-[#78350f]">
          <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest">
            {state.mode === "encryption" ? "Ciphertext" : "Recovered Plaintext"} (64-bit)
          </span>
          <NibbleRow bits={state.ciphertext} label="Output" variant="f" />
        </div>
      )}

      <ReferenceTables />
    </div>
  );
}
