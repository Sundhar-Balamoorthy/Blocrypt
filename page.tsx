"use client";

import { useState, useCallback } from "react";
import {
  type Bit,
  type FeistelState,
  createInitialState,
  stepRound,
  flipBit,
  runAllRounds,
  DEFAULT_PLAINTEXT,
  DEFAULT_KEYS,
  DEFAULT_ROUNDS,
} from "@/lib/feistel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BitDisplay } from "@/components/blocrypt/bit-display";
import { FeistelControls } from "@/components/blocrypt/feistel-controls";
import { RoundDetailView } from "@/components/blocrypt/round-detail-view";
import { SchematicDiagram } from "@/components/blocrypt/schematic-diagram";

import { FullCycleView } from "@/components/blocrypt/full-cycle-view";
import { DatasetGenerator } from "@/components/blocrypt/dataset-generator";
import { Lock, Unlock } from "lucide-react";

const initialPlaintext = DEFAULT_PLAINTEXT as Bit[];

export default function HomePage() {
  const [state, setState] = useState<FeistelState>(() =>
    createInitialState(initialPlaintext, DEFAULT_ROUNDS, DEFAULT_KEYS)
  );

  const handleNextRound = useCallback(() => {
    setState((prev) => stepRound(prev));
  }, []);

  const handleRunAll = useCallback(() => {
    setState((prev) => runAllRounds(prev));
  }, []);

  const handleReset = useCallback(() => {
    setState(
      createInitialState(initialPlaintext, DEFAULT_ROUNDS, DEFAULT_KEYS)
    );
  }, []);

  const handleFlipBit = useCallback((index: number) => {
    setState((prev) => flipBit(prev, index));
  }, []);

  const handleModeToggle = useCallback(() => {
    setState((prev) => {
      const newMode =
        prev.mode === "encryption" ? "decryption" : "encryption";
      // Reset with current L+R as new input
      const currentBits = [...prev.L, ...prev.R] as Bit[];
      return createInitialState(
        currentBits,
        DEFAULT_ROUNDS,
        DEFAULT_KEYS,
        newMode
      );
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15">
            <Lock className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight text-foreground text-balance">
              BLOCRYPT
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Feistel Cipher Simulator
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="simulator" className="font-mono text-xs">
              Simulator
            </TabsTrigger>
            <TabsTrigger value="schematic" className="font-mono text-xs">
              Schematic
            </TabsTrigger>
            <TabsTrigger value="fullcycle" className="font-mono text-xs">
              Full Cycle
            </TabsTrigger>
            <TabsTrigger value="dataset" className="font-mono text-xs">
              Dataset
            </TabsTrigger>
          </TabsList>

          {/* ======================== SIMULATOR TAB ======================== */}
          <TabsContent value="simulator">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Controls Sidebar */}
              <aside className="lg:w-72 shrink-0 flex flex-col gap-5">
                <FeistelControls
                  round={state.round}
                  totalRounds={state.totalRounds}
                  completed={state.completed}
                  mode={state.mode}
                  onNextRound={handleNextRound}
                  onReset={handleReset}
                  onRunAll={handleRunAll}
                />

                {/* Mode toggle */}
                <button
                  onClick={handleModeToggle}
                  className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-mono text-secondary-foreground hover:bg-accent transition-colors"
                >
                  {state.mode === "encryption" ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                  Switch to{" "}
                  {state.mode === "encryption" ? "Decryption" : "Encryption"}
                </button>

                {/* Current State with Flip */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Current State (click bits to flip)
                  </span>
                  <BitDisplay
                    bits={state.L}
                    label="L"
                    variant="l"
                    clickable
                    onBitClick={(i) => handleFlipBit(i)}
                  />
                  <BitDisplay
                    bits={state.R}
                    label="R"
                    variant="r"
                    clickable
                    onBitClick={(i) => handleFlipBit(i + state.L.length)}
                  />
                </div>

                {/* Config display */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-card border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Configuration
                  </span>
                  <div className="text-xs font-mono text-foreground">
                    <span className="text-muted-foreground">Plaintext: </span>
                    [{initialPlaintext.join(", ")}]
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    <span className="text-muted-foreground">Keys: </span>[
                    {DEFAULT_KEYS.join(", ")}]
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    <span className="text-muted-foreground">Rounds: </span>
                    {DEFAULT_ROUNDS}
                  </div>
                </div>
              </aside>

              {/* Main content area */}
              <div className="flex-1 flex flex-col gap-6">
                <RoundDetailView state={state} />
              </div>
            </div>
          </TabsContent>

          {/* ======================== SCHEMATIC TAB ======================== */}
          <TabsContent value="schematic">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Controls Sidebar */}
              <aside className="lg:w-72 shrink-0 flex flex-col gap-5">
                <FeistelControls
                  round={state.round}
                  totalRounds={state.totalRounds}
                  completed={state.completed}
                  mode={state.mode}
                  onNextRound={handleNextRound}
                  onReset={handleReset}
                />

                <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Current State
                  </span>
                  <BitDisplay bits={state.L} label="L" variant="l" />
                  <BitDisplay bits={state.R} label="R" variant="r" />
                </div>
              </aside>

              {/* Schematic */}
              <div className="flex-1">
                <div className="rounded-lg border border-border bg-card p-4">
                  <SchematicDiagram state={state} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ======================== FULL CYCLE TAB ======================== */}
          <TabsContent value="fullcycle">
            <div className="max-w-3xl">
              <div className="mb-4">
                <h2 className="text-sm font-mono font-bold text-foreground">
                  Encryption + Decryption Round-Trip Verification
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Encrypts the default plaintext [{initialPlaintext.join(", ")}
                  ] through {DEFAULT_ROUNDS} rounds, then decrypts the
                  ciphertext back and verifies round-trip correctness.
                </p>
              </div>
              <FullCycleView />
            </div>
          </TabsContent>

          {/* ======================== DATASET TAB ======================== */}
          <TabsContent value="dataset">
            <div className="max-w-4xl">
              <div className="mb-4">
                <h2 className="text-sm font-mono font-bold text-foreground">
                  Synthetic Dataset Generator
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Generates a labeled dataset with valid Feistel ciphertexts
                  (label=1) and random noise (label=0) for machine learning
                  analysis.
                </p>
              </div>
              <DatasetGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
