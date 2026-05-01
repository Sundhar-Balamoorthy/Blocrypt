"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import type { FeistelState, Bit } from "@/lib/feistel";
import { intToBits } from "@/lib/feistel";

interface FeistelSchematicProps {
  state: FeistelState;
}

// ── Colour palette (matches S-DES schematic style) ───────────────────────────
const C = {
  plain:  "#818cf8",
  L:      "#60a5fa",
  R:      "#34d399",
  key:    "#4ade80",
  f:      "#f59e0b",
  xor:    "#fb923c",
  out:    "#fbbf24",
  swap:   "#c084fc",
  dim:    "#475569",
  bg:     "#0a0f1c",
};

// Speed presets (same as S-DES schematic)
const SPEEDS = [
  { label: "0.5×", ms: 9000 },
  { label: "1×",   ms: 4500 },
  { label: "2×",   ms: 2250 },
  { label: "3×",   ms: 1125 },
];

// ── Shared mini-components ────────────────────────────────────────────────────

function BitSquare({
  val, color, dim = false, size = 50, index, showIndex = true,
}: {
  val: Bit | null; color?: string; dim?: boolean;
  size?: number; index?: number; showIndex?: boolean;
}) {
  const activeClr = color ?? (val === 1 ? "#3b82f6" : "#1e293b");
  const bg  = val === 1 ? activeClr : "#1e293b";
  const bdr = val === 1 ? activeClr : "#334155";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {showIndex && index !== undefined && (
        <div style={{ fontSize: 20, color: "#ffffff", fontFamily: "monospace", fontWeight: "bold", opacity: 0.9 }}>{index}</div>
      )}
      <div style={{
        width: size === 50 ? 48 : size, height: size === 50 ? 48 : size,
        background: dim ? "#0f1a2a" : bg,
        border: `2px solid ${dim ? "#1e293b" : bdr}`,
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size === 50 ? 26 : 18, fontWeight: "bold", fontFamily: "monospace",
        color: dim ? "#1e293b" : (val === 1 ? "#fff" : "#cbd5e1"),
        opacity: dim ? 0.35 : 1, transition: "all 0.3s ease",
        boxShadow: val === 1 && !dim ? `0 0 10px ${bdr}55` : "none",
      }}>
        {val !== null ? val : "?"}
      </div>
    </div>
  );
}

function BitRow({
  bits, label, labelColor, color, size = 50, gap = 6, delay = 0, showIndices = true,
}: {
  bits: (Bit | null)[]; label?: string; labelColor?: string; color?: string;
  size?: number; gap?: number; delay?: number; showIndices?: boolean;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
    }}>
      {label && (
        <div style={{
          fontSize: 18, fontFamily: "monospace", color: labelColor ?? "#ffffff",
          textTransform: "uppercase", letterSpacing: 2, fontWeight: "bold",
        }}>{label}</div>
      )}
      <div style={{ display: "flex", gap }}>
        {bits.map((b, i) => (
          <BitSquare key={i} val={b} index={i} showIndex={showIndices}
            color={b === 1 ? color : undefined} size={size} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ text, color, sub }: { text: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <div style={{
        fontSize: 28, fontWeight: "bold", fontFamily: "monospace",
        color: color ?? "#f1f5f9",
        textShadow: color ? `0 0 32px ${color}88` : "none",
        letterSpacing: 2,
      }}>{text}</div>
      {sub && <div style={{ fontSize: 18, color: "#cbd5e1", fontFamily: "monospace", textAlign: "center", maxWidth: 640, fontWeight: "bold" }}>{sub}</div>}
    </div>
  );
}

function DownArrow({ color, delay = 0 }: { color?: string; delay?: number }) {
  return (
    <div style={{
      fontSize: 36, color: color ?? "#ffffff", lineHeight: 1, margin: "8px 0", fontWeight: "bold",
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
    }}>↓</div>
  );
}

function XorView({
  a, b, result, labelA, labelB, labelResult, colorA, colorB, colorResult, delay = 0,
}: {
  a: Bit[]; b: Bit[]; result: Bit[];
  labelA?: string; labelB?: string; labelResult?: string;
  colorA?: string; colorB?: string; colorResult?: string; delay?: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
    }}>
      <BitRow bits={a} label={labelA} labelColor={colorA} color={colorA} size={46} delay={0} />
      <div style={{ fontSize: 32, color: C.xor, fontWeight: "bold", fontFamily: "monospace", lineHeight: 1 }}>⊕</div>
      <BitRow bits={b} label={labelB} labelColor={colorB} color={colorB} size={46} delay={0} />
      <div style={{ width: "100%", height: 2, background: `${C.xor}44`, borderRadius: 1 }} />
      <BitRow bits={result} label={labelResult} labelColor={colorResult} color={colorResult} size={46} delay={0} />
    </div>
  );
}

// ── Tag helper ────────────────────────────────────────────────────────────────
function tag(c: string): React.CSSProperties {
  return {
    fontSize: 14, fontFamily: "monospace", color: "#ffffff", fontWeight: "bold",
    background: `${c}33`, border: `1.5px solid ${c}88`, borderRadius: 6, padding: "4px 12px",
  };
}

// ── Button helper ─────────────────────────────────────────────────────────────
function btnStyle(bg: string, clr: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
    background: bg, color: clr, fontFamily: "monospace", fontSize: 12,
    fontWeight: "bold", transition: "opacity 0.2s",
  };
}

// ── Layout constants ──────────────────────────────────────────────────────────
const col: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 18 };
const row: React.CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" };
const note: React.CSSProperties = { fontSize: 18, color: "#cbd5e1", fontFamily: "monospace", textAlign: "center", maxWidth: 640, lineHeight: 1.6, fontWeight: "bold" };

// ── Main component ────────────────────────────────────────────────────────────
export function FeistelSchematic({ state }: FeistelSchematicProps) {
  // Build step labels dynamically based on rounds completed
  const totalRounds = state.totalRounds;

  // Steps: 0 = plaintext input, then per-round: 3 sub-steps each, then final output
  // Step layout: 0=plaintext input, 1..N*3: rounds (each round has: inputs, f+key, xor+output), last=ciphertext
  const STEPS_PER_ROUND = 3;
  const TOTAL = 1 + totalRounds * STEPS_PER_ROUND + 1; // intro + rounds + outro

  function stepLabel(s: number): string {
    if (s === 0) return "0 · Plaintext Input";
    if (s === TOTAL - 1) return `${TOTAL - 1} · Ciphertext Output`;
    const rnd = Math.ceil(s / STEPS_PER_ROUND);
    const phase = ((s - 1) % STEPS_PER_ROUND) + 1;
    const phaseName = phase === 1 ? "Inputs" : phase === 2 ? "F Function + XOR" : "Round Output";
    return `${s} · Round ${rnd}: ${phaseName}`;
  }

  const STEP_LABELS = Array.from({ length: TOTAL }, (_, i) => stepLabel(i));

  const [sub, setSub] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plaintext = [...state.L, ...state.R] as Bit[];
  const half = state.L.length;

  // Reset on state change
  useEffect(() => {
    setSub(0); setPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plaintext.join(""), state.totalRounds, state.mode]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setSub(prev => { if (prev >= TOTAL - 1) { setPlaying(false); return prev; } return prev + 1; });
      }, SPEEDS[speedIdx].ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speedIdx, TOTAL]);

  const next  = useCallback(() => setSub(p => Math.min(p + 1, TOTAL - 1)), [TOTAL]);
  const prev  = useCallback(() => setSub(p => Math.max(p - 1, 0)), []);
  const reset = useCallback(() => { setSub(0); setPlaying(false); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  function noData() {
    return (
      <div style={{ color: "#ffffff", fontFamily: "monospace", textAlign: "center", padding: 32 }}>
        ⚠ No round data yet — rounds execute as you click &quot;Next Round&quot; in the Simulator tab.
      </div>
    );
  }

  function panel() {
    // ── Step 0: Plaintext Input ──────────────────────────────────────────────
    if (sub === 0) {
      const L = state.history.length > 0 ? state.history[0].prevL : state.L;
      const R = state.history.length > 0 ? state.history[0].prevR : state.R;
      const pt = [...L, ...R] as Bit[];
      return (
        <div style={col}>
          <SectionLabel text="Plaintext Input" color={C.plain} sub={`${pt.length}-bit block entering the Feistel cipher`} />
          <BitRow bits={pt} label={`Plaintext (${pt.length} bits)`} labelColor={C.plain} color={C.plain} size={60} delay={0} />
          <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 400ms" }}>
            Decimal: {parseInt(pt.join(""), 2)} | Hex: 0x{parseInt(pt.join(""), 2).toString(16).toUpperCase().padStart(Math.ceil(pt.length / 4), "0")}
          </div>
          <DownArrow color={C.plain} delay={800} />
          <div style={{ ...row, gap: 60, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1200ms" }}>
            <div style={col}>
              <div style={tag(C.L)}>L₀ — bits [0–{half - 1}]</div>
              <BitRow bits={L} color={C.L} size={52} delay={0} />
            </div>
            <div style={col}>
              <div style={tag(C.R)}>R₀ — bits [{half}–{pt.length - 1}]</div>
              <BitRow bits={R} color={C.R} size={52} delay={0} />
            </div>
          </div>
          <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1800ms", marginTop: 8 }}>
            ↓ Split into L (left half) and R (right half), then enters {totalRounds} Feistel round{totalRounds > 1 ? "s" : ""}
          </div>
        </div>
      );
    }

    // ── Last step: Ciphertext Output ─────────────────────────────────────────
    if (sub === TOTAL - 1) {
      const ct = [...state.L, ...state.R] as Bit[];
      const hasData = state.history.length > 0;
      const finalCt = hasData ? ct : Array(plaintext.length).fill(null) as (Bit | null)[];
      return (
        <div style={col}>
          <SectionLabel
            text={state.mode === "encryption" ? "🔐 Ciphertext Output" : "🔓 Recovered Plaintext"}
            color={C.out}
            sub={state.mode === "encryption"
              ? `Encryption complete after ${totalRounds} rounds`
              : `Decryption complete — original plaintext recovered after ${totalRounds} rounds`}
          />
          {!hasData && noData()}
          {hasData && (
            <>
              <BitRow bits={finalCt} labelColor={C.out} color={C.out} size={64} delay={0} />
              <div style={{ ...note, fontSize: 15, marginTop: 16, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
                Decimal: {parseInt(ct.join(""), 2)} | Hex: 0x{parseInt(ct.join(""), 2).toString(16).toUpperCase().padStart(Math.ceil(ct.length / 4), "0")}
              </div>
              <div style={{ ...row, gap: 60, marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1400ms" }}>
                <div style={col}>
                  <div style={tag(C.L)}>Final L</div>
                  <BitRow bits={state.L} color={C.L} size={52} delay={0} />
                </div>
                <div style={col}>
                  <div style={tag(C.R)}>Final R</div>
                  <BitRow bits={state.R} color={C.R} size={52} delay={0} />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Round sub-steps ──────────────────────────────────────────────────────
    const rndIdx = Math.floor((sub - 1) / STEPS_PER_ROUND); // 0-based round index
    const phase  = ((sub - 1) % STEPS_PER_ROUND) + 1;       // 1, 2, or 3
    const rndNum = rndIdx + 1;

    const roundData = state.history[rndIdx] ?? null;

    // ── Phase 1: Round Inputs ────────────────────────────────────────────────
    if (phase === 1) {
      const L = roundData ? roundData.prevL : Array(half).fill(null) as (Bit | null)[];
      const R = roundData ? roundData.prevR : Array(half).fill(null) as (Bit | null)[];
      const key = roundData ? roundData.roundKey : null;
      const keyBits = roundData ? roundData.roundKeyBits : Array(half).fill(null) as (Bit | null)[];
      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — Inputs`}
            color={C.L}
            sub={`The Feistel round function F takes R as input and mixes it with the subkey K${rndNum}`}
          />
          {!roundData && noData()}
          {roundData && (
            <>
              <div style={{ ...row, gap: 60, alignItems: "flex-start" }}>
                <div style={{ ...col, opacity: 0, animation: "stagger-fade 0.5s ease forwards 0ms" }}>
                  <div style={tag(C.L)}>L{rndIdx} (left half in)</div>
                  <BitRow bits={L} color={C.L} size={56} delay={0} />
                </div>
                <div style={{ ...col, opacity: 0, animation: "stagger-fade 0.5s ease forwards 400ms" }}>
                  <div style={tag(C.R)}>R{rndIdx} (right half in)</div>
                  <BitRow bits={R} color={C.R} size={56} delay={0} />
                </div>
              </div>
              <DownArrow color={C.f} delay={900} />
              <div style={{ ...col, gap: 6, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1200ms" }}>
                <div style={tag(C.key)}>Subkey K{rndNum} = {key} → [{keyBits.join("")}]</div>
                <BitRow bits={keyBits} color={C.key} size={52} showIndices={false} delay={0} />
              </div>
              <div style={{ ...note, marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1800ms" }}>
                R{rndIdx} enters F(·, K{rndNum}) — L{rndIdx} waits to be XOR&apos;d with F&apos;s output
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Phase 2: F Function + XOR ────────────────────────────────────────────
    if (phase === 2) {
      const R      = roundData ? roundData.prevR      : Array(half).fill(null) as (Bit | null)[];
      const L      = roundData ? roundData.prevL      : Array(half).fill(null) as (Bit | null)[];
      const keyBits = roundData ? roundData.roundKeyBits : Array(half).fill(null) as (Bit | null)[];
      const fOut   = roundData ? roundData.fOutput    : Array(half).fill(null) as (Bit | null)[];
      const xorOut = roundData ? roundData.xorResult  : Array(half).fill(null) as (Bit | null)[];
      const BSIZE = 52;
      const BGAP  = 6;
      const labelW = 180;

      // Index row (shared column headers for all bit rows)
      function IndexRow() {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginLeft: labelW + 8 }}>
            {R.map((_, i) => (
              <div key={i} style={{ width: BSIZE, textAlign: "center", fontSize: 14, color: "#ffffff", fontFamily: "monospace", marginRight: i < R.length - 1 ? BGAP : 0 }}>
                {i}
              </div>
            ))}
          </div>
        );
      }

      // A labelled bit row in the table — label on the left, bits column-aligned
      function TableRow({
        bits, labelEl, delay = 0, color,
      }: { bits: (Bit | null)[]; labelEl: React.ReactNode; delay?: number; color?: string }) {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms` }}>
            <div style={{ width: labelW, display: "flex", justifyContent: "flex-end" }}>
              {labelEl}
            </div>
            <div style={{ display: "flex", gap: BGAP }}>
              {bits.map((b, i) => (
                <BitSquare key={i} val={b} size={BSIZE} showIndex={false} color={b === 1 ? color : undefined} />
              ))}
            </div>
          </div>
        );
      }

      // Operator row (⊕ symbol centered over the bits column)
      function OperatorRow({ symbol, color, delay = 0 }: { symbol: string; color: string; delay?: number }) {
        const bitsWidth = R.length * BSIZE + (R.length - 1) * BGAP;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0, animation: "stagger-fade 0.4s ease forwards", animationDelay: `${delay}ms` }}>
            <div style={{ width: labelW }} />
            <div style={{ width: bitsWidth, display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: 28, color, fontFamily: "monospace", fontWeight: "bold", lineHeight: 1 }}>{symbol}</span>
            </div>
          </div>
        );
      }

      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — F Function & XOR`}
            color={C.f}
            sub={`F(R${rndIdx}, K${rndNum}) = R XOR K (mod 2^${half}), then result XOR'd with L${rndIdx}`}
          />
          {!roundData && noData()}
          {roundData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* ── F Function section ── */}
              <IndexRow />

              <TableRow
                bits={R}
                color={C.R}
                delay={0}
                labelEl={<div style={tag(C.R)}>R{rndIdx} → F input</div>}
              />

              <OperatorRow symbol="⊕" color={C.key} delay={400} />

              <TableRow
                bits={keyBits}
                color={C.key}
                delay={500}
                labelEl={<div style={tag(C.key)}>K{rndNum} (subkey)</div>}
              />

              <OperatorRow symbol="=" color={C.f} delay={900} />

              <TableRow
                bits={fOut}
                color={C.f}
                delay={1000}
                labelEl={<div style={tag(C.f)}>F(R{rndIdx}, K{rndNum})</div>}
              />

              {/* Gap between F section and XOR-with-L section */}
              <div style={{ height: 12 }} />

              {/* ── XOR with L section ── */}
              <div style={{ opacity: 0, animation: "stagger-fade 0.5s ease forwards 1400ms" }}>
                <div style={{ fontSize: 13, fontFamily: "monospace", color: C.xor, fontWeight: "bold", textAlign: "center", marginBottom: 10, letterSpacing: 1 }}>
                  XOR with L{rndIdx} → New R{rndNum}
                </div>
              </div>

              <TableRow
                bits={L}
                color={C.L}
                delay={1600}
                labelEl={<div style={tag(C.L)}>L{rndIdx} (left half)</div>}
              />

              <OperatorRow symbol="⊕" color={C.xor} delay={2000} />

              <TableRow
                bits={fOut}
                color={C.f}
                delay={2100}
                labelEl={<div style={tag(C.f)}>F(R{rndIdx}, K{rndNum})</div>}
              />

              <OperatorRow symbol="=" color={C.xor} delay={2400} />

              <TableRow
                bits={xorOut}
                color={C.xor}
                delay={2600}
                labelEl={<div style={tag(C.xor)}>New R{rndNum} (XOR)</div>}
              />
            </div>
          )}
        </div>
      );
    }

    // ── Phase 3: Round Output ────────────────────────────────────────────────
    if (phase === 3) {
      const newL = roundData ? roundData.newL : Array(half).fill(null) as (Bit | null)[];
      const newR = roundData ? roundData.newR : Array(half).fill(null) as (Bit | null)[];
      const prevR = roundData ? roundData.prevR : Array(half).fill(null) as (Bit | null)[];
      const xorOut = roundData ? roundData.xorResult : Array(half).fill(null) as (Bit | null)[];
      const isLast = rndIdx === totalRounds - 1;
      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — Output`}
            color={C.swap}
            sub={isLast
              ? `Final round done — outputs become ciphertext`
              : `Swap: new L = old R, new R = XOR result. These feed into Round ${rndNum + 1}.`}
          />
          {!roundData && noData()}
          {roundData && (
            <>
              <div style={{ ...row, gap: 60, alignItems: "flex-start" }}>
                <div style={{ ...col, opacity: 0, animation: "stagger-fade 0.5s ease forwards 0ms" }}>
                  <div style={tag(C.R)}>Old R{rndIdx} → new L{rndNum}</div>
                  <BitRow bits={prevR} color={C.R} size={56} delay={0} />
                  <div style={{ fontSize: 28, color: C.swap }}>↓</div>
                  <div style={tag(C.L)}>L{rndNum}</div>
                  <BitRow bits={newL} color={C.L} size={56} delay={0} />
                </div>
                <div style={{ ...col, opacity: 0, animation: "stagger-fade 0.5s ease forwards 500ms" }}>
                  <div style={tag(C.xor)}>XOR result → new R{rndNum}</div>
                  <BitRow bits={xorOut} color={C.xor} size={56} delay={0} />
                  <div style={{ fontSize: 28, color: C.swap }}>↓</div>
                  <div style={tag(C.R)}>R{rndNum}</div>
                  <BitRow bits={newR} color={C.R} size={56} delay={0} />
                </div>
              </div>
              <div style={{ ...note, marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1200ms" }}>
                {isLast
                  ? `🔐 Ciphertext = [L${rndNum} ‖ R${rndNum}] = [${newL.join("")} ‖ ${newR.join("")}]`
                  : `→ (L${rndNum}, R${rndNum}) become inputs to Round ${rndNum + 1}`}
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  }

  const pct = (sub / (TOTAL - 1)) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, background: C.bg, borderRadius: 12, overflow: "hidden", fontFamily: "monospace" }}>

      {/* ── Step breadcrumb strip ────────────────────────────────────────────── */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "6px 12px", overflowX: "auto", whiteSpace: "nowrap" }}>
        {STEP_LABELS.map((lbl, i) => (
          <button
            key={i}
            onClick={() => setSub(i)}
            style={{
              display: "inline-block", padding: "5px 12px", margin: "0 3px",
              borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
              background: i === sub ? "#1d4ed8" : (i < sub ? "#1e3a5f" : "transparent"),
              color: i === sub ? "#fff" : (i < sub ? "#93c5fd" : C.dim),
              fontFamily: "monospace", fontWeight: i === sub ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            {lbl.split(" · ")[0]}
          </button>
        ))}
      </div>

      {/* ── Current step title ───────────────────────────────────────────────── */}
      <div style={{ padding: "14px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          fontSize: 13, fontWeight: "bold", color: "#f1f5f9",
          background: "#1e293b", border: "1px solid #334155",
          borderRadius: 6, padding: "4px 14px",
        }}>
          {STEP_LABELS[sub]}
        </div>
        <div style={{ fontSize: 11, color: C.dim }}>{sub + 1} / {TOTAL}</div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 24px 0", height: 4, background: "#1e293b", borderRadius: 2 }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: "linear-gradient(90deg,#818cf8,#60a5fa,#34d399,#f59e0b,#fbbf24)", transition: "width 0.3s ease" }} />
      </div>

      {/* ── Main visualization ───────────────────────────────────────────────── */}
      <div style={{ padding: "16px 32px 32px", display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ animation: "fadeSlide 0.3s ease", maxWidth: 760, width: "100%", zoom: 0.75 }}>
          {panel()}
        </div>
      </div>

      {/* ── Navigation controls ──────────────────────────────────────────────── */}
      <div style={{ padding: "14px 24px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#0f172a" }}>
        <button onClick={reset} style={btnStyle("#334155", "#94a3b8")} title="Reset">
          <RotateCcw size={15} />
        </button>
        <button onClick={prev} disabled={sub === 0} style={btnStyle("#1e293b", "#60a5fa")}>
          <ChevronLeft size={18} /> Prev
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          disabled={sub === TOTAL - 1}
          style={btnStyle(playing ? "#7f1d1d" : "#1e3a5f", playing ? "#f87171" : "#60a5fa")}
        >
          {playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Auto-play</>}
        </button>
        <button onClick={next} disabled={sub === TOTAL - 1} style={btnStyle("#1e3a5f", "#60a5fa")}>
          Next <ChevronRight size={18} />
        </button>

        {/* Speed */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.dim }}>Speed:</span>
          {SPEEDS.map((s, i) => (
            <button key={s.label} onClick={() => setSpeedIdx(i)} style={{
              padding: "3px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10,
              background: speedIdx === i ? "#2563eb" : "#1e293b",
              color: speedIdx === i ? "#fff" : C.dim, fontFamily: "monospace",
            }}>{s.label}</button>
          ))}
        </div>

        {/* Jump */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: C.dim }}>Jump:</span>
          <select
            value={sub}
            onChange={e => setSub(Number(e.target.value))}
            style={{ background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", borderRadius: 4, fontSize: 10, padding: "2px 6px", fontFamily: "monospace" }}
          >
            {STEP_LABELS.map((lbl, i) => <option key={i} value={i}>{lbl}</option>)}
          </select>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes stagger-fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
