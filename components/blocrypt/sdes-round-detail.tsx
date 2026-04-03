"use client";

import type { SDESState, SDESRoundDetail } from "@/lib/sdes";
import { BitDisplay } from "./bit-display";
import { IP, S0, S1, EP, P4, P10, P8 } from "@/lib/sdes";
import { Info, Grid3X3 } from "lucide-react";

interface SDESRoundDetailViewProps {
  state: SDESState;
}

function TableGrid({ title, table, cols }: { title: string; table: number[]; cols: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-muted-foreground uppercase">{title}</span>
      <div 
        className="grid gap-1 shrink-0" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {table.map((val, i) => (
          <div key={i} className="bg-secondary/50 border border-border rounded py-1 px-1.5 text-center font-mono text-[10px]">
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}

function SBoxGrid({ title, sbox }: { title: string; sbox: number[][] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-muted-foreground uppercase">{title}</span>
      <div className="grid grid-cols-4 gap-1">
        {sbox.map((row, r) => 
          row.map((val, c) => (
            <div key={`${r}-${c}`} className="bg-secondary/50 border border-border rounded py-1 px-1.5 text-center font-mono text-[10px]">
              {val}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SDESReferenceTables() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-card border border-border mt-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Grid3X3 className="h-3 w-3" />
        S-DES Reference Tables
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        <TableGrid title="IP (Initial Perm)" table={IP} cols={4} />
        <TableGrid title="EP (Expansion)" table={EP} cols={4} />
        <TableGrid title="P4 (Permutation)" table={P4} cols={4} />
        <SBoxGrid title="S-Box S0" sbox={S0} />
        <SBoxGrid title="S-Box S1" sbox={S1} />
        <div className="flex flex-col gap-3">
          <TableGrid title="P10 (Key Perm)" table={P10} cols={5} />
          <TableGrid title="P8 (Key Choice)" table={P8} cols={4} />
        </div>
      </div>
    </div>
  );
}

function RoundCard({ detail, label }: { detail: SDESRoundDetail; label: string }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-card border border-border">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>

      <div className="flex flex-col gap-2 py-1">
        <BitDisplay bits={detail.input.slice(0, 4)} label="L in" variant="l" />
        <BitDisplay bits={detail.input.slice(4)} label="R in" variant="r" />
      </div>

      <div className="border-t border-border my-1" />

      <div className="flex flex-col gap-2 py-1">
        <BitDisplay bits={detail.subkey} label={detail.round === 1 ? "K1" : "K2"} variant="key" />
        <div className="flex items-center gap-2">
          <BitDisplay bits={detail.epResult} label="EP(R)" variant="f" className="flex-1" />
          <div 
            className="p-1 hover:bg-secondary rounded-full cursor-help group relative"
            title="EP(R): Expansion Permutation. Expands the 4-bit right half to 8 bits by mapping bits [3, 0, 1, 2, 1, 2, 3, 0] to effectively 'double' some bits, allowing it to be XORed with the 8-bit subkey."
          >
            <Info className="h-3 w-3 text-muted-foreground" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] font-mono rounded border border-border shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              EP(R): Expansion Permutation. Expands the 4-bit right half to 8 bits by mapping bits [3, 0, 1, 2, 1, 2, 3, 0] to effectively "double" some bits, allowing it to be XORed with the 8-bit subkey.
            </div>
          </div>
        </div>
        <BitDisplay bits={detail.xorResult} label="XOR K" variant="xor" />
      </div>

      <div className="border-t border-border my-1" />

      <div className="flex flex-col gap-2 py-1">
        <BitDisplay bits={detail.s0Input} label="S0 in" variant="l" />
        <BitDisplay bits={detail.s0Output} label="S0 out" variant="l" />
        <BitDisplay bits={detail.s1Input} label="S1 in" variant="r" />
        <BitDisplay bits={detail.s1Output} label="S1 out" variant="r" />
        <BitDisplay bits={detail.p4Result} label="P4" variant="f" />
      </div>

      <div className="border-t border-border my-1" />

      <div className="flex flex-col gap-2 py-1">
        <BitDisplay bits={detail.fkOutput.slice(0, 4)} label="L out" variant="l" />
        <BitDisplay bits={detail.fkOutput.slice(4)} label="R out" variant="r" />
      </div>

      {detail.swapped && (
        <>
          <div className="border-t border-border my-1" />
          <div className="flex flex-col gap-2 py-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              After SW (Swap)
            </span>
            <BitDisplay bits={detail.swapped.slice(0, 4)} label="L sw" variant="r" />
            <BitDisplay bits={detail.swapped.slice(4)} label="R sw" variant="l" />
          </div>
        </>
      )}
    </div>
  );
}

export function SDESRoundDetailView({ state }: SDESRoundDetailViewProps) {
  if (state.step === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-card border border-border">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Initial State — Click "Next Step" to begin
          </h3>
          <BitDisplay bits={state.plaintext} label={state.mode === "encryption" ? "Plaintext" : "Ciphertext"} variant="l" />
        </div>
        {/* S-DES Reference tables are now in the side panel */}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* IP Output */}
      {state.step >= 1 && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            After IP (Initial Permutation)
          </span>
          <BitDisplay bits={state.ipOutput.slice(0, 4)} label="IP L" variant="l" />
          <BitDisplay bits={state.ipOutput.slice(4)} label="IP R" variant="r" />
        </div>
      )}

      {/* Round 1 */}
      {state.step >= 2 && state.round1Detail && (
        <RoundCard
          detail={state.round1Detail}
          label={`f_K Round 1 — using ${state.mode === "encryption" ? "K1" : "K2"}`}
        />
      )}

      {/* Swap */}
      {state.step >= 3 && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            SW — Swap Halves
          </span>
          <BitDisplay bits={state.afterSwap.slice(0, 4)} label="L sw" variant="r" />
          <BitDisplay bits={state.afterSwap.slice(4)} label="R sw" variant="l" />
        </div>
      )}

      {/* Round 2 + Output */}
      {state.step >= 4 && state.round2Detail && (
        <>
          <RoundCard
            detail={state.round2Detail}
            label={`f_K Round 2 — using ${state.mode === "encryption" ? "K2" : "K1"}`}
          />
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest">
              {state.mode === "encryption" ? "Ciphertext" : "Recovered Plaintext"} (after IP⁻¹)
            </span>
            <BitDisplay bits={state.ciphertext} label={state.mode === "encryption" ? "Cipher" : "Plain"} variant="f" />
          </div>
        </>
      )}

      {/* S-DES Reference tables are now in the side panel */}
    </div>
  );
}
