"use client";

import { IP, IP_INV, S0, S1, EP, P4, P10, P8 } from "@/lib/sdes";
import { SBOX, P_LAYER } from "@/lib/present";
import { Grid3X3, Hash, ArrowRightLeft, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

function TableGrid({ title, table, cols, variant = "default" }: { title: string; table: number[]; cols: number, variant?: "default" | "sbox" }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
        <Hash className="h-3 w-3 text-primary/40" />
        {title}
      </span>
      <div 
        className="grid gap-1 shrink-0" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {table.map((val, i) => (
          <div key={i} className={cn(
            "border border-border rounded-md py-1.5 px-1 text-center font-mono text-[10px] transition-colors hover:bg-accent",
            variant === "sbox" ? "bg-amber-500/5 border-amber-500/20 text-amber-200" : "bg-secondary/40"
          )}>
            <div className="text-[8px] opacity-30 leading-none mb-1">{i}</div>
            <div className="font-bold leading-none">{variant === "sbox" ? val.toString(16).toUpperCase() : val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SBoxGrid({ title, sbox }: { title: string; sbox: number[][] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
        <Grid3X3 className="h-3 w-3 text-primary/40" />
        {title}
      </span>
      <div className="grid grid-cols-4 gap-1">
        {sbox.map((row, r) => 
          row.map((val, c) => (
            <div key={`${r}-${c}`} className="bg-primary/5 border border-primary/20 rounded-md py-2 px-1 text-center font-mono text-[10px] transition-all hover:scale-105 hover:bg-primary/10">
               <div className="text-[7px] opacity-30 leading-none mb-1">r{r}c{c}</div>
               <div className="font-bold text-primary">{val}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PracticeReferenceTables({ cipher }: { cipher: "feistel" | "sdes" | "present" }) {
  if (cipher === "feistel") return null;

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-md">
      <div className="flex items-center gap-3 pb-2 border-b border-border/40">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
           <Grid3X3 className="h-4 w-4" />
        </div>
        <div>
           <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">
             Cryptographic Reference
           </h3>
           <p className="text-[9px] font-mono text-muted-foreground">Constants and lookup tables for {cipher.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {cipher === "sdes" && (
          <>
            <div className="space-y-6">
               <TableGrid title="IP (Initial Permutation)" table={IP} cols={4} />
               <TableGrid title="IP⁻¹ (Inverse IP)" table={IP_INV} cols={4} />
            </div>
            <div className="space-y-6">
               <TableGrid title="EP (Expansion)" table={EP} cols={4} />
               <TableGrid title="P4 (Permutation)" table={P4} cols={4} />
               <div className="pt-2 border-t border-border/20">
                  <TableGrid title="P10 (Key Perm)" table={P10} cols={5} />
                  <div className="mt-4">
                     <TableGrid title="P8 (Key Choice)" table={P8} cols={4} />
                  </div>
               </div>
            </div>
            <div className="space-y-6">
               <SBoxGrid title="S-Box S0" sbox={S0} />
               <SBoxGrid title="S-Box S1" sbox={S1} />
            </div>
          </>
        )}

        {cipher === "present" && (
          <>
            <div className="col-span-1 lg:col-span-3">
               <TableGrid title="S-Box (4-bit nibble lookup)" table={SBOX} cols={16} variant="sbox" />
            </div>
            <div className="col-span-1 lg:col-span-3">
               <TableGrid title="P-Layer (64-bit permutation)" table={P_LAYER} cols={16} />
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-[9px] font-mono text-muted-foreground italic">
         <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="h-3 w-3" />
            Permutation: Maps bit at index i to table[i]
         </div>
         <div className="flex items-center gap-1.5">
            <Shuffle className="h-3 w-3" />
            S-Box: Hexadecimal input-output lookup
         </div>
      </div>
    </div>
  );
}
