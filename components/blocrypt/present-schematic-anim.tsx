"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import type { PRESENTState, Bit } from "@/lib/present";
import { SBOX, P_LAYER } from "@/lib/present";

interface PresentSchematicAnimProps {
  state: PRESENTState;
}

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  plain: "#818cf8",
  key: "#4ade80",
  sbox: "#f59e0b",
  player: "#34d399",
  xor: "#a78bfa",
  out: "#fbbf24",
  dim: "#475569",
  bg: "#0a0f1c",
};

// Speed presets
const SPEEDS = [
  { label: "0.5×", ms: 9000 },
  { label: "1×", ms: 4500 },
  { label: "2×", ms: 2250 },
  { label: "3×", ms: 1125 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexNibble(bits: Bit[]): string {
  return parseInt(bits.join(""), 2).toString(16).toUpperCase();
}

function bitsToHex(bits: Bit[]): string {
  const nibbles: string[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    nibbles.push(hexNibble(bits.slice(i, i + 4) as Bit[]));
  }
  return nibbles.join("");
}

function bitsToHexShort(bits: Bit[], max = 8): string {
  const hex = bitsToHex(bits);
  return hex.length > max ? hex.slice(0, max) + "…" : hex;
}

// ── NibbleRow: shows 64-bit state as 16 hex nibbles in 2 rows of 8 ─────────
function NibbleRow({
  bits, color, delay = 0, label, labelColor,
}: {
  bits: (Bit | null)[];
  color?: string;
  delay?: number;
  label?: string;
  labelColor?: string;
}) {
  const clr = color ?? C.plain;
  const chunks: (Bit | null)[][] = [];
  for (let i = 0; i < bits.length; i += 4) {
    chunks.push(bits.slice(i, i + 4));
  }

  function NibbleBox({ nibble, idx }: { nibble: (Bit | null)[]; idx: number }) {
    const hasNull = nibble.some(b => b === null);
    const val = hasNull ? "?" : hexNibble(nibble as Bit[]);
    const isNonZero = !hasNull && val !== "0";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 18, color: "#ffffff", fontFamily: "monospace", fontWeight: "bold", opacity: 0.9 }}>{idx}</div>
        <div style={{
          width: 48, height: 48,
          background: isNonZero ? `${clr}22` : "#1e293b",
          border: `2px solid ${isNonZero ? clr : "#334155"}`,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: "bold", fontFamily: "monospace",
          color: isNonZero ? clr : "#cbd5e1",
          boxShadow: isNonZero ? `0 0 10px ${clr}55` : "none",
          transition: "all 0.3s ease",
        }}>
          {val}
        </div>
      </div>
    );
  }

  // Split 16 nibbles into two rows of 8
  const row1 = chunks.slice(0, 8);
  const row2 = chunks.slice(8, 16);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
    }}>
      {label && (
        <div style={{
          fontSize: 20, fontFamily: "monospace", color: labelColor ?? "#ffffff",
          textTransform: "uppercase", letterSpacing: 2, fontWeight: "bold",
          marginBottom: 4,
        }}>{label}</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {row1.map((ch, i) => <NibbleBox key={i} nibble={ch} idx={i} />)}
      </div>
      {row2.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {row2.map((ch, i) => <NibbleBox key={i + 8} nibble={ch} idx={i + 8} />)}
        </div>
      )}
      <div style={{ fontSize: 16, color: "#cbd5e1", fontFamily: "monospace", fontWeight: "bold", marginTop: 6 }}>
        Hex: {bits.some(b => b === null) ? "?" : bitsToHexShort(bits as Bit[], 16)}
      </div>
    </div>
  );
}

// ── SBoxLookupView: 4×4 lookup table + per-nibble detail cards ────────────────
function SBoxLookupView({
  inputBits, outputBits, delay = 0,
}: {
  inputBits: Bit[]; outputBits: Bit[]; delay?: number;
}) {
  // Parse all 16 nibble lookups
  const nibbles = Array.from({ length: 16 }, (_, n) => {
    const inNib = inputBits.slice(n * 4, n * 4 + 4) as Bit[];
    const outNib = outputBits.slice(n * 4, n * 4 + 4) as Bit[];
    const inVal = parseInt(inNib.join(""), 2);
    const outVal = SBOX[inVal];
    const row = inVal >> 2;   // upper 2 bits = bits[0,1]
    const col = inVal & 3;    // lower 2 bits = bits[2,3]
    return { inNib, outNib, inVal, outVal, row, col, idx: n };
  });

  // Track which rows / cols / cells are active in this round
  const activeRows = new Set(nibbles.map(n => n.row));
  const activeCols = new Set(nibbles.map(n => n.col));
  const activeCells = new Set(nibbles.map(n => `${n.row},${n.col}`));

  const sz = 48;   // cell size
  const hdr = 40;   // row-header width
  const mono: React.CSSProperties = { fontFamily: "monospace" };

  // Mini bit square used inside nibble cards
  function MiniBit({ b }: { b: Bit }) {
    return (
      <div style={{
        width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: "bold", ...mono,
        background: b === 1 ? `${C.sbox}33` : "#1e293b",
        color: b === 1 ? C.sbox : "#cbd5e1",
        borderRadius: 4, border: `1px solid ${b === 1 ? `${C.sbox}66` : "#334155"}`,
      }}>{b}</div>
    );
  }

  return (
    <div style={{
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
      display: "flex", flexDirection: "column", gap: 16, alignItems: "center",
    }}>

      {/* ── Title ── */}
      <div style={{ fontSize: 13, color: C.sbox, ...mono, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
        PRESENT S-Box — 4×4 Lookup Table
      </div>
      <div style={{ fontSize: 12, color: "#ffffff", ...mono, textAlign: "center" }}>
        Row = bits[0,1] (upper 2 bits) · Col = bits[2,3] (lower 2 bits) · Cell = S-Box output (hex)
      </div>

      {/* ── 4×4 Table ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Column headers */}
        <div style={{ display: "flex", gap: 2, marginLeft: hdr + 2 }}>
          {[0, 1, 2, 3].map(c => (
            <div key={c} style={{
              width: sz, textAlign: "center", fontSize: 11, ...mono, fontWeight: "bold",
              color: activeCols.has(c) ? C.sbox : "#64748b",
              background: activeCols.has(c) ? `${C.sbox}22` : "transparent",
              borderRadius: 4, padding: "3px 0",
            }}>col {c}</div>
          ))}
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3].map(r => (
          <div key={r} style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* Row header */}
            <div style={{
              width: hdr, textAlign: "center", fontSize: 11, ...mono, fontWeight: "bold",
              color: activeRows.has(r) ? C.sbox : "#64748b",
              background: activeRows.has(r) ? `${C.sbox}22` : "transparent",
              borderRadius: 4, padding: "3px 0",
            }}>r{r}</div>
            {/* Cells */}
            {[0, 1, 2, 3].map(c => {
              const val = SBOX[r * 4 + c];
              const isActive = activeCells.has(`${r},${c}`);
              return (
                <div key={c} style={{
                  width: sz + 12, height: sz + 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, fontWeight: "bold", ...mono,
                  background: isActive ? C.sbox : "#1e293b",
                  color: isActive ? "#0a0f1c" : "#94a3b8",
                  border: `2px solid ${isActive ? C.sbox : "#334155"}`,
                  borderRadius: 8,
                  boxShadow: isActive ? `0 0 16px ${C.sbox}88` : "none",
                  transition: "all 0.3s ease",
                }}>
                  {val.toString(16).toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Per-nibble lookup cards ── */}
      <div style={{ fontSize: 12, color: "#ffffff", ...mono, fontWeight: "bold", marginTop: 4 }}>
        16 Parallel Nibble Lookups
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, width: "100%", maxWidth: 840 }}>
        {nibbles.map(n => (
          <div key={n.idx} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "#0f172a", border: `1px solid ${C.sbox}44`,
            borderRadius: 10, padding: "10px 14px",
          }}>
            {/* Nibble label */}
            <div style={{ fontSize: 14, color: "#ffffff", ...mono, fontWeight: "bold", borderBottom: `2px solid ${C.sbox}44`, width: "100%", textAlign: "center", paddingBottom: 4 }}>S{n.idx}</div>
            {/* Input bits */}
            <div style={{ display: "flex", gap: 4 }}>
              {n.inNib.map((b, i) => <MiniBit key={i} b={b} />)}
            </div>
            {/* Row / Col derivation */}
            <div style={{ fontSize: 12, color: "#cbd5e1", ...mono, textAlign: "center", lineHeight: 1.4, fontWeight: "bold" }}>
              {n.inVal.toString(16).toUpperCase()} → r{n.row} c{n.col}
            </div>
            {/* Lookup result tag */}
            <div style={{
              fontSize: 15, ...mono, fontWeight: "bold",
              color: "#0a0f1c", background: C.sbox,
              borderRadius: 6, padding: "3px 12px",
              boxShadow: `0 0 12px ${C.sbox}44`
            }}>
              S[{n.inVal.toString(16).toUpperCase()}] = {n.outVal.toString(16).toUpperCase()}
            </div>
            {/* Output bits */}
            <div style={{ display: "flex", gap: 4 }}>
              {n.outNib.map((b, i) => <MiniBit key={i} b={b} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PLayerPermView: per-nibble bit permutation cards (S-DES P4 style) ─────────
function PLayerPermView({
  inputBits, outputBits, delay = 0,
}: {
  inputBits: Bit[]; outputBits: Bit[]; delay?: number;
}) {
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
  const mono: React.CSSProperties = { fontFamily: "monospace" };
  const bsz = 22; // bit square size

  // For each of the 16 nibbles, gather input bits + destinations + output values
  const nibbleCards = Array.from({ length: 16 }, (_, nib) => {
    const start = nib * 4;
    const bits = Array.from({ length: 4 }, (_, j) => {
      const idx = start + j;
      const dest = P_LAYER[idx];
      return {
        idx,
        inputVal: inputBits[idx] as Bit,
        dest,
        destNib: Math.floor(dest / 4),
        outputVal: outputBits[dest] as Bit,
      };
    });
    // Which distinct output nibbles do these 4 bits scatter to?
    const destNibs = [...new Set(bits.map(b => b.destNib))].sort((a, b) => a - b);
    return { nib, bits, destNibs };
  });

  return (
    <div style={{
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
      display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
    }}>
      <div style={{ fontSize: 24, color: C.player, ...mono, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
        P-Layer — Per-Nibble Bit Permutation
      </div>
      <div style={{ fontSize: 20, color: "#ffffff", ...mono, textAlign: "center", maxWidth: 580 }}>
        Each S-Box output nibble's 4 bits scatter to 4 different positions. Input bit at position <em style={{ color: "#94a3b8" }}>i</em> moves to output position <em style={{ color: C.player }}>P[i]</em>.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, width: "100%", maxWidth: 880 }}>
        {nibbleCards.map(({ nib, bits, destNibs }) => (
          <div key={nib} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "#0f172a", border: `1px solid ${C.player}44`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            {/* Nibble label */}
            <div style={{ fontSize: 14, color: "#ffffff", ...mono, fontWeight: "bold", borderBottom: `2px solid ${C.player}44`, width: "100%", textAlign: "center", paddingBottom: 4 }}>Nib {nib}</div>

            {/* Source bit index row (hex) */}
            <div style={{ display: "flex", gap: 4 }}>
              {bits.map(b => (
                <div key={b.idx} style={{
                  width: bsz + 8, height: bsz + 4, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: "bold", ...mono, color: "#cbd5e1",
                  background: "#1e293b", borderRadius: 4,
                  border: `1px solid #475569`,
                }}>{toHex(b.idx)}</div>
              ))}
            </div>

            {/* INPUT bits row */}
            <div style={{ display: "flex", gap: 4 }}>
              {bits.map(b => (
                <div key={b.idx} style={{
                  width: bsz + 8, height: bsz + 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: "bold", ...mono,
                  background: b.inputVal === 1 ? `${C.sbox}33` : "#1e293b",
                  color: b.inputVal === 1 ? C.sbox : "#cbd5e1",
                  borderRadius: 8, border: `2px solid ${b.inputVal === 1 ? `${C.sbox}` : "#334155"}`,
                }}>{b.inputVal}</div>
              ))}
            </div>

            {/* P-Layer destination row (hex indices) */}
            <div style={{ display: "flex", gap: 4 }}>
              {bits.map(b => (
                <div key={b.idx} style={{
                  width: bsz + 8, height: bsz + 4, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: "bold", ...mono, color: C.player,
                  background: `${C.player}22`, borderRadius: 4,
                  border: `1px solid ${C.player}66`,
                }}>{toHex(b.dest)}</div>
              ))}
            </div>

            {/* Arrow */}
            <div style={{ fontSize: 24, color: C.player, lineHeight: 1, fontWeight: "bold" }}>↓</div>

            {/* OUTPUT bits row (value at destination) */}
            <div style={{ display: "flex", gap: 4 }}>
              {bits.map(b => (
                <div key={b.idx} style={{
                  width: bsz + 8, height: bsz + 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: "bold", ...mono,
                  background: b.outputVal === 1 ? `${C.player}33` : "#1e293b",
                  color: b.outputVal === 1 ? C.player : "#cbd5e1",
                  borderRadius: 8, border: `2px solid ${b.outputVal === 1 ? `${C.player}` : "#334155"}`,
                }}>{b.outputVal}</div>
              ))}
            </div>

            {/* Scatter info */}
            <div style={{ fontSize: 14, color: "#ffffff", ...mono, textAlign: "center", fontWeight: "bold", marginTop: 4, opacity: 1 }}>
              → nibs {destNibs.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PLayerOutputFormation: Explains how scattered bits form output nibbles ────
function PLayerOutputFormation({ outputBits, delay = 0 }: { outputBits: Bit[]; delay?: number }) {
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
  const mono: React.CSSProperties = { fontFamily: "monospace" };
  const bsz = 22;

  const nibbles = Array.from({ length: 16 }, (_, nib) => {
    const start = nib * 4;
    const bits = outputBits.slice(start, start + 4);
    const hexVal = parseInt(bits.join(""), 2).toString(16).toUpperCase();
    return { nib, start, bits, hexVal };
  });

  return (
    <div style={{
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
      display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
      background: "#080c14", border: `1px solid ${C.player}33`,
      borderRadius: 10, padding: "14px 16px", maxWidth: 760, width: "100%", marginTop: 10
    }}>
      <div style={{ fontSize: 24, color: C.player, ...mono, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
        Output Nibble Assembly
      </div>
      <div style={{ fontSize: 20, color: "#ffffff", ...mono, textAlign: "center", maxWidth: 580 }}>
        The permuted bits assemble into the 16 4-bit output nibbles. For example, bits at positions <em style={{ color: C.player }}>00, 01, 02, 03</em> form output <em style={{ color: C.player }}>Nib 0</em>.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 740 }}>
        {nibbles.map(({ nib, start, bits, hexVal }) => (
          <div key={nib} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            background: "#0f172a", border: `1px solid ${C.player}44`,
            borderRadius: 8, padding: "8px 10px", minWidth: 90,
          }}>
            <div style={{ fontSize: 16, color: "#ffffff", ...mono, fontWeight: "bold", borderBottom: `2px solid ${C.player}44`, width: "100%", textAlign: "center", paddingBottom: 4 }}>Out Nib {nib}</div>

            {/* Output bit positions */}
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: bsz + 8, height: bsz + 4, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: "bold", ...mono, color: C.player,
                  background: `${C.player}22`, borderRadius: 4,
                  border: `1px solid ${C.player}66`,
                }}>{toHex(start + i)}</div>
              ))}
            </div>

            {/* Output bit values */}
            <div style={{ display: "flex", gap: 4 }}>
              {bits.map((b, i) => (
                <div key={i} style={{
                  width: bsz + 8, height: bsz + 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: "bold", ...mono,
                  background: b === 1 ? `${C.player}33` : "#1e293b",
                  color: b === 1 ? C.player : "#cbd5e1",
                  borderRadius: 8, border: `2px solid ${b === 1 ? `${C.player}` : "#334155"}`,
                }}>{b}</div>
              ))}
            </div>

            <div style={{ fontSize: 24, color: C.player, lineHeight: 1, fontWeight: "bold" }}>↓</div>

            <div style={{
              fontSize: 22, fontWeight: "bold", ...mono, color: "#0a0f1c",
              background: C.player, padding: "4px 18px", borderRadius: 6,
              boxShadow: `0 0 12px ${C.player}66`
            }}>
              {hexVal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text, color, sub }: { text: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginBottom: 4 }}>
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
      fontSize: 32, color: color ?? "#ffffff", lineHeight: 1, margin: "4px 0",
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`,
    }}>↓</div>
  );
}

// ── Tag helper ────────────────────────────────────────────────────────────────
function tag(c: string): React.CSSProperties {
  return {
    fontSize: 12, fontFamily: "monospace", color: c, fontWeight: "bold",
    background: `${c}18`, border: `1px solid ${c}55`, borderRadius: 4, padding: "2px 10px",
    display: "inline-block",
  };
}

function btnStyle(bg: string, clr: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
    background: bg, color: clr, fontFamily: "monospace", fontSize: 12,
    fontWeight: "bold", transition: "opacity 0.2s",
  };
}

const col: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 14 };
const note: React.CSSProperties = { fontSize: 14, color: "#ffffff", fontFamily: "monospace", textAlign: "center", maxWidth: 580, lineHeight: 1.6 };

// ── Step definitions ──────────────────────────────────────────────────────────
// Per round: 4 sub-steps  (0=input+key, 1=addkey, 2=sbox, 3=player/output)
// Step 0 = plaintext input, last = ciphertext output
const STEPS_PER_ROUND = 4;

function makeStepLabels(totalRounds: number): string[] {
  const labels: string[] = ["0 · Plaintext Input"];
  for (let r = 1; r <= totalRounds; r++) {
    const base = (r - 1) * STEPS_PER_ROUND + 1;
    labels.push(`${base} · Round ${r}: Input & Key`);
    labels.push(`${base + 1} · Round ${r}: AddRoundKey`);
    labels.push(`${base + 2} · Round ${r}: S-Box Layer`);
    if (r < totalRounds) {
      labels.push(`${base + 3} · Round ${r}: P-Layer`);
    } else {
      labels.push(`${base + 3} · Round ${r}: Final AddRoundKey`);
    }
  }
  labels.push(`${totalRounds * STEPS_PER_ROUND + 1} · Ciphertext Output`);
  return labels;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function PresentSchematicAnim({ state }: PresentSchematicAnimProps) {
  const totalRounds = state.totalRounds;
  const TOTAL = totalRounds * STEPS_PER_ROUND + 2; // +2 for intro and outro
  const STEP_LABELS = makeStepLabels(totalRounds);

  const [sub, setSub] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSub(0); setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.plaintext.join(""), state.totalRounds, state.mode]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setSub(prev => {
          if (prev >= TOTAL - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, SPEEDS[speedIdx].ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speedIdx, TOTAL]);

  const next = useCallback(() => setSub(p => Math.min(p + 1, TOTAL - 1)), [TOTAL]);
  const prev = useCallback(() => setSub(p => Math.max(p - 1, 0)), []);
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
      <div style={{ color: "#ffffff", fontFamily: "monospace", textAlign: "center", padding: 32, fontSize: 14 }}>
        ⚠ No round data yet — click <strong>Next Round</strong> or <strong>Run All</strong> in the sidebar to compute.
      </div>
    );
  }

  function panel() {
    const pt = state.plaintext;

    // ── Step 0: Plaintext ─────────────────────────────────────────────────────
    if (sub === 0) {
      return (
        <div style={col}>
          <SectionLabel
            text="Plaintext Input"
            color={C.plain}
            sub={`64-bit block entering PRESENT ${state.mode === "encryption" ? "encryption" : "decryption"} (${totalRounds} rounds)`}
          />
          <NibbleRow bits={pt} color={C.plain} label="Plaintext (64 bits — shown as 16 hex nibbles)" delay={0} />
          <DownArrow color={C.plain} delay={800} />
          <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1200ms" }}>
            ↓ Enters Round 1: AddRoundKey (⊕ with K1)
          </div>
        </div>
      );
    }

    // ── Last step: Ciphertext ─────────────────────────────────────────────────
    if (sub === TOTAL - 1) {
      const ct = state.ciphertext;
      const hasData = ct.length > 0;
      return (
        <div style={col}>
          <SectionLabel
            text={state.mode === "encryption" ? "🔐 Ciphertext Output" : "🔓 Recovered Plaintext"}
            color={C.out}
            sub={state.mode === "encryption"
              ? `PRESENT encryption complete — 64-bit ciphertext after ${totalRounds} rounds`
              : `Decryption complete — recovered plaintext after ${totalRounds} rounds`}
          />
          {!hasData && noData()}
          {hasData && (
            <>
              <NibbleRow bits={ct} color={C.out} label={state.mode === "encryption" ? "Ciphertext (64 bits)" : "Recovered Plaintext"} delay={0} />
              <div style={{ ...note, marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
                Full Hex: {bitsToHex(ct)}
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Round sub-steps ───────────────────────────────────────────────────────
    const rndIdx = Math.floor((sub - 1) / STEPS_PER_ROUND); // 0-based
    const phase = ((sub - 1) % STEPS_PER_ROUND) + 1;       // 1..4
    const rndNum = rndIdx + 1;
    const isLast = rndNum === totalRounds;
    const rd = state.history[rndIdx] ?? null;

    // ── Phase 1: Input & Key ──────────────────────────────────────────────────
    if (phase === 1) {
      const inputBits = rd ? rd.inputState : Array(64).fill(null) as (Bit | null)[];
      const keyBits = rd ? rd.roundKey : Array(64).fill(null) as (Bit | null)[];
      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — Inputs`}
            color={C.xor}
            sub={`Round state enters AddRoundKey — XOR'd with subkey K${rndNum}`}
          />
          {!rd && noData()}
          {rd && (
            <>
              <NibbleRow
                bits={inputBits}
                color={rndIdx === 0 ? C.plain : C.player}
                label={`Round ${rndNum} Input State`}
                delay={0}
              />
              <DownArrow color={C.xor} delay={800} />
              <NibbleRow
                bits={keyBits}
                color={C.key}
                label={`K${rndNum} — Round Key (64 bits, Hex)`}
                labelColor={C.key}
                delay={1000}
              />
              <div style={{ ...note, marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1800ms" }}>
                Input ⊕ K{rndNum} → AddRoundKey output
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Phase 2: AddRoundKey ──────────────────────────────────────────────────
    if (phase === 2) {
      const inputBits = rd ? rd.inputState : Array(64).fill(null) as (Bit | null)[];
      const keyBits = rd ? rd.roundKey : Array(64).fill(null) as (Bit | null)[];
      const outBits = rd ? rd.afterAddKey : Array(64).fill(null) as (Bit | null)[];
      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — AddRoundKey`}
            color={C.xor}
            sub={`Each of the 64 bits XOR'd with the corresponding bit of K${rndNum}`}
          />
          {!rd && noData()}
          {rd && (
            <>
              <NibbleRow bits={inputBits} color={C.plain} label="State In" delay={0} />
              <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.4s ease forwards 600ms" }}>
                <span style={{ color: C.xor, fontSize: 22, fontWeight: "bold" }}>⊕</span>
              </div>
              <NibbleRow bits={keyBits} color={C.key} label={`K${rndNum} (round key)`} labelColor={C.key} delay={800} />
              <div style={{ width: "90%", height: 2, background: `${C.xor}44`, borderRadius: 1, opacity: 0, animation: "stagger-fade 0.4s ease forwards 1300ms" }} />
              <NibbleRow bits={outBits} color={C.xor} label="After AddRoundKey" labelColor={C.xor} delay={1500} />
            </>
          )}
        </div>
      );
    }

    // ── Phase 3: S-Box Layer ──────────────────────────────────────────────────
    if (phase === 3) {
      const inBits = rd ? rd.afterAddKey : Array(64).fill(null) as (Bit | null)[];
      const outBits = rd ? rd.afterSBox : Array(64).fill(null) as (Bit | null)[];
      return (
        <div style={col}>
          <SectionLabel
            text={`Round ${rndNum} — S-Box Layer`}
            color={C.sbox}
            sub="16 parallel 4-bit S-Box substitutions applied to the 64-bit state"
          />
          {!rd && noData()}
          {rd && (
            <>
              <NibbleRow bits={inBits} color={C.xor} label="S-Box Input (After AddRoundKey)" delay={0} />
              <DownArrow color={C.sbox} delay={600} />
              <SBoxLookupView inputBits={rd.afterAddKey} outputBits={rd.afterSBox} delay={900} />
              <DownArrow color={C.sbox} delay={2200} />
              <NibbleRow bits={outBits} color={C.sbox} label="After S-Box Layer" labelColor={C.sbox} delay={2500} />
            </>
          )}
        </div>
      );
    }

    // ── Phase 4: P-Layer or Final AddRoundKey ─────────────────────────────────
    if (phase === 4) {
      if (!isLast) {
        // P-Layer
        const inBits = rd ? rd.afterSBox : Array(64).fill(null) as (Bit | null)[];
        const outBits = rd ? rd.afterPLayer : Array(64).fill(null) as (Bit | null)[];
        return (
          <div style={col}>
            <SectionLabel
              text={`Round ${rndNum} — P-Layer (Bit Permutation)`}
              color={C.player}
              sub={`Each of the 64 bits is moved to a new position according to the PRESENT P-Layer table → feeds into Round ${rndNum + 1}`}
            />
            {!rd && noData()}
            {rd && (
              <>
                <NibbleRow bits={inBits} color={C.sbox} label="P-Layer Input (After S-Box)" delay={0} />
                <DownArrow color={C.player} delay={600} />
                <PLayerPermView inputBits={inBits as Bit[]} outputBits={outBits as Bit[]} delay={800} />
                <DownArrow color={C.player} delay={1600} />
                <PLayerOutputFormation outputBits={outBits as Bit[]} delay={1900} />
                <DownArrow color={C.player} delay={2700} />
                <NibbleRow bits={outBits} color={C.player} label={`After P-Layer — Input to Round ${rndNum + 1}`} labelColor={C.player} delay={3000} />
              </>
            )}
          </div>
        );
      } else {
        // Final AddRoundKey
        const inBits = rd ? rd.afterSBox : Array(64).fill(null) as (Bit | null)[];
        const keyBits = rd ? (rd.extraRoundKey ?? rd.roundKey) : Array(64).fill(null) as (Bit | null)[];
        const outBits = rd ? (rd.extraAddKey ?? rd.afterPLayer) : Array(64).fill(null) as (Bit | null)[];
        return (
          <div style={col}>
            <SectionLabel
              text={`Round ${rndNum} — Final AddRoundKey`}
              color={C.out}
              sub={`Last step: S-Box output XOR'd with K${rndNum + 1} to produce the ciphertext`}
            />
            {!rd && noData()}
            {rd && (
              <>
                <NibbleRow bits={inBits} color={C.sbox} label="After S-Box (last round)" delay={0} />
                <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.4s ease forwards 600ms" }}>
                  <span style={{ color: C.xor, fontSize: 22, fontWeight: "bold" }}>⊕</span>
                </div>
                <NibbleRow bits={keyBits} color={C.key} label={`K${rndNum + 1} — Final Key`} labelColor={C.key} delay={800} />
                <div style={{ width: "90%", height: 2, background: `${C.out}44`, borderRadius: 1, opacity: 0, animation: "stagger-fade 0.4s ease forwards 1300ms" }} />
                <NibbleRow bits={outBits} color={C.out} label="🔐 Ciphertext (64 bits)" labelColor={C.out} delay={1500} />
              </>
            )}
          </div>
        );
      }
    }

    return null;
  }

  const pct = TOTAL > 1 ? (sub / (TOTAL - 1)) * 100 : 0;

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
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: "linear-gradient(90deg,#818cf8,#a78bfa,#f59e0b,#34d399,#fbbf24)", transition: "width 0.3s ease" }} />
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
