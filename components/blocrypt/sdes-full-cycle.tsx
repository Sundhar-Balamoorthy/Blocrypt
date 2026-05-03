"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, CheckCircle2, XCircle, Download, 
  ChevronDown, ArrowRight, Shield, Zap, RefreshCw, Key
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type SDESFullCycleResult,
  sdesFullCycle,
  DEFAULT_SDES_PLAINTEXT,
  DEFAULT_SDES_KEY10,
} from "@/lib/sdes";
import type { Bit } from "@/lib/sdes";
import { BitDisplay } from "./bit-display";

function SDESStepBlock({ 
  label, 
  bits, 
  variant = "l", 
  sublabel,
  icon: Icon
}: { 
  label: string; 
  bits: Bit[]; 
  variant?: "l" | "r" | "f" | "key";
  sublabel?: string;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-secondary/20 border border-white/5 w-full max-w-3xl min-w-[600px] transition-all hover:bg-secondary/30 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3 h-3 text-primary opacity-70" />}
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <BitDisplay bits={bits} label={label} variant={variant} />
      {sublabel && <span className="text-[9px] font-mono text-primary/50 mt-1">{sublabel}</span>}
    </div>
  );
}

export function SDESFullCycle() {
  const [plaintext, setPlaintext] = useState<Bit[]>(DEFAULT_SDES_PLAINTEXT as Bit[]);
  const [key10, setKey10] = useState<Bit[]>(DEFAULT_SDES_KEY10 as Bit[]);
  const [result, setResult] = useState<SDESFullCycleResult | null>(null);

  const handleRun = useCallback(() => {
    const r = sdesFullCycle(plaintext, key10);
    setResult(r);
  }, [plaintext, key10]);

  const handleReset = useCallback(() => {
    setPlaintext(DEFAULT_SDES_PLAINTEXT as Bit[]);
    setKey10(DEFAULT_SDES_KEY10 as Bit[]);
    setResult(null);
  }, []);

  const handleFlipPlaintext = useCallback((index: number) => {
    const newP = [...plaintext];
    newP[index] = (newP[index] === 0 ? 1 : 0) as Bit;
    setPlaintext(newP as Bit[]);
    if (result) setResult(sdesFullCycle(newP as Bit[], key10));
  }, [plaintext, key10, result]);

  const handleFlipKey = useCallback((index: number) => {
    const newK = [...key10];
    newK[index] = (newK[index] === 0 ? 1 : 0) as Bit;
    setKey10(newK as Bit[]);
    if (result) setResult(sdesFullCycle(plaintext, newK as Bit[]));
  }, [plaintext, key10, result]);

  const handleExportPDF = async () => {
    const element = document.getElementById("sdes-full-cycle-content");
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
      pdf.save("sdes-full-cycle.pdf");
    } catch (err) { console.error("Export failed", err); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-card/40 border border-primary/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pl-1 mb-1">Configuration</span>
             <div className="flex flex-wrap gap-4">
                <BitDisplay bits={plaintext} label="Input (8-bit)" variant="l" clickable onBitClick={handleFlipPlaintext} />
                <BitDisplay bits={key10} label="Key (10-bit)" variant="key" clickable onBitClick={handleFlipKey} />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleRun} size="lg" className="px-8 py-6 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20">
            <Play className="h-5 w-5 fill-current" /> Run Simulation
          </Button>
          <Button variant="outline" onClick={handleReset} className="h-14 w-14 rounded-2xl border-primary/10">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" onClick={handleExportPDF} className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-primary">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {result && (
        <ScrollArea className="h-[750px] w-full rounded-3xl border border-primary/10 bg-card/20 backdrop-blur-md">
          <div id="sdes-full-cycle-content" className="p-10 flex flex-col items-center gap-12 bg-card min-w-fit">
            
            <div className="w-full max-w-6xl text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">S-DES Algorithm Trace</h2>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.3em] opacity-60">Full Round-Trip Encryption & Decryption Trace</p>
            </div>

            {/* --- ENCRYPTION --- */}
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-blue-500/20" />
                <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold text-xs uppercase tracking-[0.2em]">
                  <Shield className="w-3 h-3" /> Encryption Phase
                </div>
                <div className="h-px flex-1 bg-blue-500/20" />
              </div>

              <SDESStepBlock label="Initial State" bits={result.plaintext} variant="l" icon={Play} />
              <ChevronDown className="w-6 h-6 text-blue-500/30" />
              
              <SDESStepBlock label="Initial Permutation (IP)" bits={result.encryptState.ipOutput} variant="l" icon={Zap} />
              <ChevronDown className="w-8 h-8 text-blue-500/20" />

              <div className="flex flex-col gap-8 w-full max-w-5xl items-center">
                 <div className="p-10 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-8 w-full min-w-[600px] shadow-2xl">
                    <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-[0.2em]">Round 1 (fk1)</span>
                    {result.encryptState.round1Detail && (
                      <BitDisplay bits={result.encryptState.round1Detail.fkOutput} label="Result" variant="f" />
                    )}
                    <p className="text-xs text-blue-400/40 font-mono italic">Applying subkey K1 transformation</p>
                 </div>
                 <div className="p-10 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-8 w-full min-w-[600px] shadow-2xl">
                    <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-[0.2em]">Swap (SW)</span>
                    <BitDisplay bits={result.encryptState.afterSwap} label="Result" variant="r" />
                    <p className="text-xs text-blue-400/40 font-mono italic">Interchanging high and low nibbles</p>
                 </div>
              </div>

              <ChevronDown className="w-6 h-6 text-blue-500/30" />

              <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 w-full max-w-5xl space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-widest">Round 2 (fk2) & Final Permutation (IP⁻¹)</span>
                    <Badge variant="outline" className="border-blue-500/20 text-blue-400">FINAL STEP</Badge>
                  </div>
                  <div className="flex flex-wrap gap-12 justify-center py-4">
                    {result.encryptState.round2Detail && (
                      <BitDisplay bits={result.encryptState.round2Detail.fkOutput} label="fk2 Output" variant="f" />
                    )}
                    <ArrowRight className="w-6 h-6 text-blue-500/20 mt-4" />
                    <BitDisplay bits={result.ciphertext} label="Final Ciphertext" variant="f" />
                  </div>
              </div>
            </div>

            {/* --- CIPHERTEXT DISPLAY --- */}
            <div className="w-full max-w-md p-8 rounded-[40px] bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 flex flex-col items-center gap-4 shadow-2xl shadow-amber-500/10">
               <span className="text-xs font-mono font-black text-amber-500 uppercase tracking-[0.3em]">Ciphertext Out</span>
               <BitDisplay bits={result.ciphertext} label="Ciphertext" variant="f" />
            </div>

            {/* --- DECRYPTION --- */}
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-emerald-500/20" />
                <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">
                   Decryption Phase
                </div>
                <div className="h-px flex-1 bg-emerald-500/20" />
              </div>

              <SDESStepBlock label="Start Decryption (IP)" bits={result.decryptState.ipOutput} variant="l" icon={Play} />
              <ChevronDown className="w-8 h-8 text-emerald-500/20" />

              <div className="flex flex-col gap-8 w-full max-w-5xl items-center">
                 <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-8 w-full min-w-[600px] shadow-2xl">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-[0.2em]">Round 1 (fk2)</span>
                    {result.decryptState.round1Detail && (
                      <BitDisplay bits={result.decryptState.round1Detail.fkOutput} label="Result" variant="f" />
                    )}
                 </div>
                 <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-8 w-full min-w-[600px] shadow-2xl">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-[0.2em]">Swap (SW)</span>
                    <BitDisplay bits={result.decryptState.afterSwap} label="Result" variant="r" />
                 </div>
              </div>

              <ChevronDown className="w-6 h-6 text-emerald-500/30" />

              <SDESStepBlock label="Recovered State (IP⁻¹)" bits={result.recovered} variant="l" icon={CheckCircle2} />
            </div>

            {/* Verification */}
            <div className={`w-full max-w-2xl flex items-center justify-center gap-4 rounded-3xl p-6 border transition-all duration-500 ${
              result.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5" : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}>
              {result.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              <div className="flex flex-col">
                <span className="text-xl font-black uppercase tracking-tight">{result.success ? "Round-Trip Verified" : "Verification Failed"}</span>
                <span className="text-xs font-mono opacity-60 uppercase">{result.success ? "Recovered plaintext matches original input perfectly" : "Input/Output mismatch detected"}</span>
              </div>
            </div>

          </div>
        </ScrollArea>
      )}
    </div>
  );
}
