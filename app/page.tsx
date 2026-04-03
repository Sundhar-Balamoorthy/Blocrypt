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
import {
  type SDESState,
  createSDESInitialState,
  stepSDES,
  runAllSDES,
  DEFAULT_SDES_PLAINTEXT,
  DEFAULT_SDES_KEY10,
} from "@/lib/sdes";
import {
  type PRESENTState,
  createPRESENTInitialState,
  stepPRESENT,
  runAllPRESENT,
  DEFAULT_PRESENT_PLAINTEXT,
  DEFAULT_PRESENT_KEY80,
  DEFAULT_PRESENT_ROUNDS,
} from "@/lib/present";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BitDisplay } from "@/components/blocrypt/bit-display";
import { FeistelControls } from "@/components/blocrypt/feistel-controls";
import { RoundDetailView } from "@/components/blocrypt/round-detail-view";
import { SchematicDiagram } from "@/components/blocrypt/schematic-diagram";
import { FeistelSchematic } from "@/components/blocrypt/feistel-schematic";
import { FullCycleView } from "@/components/blocrypt/full-cycle-view";
import { DatasetGenerator } from "@/components/blocrypt/dataset-generator";
import { SDESControls } from "@/components/blocrypt/sdes-controls";
import { SDESRoundDetailView, SDESReferenceTables } from "@/components/blocrypt/sdes-round-detail";
import { SDESSchematic } from "@/components/blocrypt/sdes-schematic";
import { SDESFullCycle } from "@/components/blocrypt/sdes-full-cycle";
import { PresentControls } from "@/components/blocrypt/present-controls";
import { PresentRoundDetailView } from "@/components/blocrypt/present-round-detail";
import { PresentSchematic } from "@/components/blocrypt/present-schematic";
import { PresentSchematicAnim } from "@/components/blocrypt/present-schematic-anim";
import { PresentFullCycle } from "@/components/blocrypt/present-full-cycle";
import { Lock, Unlock, ShieldCheck, Cpu, Grid3X3 } from "lucide-react";

// ─── Feistel Constants ────────────────────────────────────────
const initialPlaintext = DEFAULT_PLAINTEXT as Bit[];
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 16;

type CipherMode = "feistel" | "sdes" | "present";

// ─── Main Page ────────────────────────────────────────────────
export default function HomePage() {
  // Cipher selector
  const [cipher, setCipher] = useState<CipherMode>("feistel");

  // ─── Feistel state ───────────────────────────────────────────
  const [configuredRounds, setConfiguredRounds] = useState(DEFAULT_ROUNDS);
  const [feistelKeys, setFeistelKeys] = useState<number[]>(DEFAULT_KEYS);
  const [feistelPlaintext, setFeistelPlaintext] = useState<Bit[]>(initialPlaintext);
  const [feistelState, setFeistelState] = useState<FeistelState>(() =>
    createInitialState(initialPlaintext, configuredRounds, DEFAULT_KEYS)
  );

  const handleNextRound = useCallback(() => {
    setFeistelState((prev) => stepRound(prev));
  }, []);

  const handleRunAll = useCallback(() => {
    setFeistelState((prev) => runAllRounds(prev));
  }, []);

  const handleReset = useCallback(() => {
    setFeistelState(
      createInitialState(feistelPlaintext, configuredRounds, feistelKeys)
    );
  }, [configuredRounds, feistelKeys, feistelPlaintext]);

  const handleFlipBit = useCallback((index: number) => {
    setFeistelPlaintext((prev) => {
      const next = [...prev];
      next[index] = (next[index] ^ 1) as Bit;
      setFeistelState(createInitialState(next, configuredRounds, feistelKeys));
      return next;
    });
  }, [configuredRounds, feistelKeys]);

  const handleModeToggle = useCallback(() => {
    setFeistelState((prev) => {
      const newMode =
        prev.mode === "encryption" ? "decryption" : "encryption";
      return createInitialState(feistelPlaintext, configuredRounds, feistelKeys, newMode);
    });
  }, [configuredRounds, feistelKeys, feistelPlaintext]);

  const handleRoundsChange = useCallback((newRounds: number) => {
    setConfiguredRounds(newRounds);
    setFeistelKeys((prev) => {
      const next = [...prev];
      if (next.length < newRounds) {
        // Grow: add new default keys (cycle DEFAULT_KEYS)
        for (let i = next.length; i < newRounds; i++) {
          next.push(DEFAULT_KEYS[i % DEFAULT_KEYS.length]);
        }
      } else if (next.length > newRounds) {
        // Shrink: just truncate
        next.length = newRounds;
      }
      setFeistelState(createInitialState(feistelPlaintext, newRounds, next));
      return next;
    });
  }, [feistelPlaintext]);

  const handleRandomizeKeys = useCallback(() => {
    const newKeys = Array.from({ length: configuredRounds }, () => 
      Math.floor(Math.random() * 16)
    );
    setFeistelKeys(newKeys);
    setFeistelState(createInitialState(feistelPlaintext, configuredRounds, newKeys));
  }, [configuredRounds, feistelPlaintext]);

  const handleFeistelKeyChange = useCallback((index: number, value: number) => {
    setFeistelKeys((prev) => {
      const newKeys = [...prev];
      newKeys[index] = value;
      setFeistelState(createInitialState(feistelPlaintext, configuredRounds, newKeys));
      return newKeys;
    });
  }, [configuredRounds, feistelPlaintext]);

  // ─── S-DES state ─────────────────────────────────────────────
  const [sdesKey, setSdesKey] = useState<Bit[]>(DEFAULT_SDES_KEY10 as Bit[]);
  const [sdesPlaintext, setSdesPlaintext] = useState<Bit[]>(DEFAULT_SDES_PLAINTEXT as Bit[]);
  const [sdesState, setSdesState] = useState<SDESState>(() =>
    createSDESInitialState(DEFAULT_SDES_PLAINTEXT as Bit[], DEFAULT_SDES_KEY10 as Bit[])
  );
  const [sdesMode, setSdesMode] = useState<"encryption" | "decryption">("encryption");

  const handleSDESNextStep = useCallback(() => {
    setSdesState((prev) => stepSDES(prev));
  }, []);

  const handleSDESRunAll = useCallback(() => {
    setSdesState((prev) => runAllSDES(prev));
  }, []);

  const handleSDESReset = useCallback(() => {
    setSdesState(createSDESInitialState(sdesPlaintext, sdesKey, sdesMode));
  }, [sdesMode, sdesPlaintext, sdesKey]);

  const handleSDESModeToggle = useCallback(() => {
    const newMode = sdesMode === "encryption" ? "decryption" : "encryption";
    setSdesMode(newMode);
    setSdesState(createSDESInitialState(sdesPlaintext, sdesKey, newMode));
  }, [sdesMode, sdesPlaintext, sdesKey]);

  const handleSDESFlipBit = useCallback((index: number) => {
    const newPlaintext = [...sdesPlaintext];
    newPlaintext[index] = (newPlaintext[index] === 0 ? 1 : 0) as Bit;
    setSdesPlaintext(newPlaintext as Bit[]);
    setSdesState(createSDESInitialState(newPlaintext as Bit[], sdesKey, sdesMode));
  }, [sdesPlaintext, sdesKey, sdesMode]);

  const handleSDESKeyFlipBit = useCallback((index: number) => {
    const newKey = [...sdesKey];
    newKey[index] = (newKey[index] === 0 ? 1 : 0) as Bit;
    setSdesKey(newKey as Bit[]);
    setSdesState(createSDESInitialState(sdesPlaintext, newKey as Bit[], sdesMode));
  }, [sdesPlaintext, sdesKey, sdesMode]);

  // ─── PRESENT state ───────────────────────────────────────────
  const [presentKey80, setPresentKey80] = useState<Bit[]>(DEFAULT_PRESENT_KEY80 as Bit[]);
  const [presentPlaintext64, setPresentPlaintext64] = useState<Bit[]>(DEFAULT_PRESENT_PLAINTEXT as Bit[]);
  const [presentRounds, setPresentRounds] = useState(DEFAULT_PRESENT_ROUNDS);
  const [presentMode, setPresentMode] = useState<"encryption" | "decryption">("encryption");
  const [presentState, setPresentState] = useState<PRESENTState>(() =>
    createPRESENTInitialState(DEFAULT_PRESENT_PLAINTEXT as Bit[], DEFAULT_PRESENT_KEY80 as Bit[], DEFAULT_PRESENT_ROUNDS)
  );

  const handlePresentNextRound = useCallback(() => {
    setPresentState((prev) => stepPRESENT(prev));
  }, []);

  const handlePresentRunAll = useCallback(() => {
    setPresentState((prev) => runAllPRESENT(prev));
  }, []);

  const handlePresentReset = useCallback(() => {
    setPresentState(createPRESENTInitialState(presentPlaintext64, presentKey80, presentRounds, presentMode));
  }, [presentRounds, presentMode, presentPlaintext64, presentKey80]);

  const handlePresentRoundsChange = useCallback((r: number) => {
    setPresentRounds(r);
    setPresentState(createPRESENTInitialState(presentPlaintext64, presentKey80, r, presentMode));
  }, [presentMode, presentPlaintext64, presentKey80]);

  const handlePresentModeToggle = useCallback(() => {
    const newMode = presentMode === "encryption" ? "decryption" : "encryption";
    setPresentMode(newMode);
    setPresentState(createPRESENTInitialState(presentPlaintext64, presentKey80, presentRounds, newMode));
  }, [presentMode, presentRounds, presentPlaintext64, presentKey80]);

  const handlePresentFlipBit = useCallback((index: number) => {
    const newP = [...presentPlaintext64];
    newP[index] = (newP[index] === 0 ? 1 : 0) as Bit;
    setPresentPlaintext64(newP as Bit[]);
    setPresentState(createPRESENTInitialState(newP as Bit[], presentKey80, presentRounds, presentMode));
  }, [presentPlaintext64, presentKey80, presentRounds, presentMode]);

  const handlePresentKeyFlipBit = useCallback((index: number) => {
    const newK = [...presentKey80];
    newK[index] = (newK[index] === 0 ? 1 : 0) as Bit;
    setPresentKey80(newK as Bit[]);
    setPresentState(createPRESENTInitialState(presentPlaintext64, newK as Bit[], presentRounds, presentMode));
  }, [presentPlaintext64, presentKey80, presentRounds, presentMode]);

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
              {cipher === "feistel" ? "Feistel Cipher Simulator" : 
               cipher === "sdes" ? "S-DES Cipher Simulator" : 
               "PRESENT Cipher Simulator"}
            </p>
          </div>

          {/* Cipher Selector — right side of header */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
              Select Cipher:
            </span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setCipher("feistel")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                  cipher === "feistel"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Feistel
              </button>
              <button
                onClick={() => setCipher("sdes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                  cipher === "sdes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                S-DES
              </button>
              <button
                onClick={() => setCipher("present")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                  cipher === "present"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                PRESENT
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ════════════════ FEISTEL CIPHER ════════════════ */}
        {cipher === "feistel" && (
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

            {/* SIMULATOR */}
            <TabsContent value="simulator">
              <div className="flex flex-col lg:flex-row gap-12">
                <aside className="lg:w-fit shrink-0 flex flex-col gap-5">
                  <FeistelControls
                    round={feistelState.round}
                    totalRounds={feistelState.totalRounds}
                    completed={feistelState.completed}
                    mode={feistelState.mode}
                    onNextRound={handleNextRound}
                    onReset={handleReset}
                    onRunAll={handleRunAll}
                  />
                  <button
                    onClick={handleModeToggle}
                    className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-mono text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    {feistelState.mode === "encryption" ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    Switch to{" "}
                    {feistelState.mode === "encryption" ? "Decryption" : "Encryption"}
                  </button>
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-card border border-border w-fit">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pl-1 mb-1 whitespace-nowrap">
                      Current State (click bits to flip)
                    </span>
                    <BitDisplay bits={feistelState.L} label="L" variant="l" clickable onBitClick={(i) => handleFlipBit(i)} />
                    <BitDisplay bits={feistelState.R} label="R" variant="r" clickable onBitClick={(i) => handleFlipBit(i + feistelState.L.length)} />
                  </div>
                  <div className="flex flex-col gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-between pl-1">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Configuration</span>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
                        Input Plaintext
                      </span>
                      <BitDisplay 
                        bits={feistelPlaintext} 
                        label="Plaintext" 
                        variant="l" 
                        clickable 
                        onBitClick={handleFlipBit} 
                      />
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between pr-1">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
                          Subkeys (K1-K{configuredRounds})
                        </span>
                        <button 
                          onClick={handleRandomizeKeys}
                          className="text-[9px] font-mono text-primary hover:text-primary/80 transition-colors uppercase font-bold"
                        >
                          Randomize All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-secondary/20">
                        {feistelKeys.map((key, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-muted-foreground">K{i+1}</label>
                            <input
                              type="number"
                              min={0}
                              max={15}
                              value={key}
                              onChange={(e) => handleFeistelKeyChange(i, parseInt(e.target.value) || 0)}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-full bg-secondary border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none no-number-spinner"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Rounds:</span>
                        <span className="text-xs font-mono font-bold text-foreground">{configuredRounds}</span>
                      </div>
                      <input
                        type="range"
                        min={MIN_ROUNDS}
                        max={MAX_ROUNDS}
                        value={configuredRounds}
                        onChange={(e) => handleRoundsChange(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-muted rounded accent-primary"
                      />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{MIN_ROUNDS}</span>
                        <span>{MAX_ROUNDS}</span>
                      </div>
                    </div>
                  </div>
                </aside>
                <div className="flex-1 flex flex-col gap-6">
                  <RoundDetailView state={feistelState} />
                </div>
              </div>
            </TabsContent>

            {/* SCHEMATIC */}
            <TabsContent value="schematic">
              <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-56 shrink-0 flex flex-col gap-4">
                  <FeistelControls
                    round={feistelState.round}
                    totalRounds={feistelState.totalRounds}
                    completed={feistelState.completed}
                    mode={feistelState.mode}
                    onNextRound={handleNextRound}
                    onReset={handleReset}
                    onRunAll={handleRunAll}
                  />
                  <div className="p-3 rounded-lg bg-card border border-border text-[10px] font-mono text-muted-foreground">
                    <div className="uppercase tracking-widest mb-2">Tip</div>
                    Use <span className="text-foreground font-bold">Next Round</span> or <span className="text-foreground font-bold">Run All</span> to compute rounds, then navigate the animation sub-steps using the schematic&apos;s own controls below.
                  </div>
                </aside>
                <div className="flex-1 min-w-0">
                  <FeistelSchematic state={feistelState} />
                </div>
              </div>
            </TabsContent>

            {/* FULL CYCLE */}
            <TabsContent value="fullcycle">
              <div className="max-w-3xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    Encryption + Decryption Round-Trip Verification
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Encrypts plaintext [{[...feistelState.L, ...feistelState.R].join(", ")}] through {configuredRounds} rounds, then decrypts and verifies.
                  </p>
                </div>
                  <FullCycleView
                    totalRounds={configuredRounds}
                    initialPlaintext={feistelPlaintext}
                    keys={feistelKeys}
                  />
              </div>
            </TabsContent>

            {/* DATASET */}
            <TabsContent value="dataset">
              <div className="max-w-4xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    Synthetic Dataset Generator
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Generates a labeled dataset with valid Feistel ciphertexts (label=1) and random noise (label=0) for ML analysis.
                  </p>
                </div>
                <DatasetGenerator keys={feistelKeys} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* ════════════════ S-DES CIPHER ════════════════ */}
        {cipher === "sdes" && (
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

            {/* S-DES SIMULATOR */}
            <TabsContent value="simulator">
              <div className="flex flex-col lg:flex-row gap-12">
                <aside className="lg:w-fit shrink-0 flex flex-col gap-5">
                  <SDESControls
                    step={sdesState.step}
                    completed={sdesState.completed}
                    mode={sdesMode}
                    onNextStep={handleSDESNextStep}
                    onReset={handleSDESReset}
                    onRunAll={handleSDESRunAll}
                  />
                  <button
                    onClick={handleSDESModeToggle}
                    className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-mono text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    {sdesMode === "encryption" ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    Switch to {sdesMode === "encryption" ? "Decryption" : "Encryption"}
                  </button>

                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border w-fit">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                      S-DES Configuration (click bits to flip)
                    </span>
                    <BitDisplay
                      bits={sdesPlaintext}
                      label={sdesMode === "encryption" ? "Plain" : "Cipher"}
                      variant="l"
                      clickable
                      onBitClick={handleSDESFlipBit}
                    />
                    <BitDisplay
                      bits={sdesKey}
                      label="Key (10-bit)"
                      variant="key"
                      clickable
                      onBitClick={handleSDESKeyFlipBit}
                    />
                    {sdesState.step > 0 && (
                      <>
                        <div className="border-t border-border my-1" />
                        <div className="text-xs font-mono text-[#4ade80]">
                          <span className="text-muted-foreground mr-2">K1:</span>[{sdesState.keyState.k1.join("")}]
                        </div>
                        <div className="text-xs font-mono text-[#4ade80]">
                          <span className="text-muted-foreground mr-2">K2:</span>[{sdesState.keyState.k2.join("")}]
                        </div>
                      </>
                    )}
                  </div>

                  <SDESReferenceTables />
                </aside>
                <div className="flex-1 flex flex-col gap-6">
                  <SDESRoundDetailView state={sdesState} />
                </div>
              </div>
            </TabsContent>

            {/* S-DES SCHEMATIC */}
            <TabsContent value="schematic">
              <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-56 shrink-0 flex flex-col gap-4">
                  <SDESControls
                    step={sdesState.step}
                    completed={sdesState.completed}
                    mode={sdesMode}
                    onNextStep={handleSDESNextStep}
                    onReset={handleSDESReset}
                    onRunAll={handleSDESRunAll}
                  />
                  <div className="p-3 rounded-lg bg-card border border-border text-[10px] font-mono text-muted-foreground">
                    <div className="uppercase tracking-widest mb-2">Tip</div>
                    Use <span className="text-foreground font-bold">Next Step</span> to compute each cipher step, then navigate the 21 animation sub-steps using the schematic&apos;s own controls below.
                  </div>
                </aside>
                <div className="flex-1 min-w-0">
                  <SDESSchematic state={sdesState} />
                </div>
              </div>
            </TabsContent>

            {/* S-DES FULL CYCLE */}
            <TabsContent value="fullcycle">
              <div className="max-w-3xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    S-DES Encryption + Decryption Round-Trip
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Encrypts an 8-bit plaintext with S-DES (2 rounds), then decrypts the ciphertext and verifies correctness.
                  </p>
                </div>
                <SDESFullCycle />
              </div>
            </TabsContent>

            {/* S-DES DATASET */}
            <TabsContent value="dataset">
              <div className="max-w-4xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    S-DES Dataset Generator
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Generates a labeled dataset with valid S-DES ciphertexts (label=1) and random noise (label=0) for ML analysis.
                  </p>
                </div>
                <DatasetGenerator cipher="sdes" />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* ════════════════ PRESENT CIPHER ════════════════ */}
        {cipher === "present" && (
          <Tabs defaultValue="simulator" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="simulator" className="font-mono text-xs">Simulator</TabsTrigger>
              <TabsTrigger value="schematic" className="font-mono text-xs">Schematic</TabsTrigger>
              <TabsTrigger value="fullcycle" className="font-mono text-xs">Full Cycle</TabsTrigger>
              <TabsTrigger value="dataset" className="font-mono text-xs">Dataset</TabsTrigger>
            </TabsList>

            {/* PRESENT SIMULATOR */}
            <TabsContent value="simulator">
              <div className="flex flex-col lg:flex-row gap-12">
                <aside className="lg:w-fit shrink-0 flex flex-col gap-5">
                  <PresentControls
                    round={presentState.round}
                    totalRounds={presentRounds}
                    completed={presentState.completed}
                    mode={presentMode}
                    onNextRound={handlePresentNextRound}
                    onReset={handlePresentReset}
                    onRunAll={handlePresentRunAll}
                    onRoundsChange={handlePresentRoundsChange}
                  />
                  <button
                    onClick={handlePresentModeToggle}
                    className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-mono text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    {presentMode === "encryption" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    Switch to {presentMode === "encryption" ? "Decryption" : "Encryption"}
                  </button>

                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border w-fit">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                      PRESENT Configuration
                    </span>
                    <div className="text-xs font-mono text-foreground">
                      <span className="text-muted-foreground">Block: </span>64-bit
                    </div>
                    <div className="text-xs font-mono text-foreground">
                      <span className="text-muted-foreground">Key: </span>80-bit
                    </div>
                    <div className="text-xs font-mono text-foreground">
                      <span className="text-muted-foreground">Rounds: </span>{presentRounds}
                    </div>
                    <div className="text-xs font-mono text-foreground">
                      <span className="text-muted-foreground">Structure: </span>SPN
                    </div>
                  </div>
                </aside>
                <div className="flex-1 flex flex-col gap-6">
                  <PresentRoundDetailView 
                    state={presentState} 
                    onPlaintextFlip={handlePresentFlipBit}
                    onKeyFlip={handlePresentKeyFlipBit}
                  />
                </div>
              </div>
            </TabsContent>

            {/* PRESENT SCHEMATIC */}
            <TabsContent value="schematic">
              <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-56 shrink-0 flex flex-col gap-4">
                  <PresentControls
                    round={presentState.round}
                    totalRounds={presentRounds}
                    completed={presentState.completed}
                    mode={presentMode}
                    onNextRound={handlePresentNextRound}
                    onReset={handlePresentReset}
                    onRunAll={handlePresentRunAll}
                    onRoundsChange={handlePresentRoundsChange}
                  />
                  <div className="p-3 rounded-lg bg-card border border-border text-[10px] font-mono text-muted-foreground">
                    <div className="uppercase tracking-widest mb-2">Tip</div>
                    Use <span className="text-foreground font-bold">Next Round</span> or <span className="text-foreground font-bold">Run All</span> to compute rounds, then navigate the animation sub-steps using the schematic&apos;s own controls below.
                  </div>
                </aside>
                <div className="flex-1 min-w-0">
                  <PresentSchematicAnim state={presentState} />
                </div>
              </div>
            </TabsContent>

            {/* PRESENT FULL CYCLE */}
            <TabsContent value="fullcycle">
              <div className="max-w-3xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    PRESENT Encryption + Decryption Round-Trip
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Encrypts a 64-bit plaintext through configurable PRESENT rounds, then decrypts and verifies.
                  </p>
                </div>
                <PresentFullCycle />
              </div>
            </TabsContent>

            {/* PRESENT DATASET */}
            <TabsContent value="dataset">
              <div className="max-w-4xl">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold text-foreground">
                    PRESENT Dataset Generator
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Generates a labeled dataset with valid PRESENT ciphertexts (label=1) and random noise (label=0) for ML analysis.
                  </p>
                </div>
                <DatasetGenerator cipher="present" />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
