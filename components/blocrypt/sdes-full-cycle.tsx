"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, XCircle, Download } from "lucide-react";
import {
  type SDESFullCycleResult,
  sdesFullCycle,
  DEFAULT_SDES_PLAINTEXT,
  DEFAULT_SDES_KEY10,
} from "@/lib/sdes";
import type { Bit } from "@/lib/sdes";
import { BitDisplay } from "./bit-display";

export function SDESFullCycle() {
  const [plaintext, setPlaintext] = useState<Bit[]>(DEFAULT_SDES_PLAINTEXT as Bit[]);
  const [key10, setKey10] = useState<Bit[]>(DEFAULT_SDES_KEY10 as Bit[]);
  const [result, setResult] = useState<SDESFullCycleResult | null>(null);

  const handleRun = useCallback(() => {
    const r = sdesFullCycle(plaintext, key10);
    setResult(r);
  }, [plaintext, key10]);

  const handleReset = useCallback(() => {
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
      const jsPDFModule = await import("jspdf/dist/jspdf.umd.min.js");
      const jsPDF = jsPDFModule.jsPDF;
      
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
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  const fmt = (bits: Bit[]) => `[${bits.join("")}]`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-lg bg-card border border-border">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
            Setup (bits are clickable)
          </span>
          <BitDisplay 
            bits={plaintext} 
            label="Input" 
            variant="l" 
            clickable 
            onBitClick={handleFlipPlaintext} 
          />
          <BitDisplay 
            bits={key10} 
            label="Key10" 
            variant="key" 
            clickable 
            onBitClick={handleFlipKey} 
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleRun} className="gap-1.5">
            <Play className="h-4 w-4" />
            Run Full Cycle
          </Button>
          <Button variant="secondary" onClick={handleReset} className="gap-1.5">
            Reset
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-1.5 ml-auto sm:ml-4">
            <Download className="h-4 w-4" />
            Export as PDF
          </Button>
        </div>
      </div>

      {result && (
        <div id="sdes-full-cycle-content" className="flex flex-col gap-6 p-6 rounded-lg border border-border bg-card">
          {/* Plaintext (showing it again for clarity in result) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-secondary/40 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Original Plaintext
            </span>
            <BitDisplay bits={result.plaintext} label="P" variant="l" />
          </div>

          {/* Encryption */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#3b82f6]/30" />
              <span className="text-xs font-mono font-bold text-[#60a5fa] uppercase tracking-wider px-2">
                Encryption
              </span>
              <div className="h-px flex-1 bg-[#3b82f6]/30" />
            </div>

            {result.encryptState.round1Detail && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Step 1: IP → f_K(K1) → SW
                </span>
                <BitDisplay bits={result.encryptState.ipOutput} label="IP out" variant="l" />
                <BitDisplay bits={result.encryptState.round1Detail.fkOutput} label="f_K1 out" variant="f" />
                <BitDisplay bits={result.encryptState.afterSwap} label="SW out" variant="r" />
              </div>
            )}

            {result.encryptState.round2Detail && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Step 2: f_K(K2) → IP⁻¹
                </span>
                <BitDisplay bits={result.encryptState.round2Detail.fkOutput} label="f_K2 out" variant="f" />
                <BitDisplay bits={result.ciphertext} label="Cipher" variant="f" />
              </div>
            )}
          </div>

          {/* Ciphertext */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest">
              Ciphertext {fmt(result.ciphertext)}
            </span>
            <BitDisplay bits={result.ciphertext} label="Cipher" variant="f" />
          </div>

          {/* Decryption */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#22c55e]/30" />
              <span className="text-xs font-mono font-bold text-[#4ade80] uppercase tracking-wider px-2">
                Decryption
              </span>
              <div className="h-px flex-1 bg-[#22c55e]/30" />
            </div>

            {result.decryptState.round1Detail && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Step 1: IP → f_K(K2) → SW
                </span>
                <BitDisplay bits={result.decryptState.ipOutput} label="IP out" variant="l" />
                <BitDisplay bits={result.decryptState.round1Detail.fkOutput} label="f_K2 out" variant="f" />
                <BitDisplay bits={result.decryptState.afterSwap} label="SW out" variant="r" />
              </div>
            )}

            {result.decryptState.round2Detail && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/20 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Step 2: f_K(K1) → IP⁻¹
                </span>
                <BitDisplay bits={result.decryptState.round2Detail.fkOutput} label="f_K1 out" variant="f" />
                <BitDisplay bits={result.recovered} label="Recover" variant="r" />
              </div>
            )}
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
              ? "ROUND-TRIP SUCCESSFUL — Recovered matches original"
              : "RECOVERY FAILED — Mismatch detected"}
          </div>

          {/* Recovered */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-secondary/40 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Recovered Plaintext
            </span>
            <BitDisplay bits={result.recovered} label="Recovered" variant="r" />
          </div>
        </div>
      )}
    </div>
  );
}
