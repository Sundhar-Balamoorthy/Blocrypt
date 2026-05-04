"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Play, CheckCircle2, XCircle, Download, 
  ChevronDown, ArrowRight, Grid3X3, Layers, Zap, RefreshCw, Box
} from "lucide-react";
import {
  type Bit,
  type PRESENTFullCycleResult,
  presentFullCycle,
  DEFAULT_PRESENT_PLAINTEXT,
  DEFAULT_PRESENT_KEY80,
  DEFAULT_PRESENT_ROUNDS,
} from "@/lib/present";

const COLORS = {
  state: "bg-[#a855f7] text-white border-[#a855f7]/50",
  key: "bg-[#f43f5e] text-white border-[#f43f5e]/50",
  sbox: "bg-[#f59e0b] text-white border-[#f59e0b]/50",
  player: "bg-[#06b6d4] text-white border-[#06b6d4]/50",
  off: "bg-secondary/30 text-muted-foreground border-white/5"
};

function PresentBit({ 
  bit, 
  variant = "state", 
  onClick, 
  size = "md" 
}: { 
  bit: number; 
  variant?: keyof typeof COLORS; 
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-12 h-12 text-xl" : "w-14 h-14 text-2xl";
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${sizeClasses} flex-shrink-0 flex items-center justify-center rounded-lg font-mono font-black transition-all border-2
        ${bit === 1 ? COLORS[variant] : COLORS.off}
        ${onClick ? "cursor-pointer hover:scale-110 active:scale-95 shadow-xl shadow-black/40 hover:ring-2 hover:ring-white/20" : "cursor-default"}
      `}
    >
      {bit}
    </button>
  );
}

function PresentNibbleRow({ 
  bits, 
  label, 
  variant = "state",
  onBitClick 
}: { 
  bits: Bit[]; 
  label: string;
  variant?: keyof typeof COLORS;
  onBitClick?: (idx: number) => void;
}) {
  const chunkSize = 16;
  const numChunks = Math.ceil(bits.length / chunkSize);
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] font-black">{label}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(720px,1fr))] gap-6 w-full">
        {Array.from({ length: numChunks }, (_, n) => (
          <div key={n} className="flex flex-col gap-2 min-w-[700px]">
            <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-mono text-white/40 uppercase">Bits {n * 16}-{n * 16 + 15}</span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex gap-1.5">
                {bits.slice(n * 16, n * 16 + 4).map((bit, j) => (
                  <PresentBit key={j} bit={bit} variant={variant} onClick={onBitClick ? () => onBitClick(n * 16 + j) : undefined} size="sm" />
                ))}
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex gap-1.5">
                {bits.slice(n * 16 + 4, n * 16 + 8).map((bit, j) => (
                  <PresentBit key={j} bit={bit} variant={variant} onClick={onBitClick ? () => onBitClick(n * 16 + 4 + j) : undefined} size="sm" />
                ))}
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex gap-1.5">
                {bits.slice(n * 16 + 8, n * 16 + 12).map((bit, j) => (
                  <PresentBit key={j} bit={bit} variant={variant} onClick={onBitClick ? () => onBitClick(n * 16 + 8 + j) : undefined} size="sm" />
                ))}
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex gap-1.5">
                {bits.slice(n * 16 + 12, n * 16 + 16).map((bit, j) => (
                  <PresentBit key={j} bit={bit} variant={variant} onClick={onBitClick ? () => onBitClick(n * 16 + 12 + j) : undefined} size="sm" />
                ))}
              </div>
            </div>
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

  const handleReset = useCallback(() => {
    setPlaintext(DEFAULT_PRESENT_PLAINTEXT as Bit[]);
    setKey80(DEFAULT_PRESENT_KEY80 as Bit[]);
    setResult(null);
  }, []);

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

  const handleExportPDF = async () => {
    const element = document.getElementById("present-full-cycle-content");
    if (!element) return;
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const imgData = await toPng(element, { quality: 0.95, backgroundColor: 'hsl(215, 25%, 10%)' });
      const pdfWidth = 210;
      const canvas = await new Promise<{width: number, height: number}>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = imgData;
      });
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("present-full-cycle.pdf");
    } catch (err) { console.error("Export failed", err); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Hub */}
      <div className="p-12 rounded-[48px] bg-card/40 border border-primary/10 backdrop-blur-2xl space-y-10">
        <div className="flex justify-between items-start">
           <div className="space-y-1">
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-[10px] tracking-widest uppercase">SPN Architecture</Badge>
              <h2 className="text-2xl font-black tracking-tight">PRESENT Configuration</h2>
           </div>
           <div className="flex items-center gap-3">
              <Button onClick={handleRun} size="lg" className="rounded-2xl bg-purple-600 hover:bg-purple-700 font-bold gap-2 shadow-xl shadow-purple-500/20 px-8 h-14">
                <Play className="w-5 h-5 fill-current" /> Run Simulation
              </Button>
              <Button variant="outline" onClick={handleReset} className="h-14 w-14 rounded-2xl border-white/5 hover:bg-white/5">
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={handleExportPDF} className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-purple-400">
                <Download className="w-5 h-5" />
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
           <PresentNibbleRow bits={plaintext} label="64-Bit State" onBitClick={handleFlipPlaintext} />
           
           <div className="flex flex-col gap-6 w-full">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] font-black">80-Bit Master Key</span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(550px,1fr))] gap-6 w-full">
                {Array.from({ length: 5 }, (_, n) => (
                  <div key={n} className="flex flex-col gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 shadow-inner min-w-[500px]">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[9px] font-mono text-white/20 uppercase">Bits {n * 16}-{n * 16 + 15}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-1.5">
                        {key80.slice(n * 16, n * 16 + 4).map((bit, j) => (
                          <PresentBit key={j} bit={bit} variant="key" onClick={() => handleFlipKey(n * 16 + j)} size="sm" />
                        ))}
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex gap-1.5">
                        {key80.slice(n * 16 + 4, n * 16 + 8).map((bit, j) => (
                          <PresentBit key={j} bit={bit} variant="key" onClick={() => handleFlipKey(n * 16 + 4 + j)} size="sm" />
                        ))}
                      </div>
                      <div className="w-px h-8 bg-white/30" />
                      <div className="flex gap-1.5">
                        {key80.slice(n * 16 + 8, n * 16 + 12).map((bit, j) => (
                          <PresentBit key={j} bit={bit} variant="key" onClick={() => handleFlipKey(n * 16 + 8 + j)} size="sm" />
                        ))}
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex gap-1.5">
                        {key80.slice(n * 16 + 12, n * 16 + 16).map((bit, j) => (
                          <PresentBit key={j} bit={bit} variant="key" onClick={() => handleFlipKey(n * 16 + 12 + j)} size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-10 pt-6 border-t border-white/5">
              <div className="flex items-center gap-6 flex-1">
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">Round Count:</span>
                <input
                  type="range" min={1} max={31} value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="flex-1 h-2.5 bg-secondary rounded-full accent-purple-500"
                />
              </div>
              <Badge className="h-10 w-14 flex justify-center text-xl font-black bg-purple-500/20 text-purple-400 border-purple-500/30">
                {rounds}
              </Badge>
           </div>
        </div>
      </div>

      {result && (
        <div className="w-full py-12 flex flex-col items-center px-4">
          <div id="present-full-cycle-content" className="w-full max-w-[1600px] p-12 md:p-24 flex flex-col items-center gap-24">
            
            <div className="text-center space-y-4 mb-8">
               <h3 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-rose-400 to-amber-400 pb-2">Execution Trace</h3>
               <p className="text-3xl-foreground font-mono text-sm uppercase tracking-[0.4em] opacity-80">Interactive Bit-Level Analysis</p>
            </div>

            {/* --- INITIAL STATE --- */}
            <div className="w-full max-w-[1400px] p-12 rounded-[48px] bg-white/[0.01] space-y-10">
               <div className="min-w-max space-y-8">
                 <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-purple-500" />
                    <span className="text-[20px] font-mono text-purple-400 uppercase tracking-widest font-black">Plaintext Ingestion</span>
                 </div>
                 <PresentNibbleRow bits={result.plaintext} label="Input State" variant="state" />
               </div>
            </div>

            <ChevronDown className="w-8 h-8 text-white/10" />

            {/* --- ROUNDS --- */}
            <div className="w-full flex flex-col gap-20">
               {result.encryptState.history.slice(0, 3).map((r, i) => (
                  <div key={i} className="w-full max-w-[1600px] mx-auto p-12 rounded-[56px] bg-white/[0.01] space-y-10 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="min-w-max space-y-10">
                      <div className="flex items-center gap-4">
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/20" />
                         <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-6 py-1 font-black italic">ROUND {r.round}</Badge>
                         <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/20" />
                      </div>

                      <div className="flex flex-col gap-8">
                         <div className="p-8 rounded-3xl bg-rose-500/[0.03] border border-rose-500/10 space-y-4">
                            <div className="flex items-center gap-2 text-rose-400">
                               <Layers className="w-3 h-3" />
                               <span className="text-[20px] font-black uppercase tracking-widest">ARK: AddRoundKey</span>
                            </div>
                            <PresentNibbleRow bits={r.afterSBox} label="Key XOR Done" variant="key" />
                         </div>
                         
                         <div className="p-8 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10 space-y-4">
                            <div className="flex items-center gap-2 text-amber-400">
                               <Box className="w-3 h-3" />
                               <span className="text-[20px] font-black uppercase tracking-widest">S: S-Box Layer</span>
                            </div>
                            <PresentNibbleRow bits={r.afterSBox} label="Substitution" variant="sbox" />
                         </div>
 
                         <div className="p-8 rounded-3xl bg-cyan-500/[0.03] border border-cyan-500/10 space-y-4">
                            <div className="flex items-center gap-2 text-cyan-400">
                               <Grid3X3 className="w-3 h-3" />
                               <span className="text-[20px] font-black uppercase tracking-widest">P: P-Layer (Permutation)</span>
                            </div>
                            <PresentNibbleRow bits={r.afterPLayer} label="Permutation" variant="player" />
                         </div>
                      </div>
                    </div>
                  </div>
               ))}

               {rounds > 4 && (
                 <div className="py-8 flex flex-col items-center gap-4 opacity-30">
                    <div className="h-20 w-[2px] bg-gradient-to-b from-purple-500 to-transparent" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.5em]">Intermediate Rounds 4 to {rounds - 1} Omitted</span>
                    <div className="h-20 w-[2px] bg-gradient-to-t from-purple-500 to-transparent" />
                 </div>
               )}

                {rounds > 3 && result.encryptState.history.slice(-1).map((r, i) => (
                   <div key="final" className="w-full max-w-[1600px] mx-auto p-12 rounded-[56px] bg-rose-500/[0.03] space-y-10">
                     <div className="min-w-max space-y-10">
                       <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/20" />
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-8 py-2 font-black italic tracking-widest">FINAL ROUND {r.round}</Badge>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/20" />
                       </div>
                       <PresentNibbleRow bits={r.afterSBox} label="Final Substitution State" variant="sbox" />
                     </div>
                   </div>
                ))}
            </div>

            {/* --- CIPHERTEXT --- */}
            <div className="w-full p-16">
                <div className="flex flex-col items-center gap-8 px-10">
                  <Zap className="w-12 h-12 text-amber-500 animate-pulse" />
                  <h4 className="text-3xl font-black text-amber-500 tracking-[0.3em] uppercase">Ciphertext Result</h4>
                  <PresentNibbleRow bits={result.ciphertext} label="Encrypted Output" variant="sbox" />
                </div>
            </div>

            {/* Verification Block */}
            <div className="w-full p-14 transition-all duration-700">
              <div className="space-y-8 px-6">
                <div className="flex items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      {result.success ? <CheckCircle2 className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                      <div className="space-y-1">
                         <span className="text-3xl font-black tracking-tighter uppercase">{result.success ? "Decryption Match" : "Decryption Error"}</span>
                         <p className="text-sm font-mono opacity-60">Verified round-trip through Inverse S-Box & Inverse P-Layer</p>
                      </div>
                   </div>
                   <Badge className={`h-12 px-6 text-lg font-black font-mono border ${result.success ? "border-emerald-400 bg-emerald-500/10 text-emerald-300" : "border-destructive text-destructive bg-destructive/10"}`}>
                      S:{result.success ? "PASS" : "FAIL"}
                   </Badge>
                </div>
                <div className="mt-8 pt-8 border-t border-current/10 w-full">
                   <PresentNibbleRow bits={result.recovered} label="Recovered Plaintext" variant="state" />
                </div>
              </div>
            </div>

            </div>
        </div>
      )}
    </div>
  );
}
