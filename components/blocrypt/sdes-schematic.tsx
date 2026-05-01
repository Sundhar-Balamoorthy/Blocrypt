"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SDESState } from "@/lib/sdes";
import { IP, EP, S0, S1, P4, P10, P8, IP_INV } from "@/lib/sdes";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import {
  type Bit, C,
  BitRow, XorView, PermTable, SBoxTable, SectionLabel, DownArrow,
  sboxRow, sboxCol,
} from "./sdes-anim-helpers";

interface SDESSchematicProps {
  state: SDESState;
}

const STEP_LABELS = [
  "0 · Plaintext Input",
  "1 · Key: P10 Permutation",
  "2 · Key: Generate K1",
  "3 · Key: Generate K2",
  "4 · Initial Permutation (IP)",
  "5 · Split → L and R",
  "6 · R1: EP Expansion",
  "7 · R1: XOR with K1",
  "8 · R1: S0 Box Lookup",
  "9 · R1: S1 Box Lookup",
  "10 · R1: P4 Permutation",
  "11 · R1: XOR with L",
  "12 · Swap Halves (SW)",
  "13 · R2: EP Expansion",
  "14 · R2: XOR with K2",
  "15 · R2: S0 Box Lookup",
  "16 · R2: S1 Box Lookup",
  "17 · R2: P4 Permutation",
  "18 · R2: XOR with L",
  "19 · Inverse IP (IP⁻¹)",
  "20 · Ciphertext Output",
];
const TOTAL = STEP_LABELS.length;

// Speed: label → ms between steps
const SPEEDS = [
  { label: "0.5×", ms: 9000 },
  { label: "1×", ms: 4500 },
  { label: "2×", ms: 2250 },
  { label: "3×", ms: 1125 },
];

export function SDESSchematic({ state }: SDESSchematicProps) {
  const [sub, setSub] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pt = state.plaintext as Bit[];
  const k10 = state.key10 as Bit[];
  const ks = state.keyState;
  const ipOut = state.ipOutput as Bit[];
  const r1 = state.round1Detail;
  const r2 = state.round2Detail;
  const sw = state.afterSwap as Bit[];
  const ct = state.ciphertext as Bit[];
  const mode = state.mode;

  const k1 = (mode === "encryption" ? ks?.k1 : ks?.k2) as Bit[] ?? [];
  const k2 = (mode === "encryption" ? ks?.k2 : ks?.k1) as Bit[] ?? [];
  const L0 = ipOut.slice(0, 4) as Bit[];
  const R0 = ipOut.slice(4) as Bit[];

  // Reset sub-step when cipher inputs change
  useEffect(() => {
    setSub(0); setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pt.join(""), k10.join(""), mode]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setSub(prev => { if (prev >= TOTAL - 1) { setPlaying(false); return prev; } return prev + 1; });
      }, SPEEDS[speedIdx].ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speedIdx]);

  const next = useCallback(() => setSub(p => Math.min(p + 1, TOTAL - 1)), []);
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

  // ── Step panels ─────────────────────────────────────────────────────────────

  function noData() {
    return (
      <div style={{ color: C.dim, fontFamily: "monospace", textAlign: "center", padding: 32 }}>
        ⚠ Press &quot;Next Step&quot; in the sidebar to compute the cipher first.
      </div>
    );
  }

  function panel() {
    switch (sub) {

      /* ── 0: Input ──────────────────────────────────────────────────────── */
      case 0:
        return (
          <div style={col}>
            <SectionLabel text="Plaintext Input" color={C.plain} sub="8-bit block entering S-DES" />
            <BitRow bits={pt} label="Plaintext (8 bits)" labelColor={C.plain} color={C.plain} size={60} delay={0} />
            <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 400ms" }}>
              Decimal: {parseInt(pt.join(""), 2)} | Hex: 0x{parseInt(pt.join(""), 2).toString(16).toUpperCase().padStart(2, "0")}
            </div>
            <DownArrow color={C.plain} delay={800} />
            <div style={{ color: "#ffffff", fontFamily: "monospace", fontSize: 15, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1200ms" }}>
              ↓ Enters the IP permutation
            </div>
          </div>
        );

      /* ── 1: P10 ────────────────────────────────────────────────────────── */
      case 1:
        return (
          <div style={col}>
            <SectionLabel text="Key Schedule — P10" color={C.key} sub={`10-bit key permuted by P10 table [${P10.join(",")}]`} />
            <BitRow bits={k10} label="10-bit Key Input" labelColor={C.key} color={C.key} size={48} delay={0} />
            <DownArrow color={C.key} delay={400} />
            <PermTable table={P10} inputBits={k10} outputBits={ks?.p10Result as Bit[] ?? []} label="P10 — source index for each output position" color={C.key} delay={800} />
            <DownArrow color={C.key} delay={1600} />
            <BitRow bits={ks?.p10Result as Bit[] ?? []} label="After P10" labelColor={C.key} color={C.key} size={48} delay={2000} />
          </div>
        );

      /* ── 2: K1 ─────────────────────────────────────────────────────────── */
      case 2:
        return (
          <div style={col}>
            <SectionLabel text="Key Schedule — Generate K1" color={C.key} sub="LS-1 (shift each half left by 1) → P8 selects 8 bits → K1" />
            <BitRow bits={ks?.p10Result as Bit[] ?? []} label="After P10 (10 bits)" labelColor={C.key} color={C.key} size={44} delay={0} />
            <DownArrow color={C.key} delay={400} />
            <div style={{ ...row, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.key)}>Left 5 → LS-1</div>
                <BitRow bits={(ks?.ls1Result as Bit[] ?? []).slice(0, 5)} color={C.key} size={44} delay={0} />
              </div>
              <div style={col}>
                <div style={tag(C.key)}>Right 5 → LS-1</div>
                <BitRow bits={(ks?.ls1Result as Bit[] ?? []).slice(5)} color={C.key} size={44} delay={0} />
              </div>
            </div>
            <DownArrow color={C.key} delay={1600} />
            <PermTable table={P8} inputBits={ks?.ls1Result as Bit[] ?? []} outputBits={ks?.k1 as Bit[] ?? []} label="P8 — picks 8 of 10 bits" color={C.key} delay={2000} />
            <DownArrow color={C.key} delay={2600} />
            <BitRow bits={ks?.k1 as Bit[] ?? []} label="K1 (8-bit subkey)" labelColor={C.key} color={C.key} size={54} delay={3000} />
          </div>
        );

      /* ── 3: K2 ─────────────────────────────────────────────────────────── */
      case 3:
        return (
          <div style={col}>
            <SectionLabel text="Key Schedule — Generate K2" color={C.key} sub="LS-2 (shift each half left by 2 from LS-1) → P8 → K2" />
            <BitRow bits={ks?.ls1Result as Bit[] ?? []} label="After LS-1 (10 bits)" labelColor={C.key} color={C.key} size={44} delay={0} />
            <DownArrow color={C.key} delay={400} />
            <div style={{ ...row, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.key)}>Left 5 → LS-2</div>
                <BitRow bits={(ks?.ls2Result as Bit[] ?? []).slice(0, 5)} color={C.key} size={44} delay={0} />
              </div>
              <div style={col}>
                <div style={tag(C.key)}>Right 5 → LS-2</div>
                <BitRow bits={(ks?.ls2Result as Bit[] ?? []).slice(5)} color={C.key} size={44} delay={0} />
              </div>
            </div>
            <DownArrow color={C.key} delay={1600} />
            <PermTable table={P8} inputBits={ks?.ls2Result as Bit[] ?? []} outputBits={ks?.k2 as Bit[] ?? []} label="P8 — picks 8 of 10 bits" color={C.key} delay={2000} />
            <DownArrow color={C.key} delay={2600} />
            <BitRow bits={ks?.k2 as Bit[] ?? []} label="K2 (8-bit subkey)" labelColor={C.key} color={C.key} size={54} delay={3000} />
          </div>
        );

      /* ── 4: IP ─────────────────────────────────────────────────────────── */
      case 4:
        return (
          <div style={col}>
            <SectionLabel text="Initial Permutation (IP)" color={C.plain} sub={`IP table: [${IP.join(",")}] — each cell shows which input bit goes to that output position`} />
            <BitRow bits={pt} label="Plaintext → IP Input" labelColor={C.plain} color={C.plain} size={50} delay={0} />
            <DownArrow color={C.plain} delay={400} />
            <PermTable table={IP} inputBits={pt} outputBits={ipOut.length ? ipOut : Array(8).fill(null)} label="IP Table (source → destination)" color={C.plain} delay={800} />
            <DownArrow color={C.plain} delay={1600} />
            <BitRow bits={ipOut.length ? ipOut : Array(8).fill(null)} label="IP Output (8 bits)" labelColor={C.plain} color={C.plain} size={54} delay={2000} />
          </div>
        );

      /* ── 5: Split ──────────────────────────────────────────────────────── */
      case 5:
        return (
          <div style={col}>
            <SectionLabel text="Split into L and R" color={C.L} sub="8-bit IP output divided into two 4-bit halves" />
            <BitRow bits={ipOut.length ? ipOut : Array(8).fill(null)} label="IP Output" color={C.plain} size={54} delay={0} />
            <DownArrow delay={400} />
            <div style={{ ...row, gap: 60, alignItems: "flex-start", opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.L)}>L — bits [0–3]</div>
                <BitRow bits={L0.length ? L0 : Array(4).fill(null)} color={C.L} size={60} delay={0} />
              </div>
              <div style={col}>
                <div style={tag(C.R)}>R — bits [4–7]</div>
                <BitRow bits={R0.length ? R0 : Array(4).fill(null)} color={C.R} size={60} delay={0} />
              </div>
            </div>
          </div>
        );

      /* ── 6: EP Round 1 ─────────────────────────────────────────────────── */
      case 6:
        if (!r1) return noData();
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — EP Expansion" color={C.R} sub={`EP: [${EP.join(",")}] expands R from 4→8 bits. Positions 0 & 3 are duplicated.`} />
            <BitRow bits={R0} label="R (4 bits)" labelColor={C.R} color={C.R} size={60} delay={0} />
            <DownArrow color={C.R} delay={400} />
            <PermTable table={EP} inputBits={R0} outputBits={r1.epResult} label="EP Table (src bit index)" color={C.R} delay={800} />
            <DownArrow color={C.R} delay={1600} />
            <BitRow bits={r1.epResult} label="EP Output (8 bits)" labelColor={C.R} color={C.R} size={50} delay={2000} />
            <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 2600ms" }}>
              ★ Bits at index 0 and 3 each appear twice — this expansion allows XOR with the 8-bit subkey
            </div>
          </div>
        );

      /* ── 7: XOR K1 ─────────────────────────────────────────────────────── */
      case 7:
        if (!r1) return noData();
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — XOR with K1" color={C.xor} sub="Each EP-expanded bit is XOR'd with corresponding K1 bit" />
            <XorView a={r1.epResult} b={k1} result={r1.xorResult} labelA="EP(R) — 8 bits" labelB={`K1 = [${k1.join("")}]`} labelResult="XOR Result" colorA={C.R} colorB={C.key} colorResult={C.xor} delay={400} />
          </div>
        );

      /* ── 8: S0 Round 1 ─────────────────────────────────────────────────── */
      case 8: {
        if (!r1) return noData();
        const inp = r1.s0Input;
        const rr = sboxRow(inp), cc = sboxCol(inp);
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — S0 Box Lookup" color={C.sbox} sub="Left 4 bits of XOR result → row=bits[0,3], col=bits[1,2] → 2-bit output" />
            <BitRow bits={inp} label="S0 Input (4 bits)" labelColor={C.sbox} highlights={new Set([0, 1, 2, 3])} color={C.sbox} size={60} delay={0} />
            <div style={{ ...row, gap: 48, alignItems: "flex-start", marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.sbox)}>Row = bits[0,3] = {inp[0]}{inp[3]} → r{rr}</div>
                <div style={tag(C.sbox)}>Col = bits[1,2] = {inp[1]}{inp[2]} → c{cc}</div>
                <div style={{ marginTop: 12 }}>
                  <SBoxTable sbox={S0} rowIdx={rr} colIdx={cc} label="S0 — 4×4 Lookup Table" color={C.sbox} delay={0} />
                </div>
              </div>
              <div style={{ ...col, justifyContent: "center", paddingTop: 50 }}>
                <div style={tag(C.sbox)}>S0[{rr}][{cc}] = {S0[rr][cc]}</div>
                <DownArrow color={C.sbox} delay={1600} />
                <BitRow bits={r1.s0Output} label="S0 Output (2 bits)" labelColor={C.sbox} color={C.sbox} size={64} delay={2200} />
              </div>
            </div>
          </div>
        );
      }

      /* ── 9: S1 Round 1 ─────────────────────────────────────────────────── */
      case 9: {
        if (!r1) return noData();
        const inp = r1.s1Input;
        const rr = sboxRow(inp), cc = sboxCol(inp);
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — S1 Box Lookup" color={C.sbox2} sub="Right 4 bits of XOR result → row=bits[0,3], col=bits[1,2] → 2-bit output" />
            <BitRow bits={inp} label="S1 Input (4 bits)" labelColor={C.sbox2} highlights={new Set([0, 1, 2, 3])} color={C.sbox2} size={60} delay={0} />
            <div style={{ ...row, gap: 48, alignItems: "flex-start", marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.sbox2)}>Row = bits[0,3] = {inp[0]}{inp[3]} → r{rr}</div>
                <div style={tag(C.sbox2)}>Col = bits[1,2] = {inp[1]}{inp[2]} → c{cc}</div>
                <div style={{ marginTop: 12 }}>
                  <SBoxTable sbox={S1} rowIdx={rr} colIdx={cc} label="S1 — 4×4 Lookup Table" color={C.sbox2} delay={0} />
                </div>
              </div>
              <div style={{ ...col, justifyContent: "center", paddingTop: 50 }}>
                <div style={tag(C.sbox2)}>S1[{rr}][{cc}] = {S1[rr][cc]}</div>
                <DownArrow color={C.sbox2} delay={1600} />
                <BitRow bits={r1.s1Output} label="S1 Output (2 bits)" labelColor={C.sbox2} color={C.sbox2} size={64} delay={2200} />
              </div>
            </div>
          </div>
        );
      }

      /* ── 10: P4 Round 1 ────────────────────────────────────────────────── */
      case 10: {
        if (!r1) return noData();
        const combined = [...r1.s0Output, ...r1.s1Output] as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — P4 Permutation" color={C.p4} sub={`Combined S0+S1 (4 bits) permuted via P4 [${P4.join(",")}]`} />
            <div style={{ ...row, opacity: 0, animation: "stagger-fade 0.5s ease forwards 0ms" }}>
              <div style={col}>
                <div style={tag(C.sbox)}>S0 Output</div>
                <BitRow bits={r1.s0Output} color={C.sbox} size={54} showIndices={false} delay={0} />
              </div>
              <div style={{ color: "#64748b", fontSize: 26, alignSelf: "flex-end", paddingBottom: 6 }}>+</div>
              <div style={col}>
                <div style={tag(C.sbox2)}>S1 Output</div>
                <BitRow bits={r1.s1Output} color={C.sbox2} size={54} showIndices={false} delay={0} />
              </div>
            </div>
            <DownArrow color={C.p4} delay={800} />
            <PermTable table={P4} inputBits={combined} outputBits={r1.p4Result} label={`P4 Table [${P4.join(",")}]`} color={C.p4} delay={1200} />
            <DownArrow color={C.p4} delay={2000} />
            <BitRow bits={r1.p4Result} label="P4 Output (4 bits)" labelColor={C.p4} color={C.p4} size={60} delay={2600} />
          </div>
        );
      }

      /* ── 11: XOR L Round 1 ─────────────────────────────────────────────── */
      case 11: {
        if (!r1) return noData();
        const newL = r1.fkOutput.slice(0, 4) as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Round 1 — XOR P4 with L" color={C.L} sub="P4 result XOR'd with the L half → new left half of f_K output" />
            <XorView a={r1.p4Result} b={L0} result={newL} labelA="P4 Result" labelB={`L = [${L0.join("")}]`} labelResult="New L (f_K₁ output left)" colorA={C.p4} colorB={C.L} colorResult={C.L} delay={400} />
            <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 2000ms" }}>
              R passes through unchanged: [{R0.join("")}] remains as the right half of f_K output
            </div>
          </div>
        );
      }

      /* ── 12: Swap ──────────────────────────────────────────────────────── */
      case 12: {
        if (!r1) return noData();
        const fL = r1.fkOutput.slice(0, 4) as Bit[];
        const fR = r1.fkOutput.slice(4) as Bit[];
        const sL = sw.slice(0, 4) as Bit[];
        const sR = sw.slice(4) as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Swap Halves (SW)" color={C.swap} sub="Left and right halves are exchanged before Round 2" />
            <div style={{ ...row, gap: 60, opacity: 0, animation: "stagger-fade 0.5s ease forwards 0ms" }}>
              <div style={col}><div style={tag(C.L)}>Before: L</div><BitRow bits={fL} color={C.L} size={54} showIndices={false} delay={0} /></div>
              <div style={col}><div style={tag(C.R)}>Before: R</div><BitRow bits={fR} color={C.R} size={54} showIndices={false} delay={0} /></div>
            </div>
            <div style={{ fontSize: 56, color: C.swap, lineHeight: 1, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>⇄</div>
            <div style={{ ...row, gap: 60, opacity: 0, animation: "stagger-fade 0.5s ease forwards 1600ms" }}>
              <div style={col}><div style={tag(C.R)}>After: new L (was R)</div><BitRow bits={sL} color={C.R} size={54} showIndices={false} delay={0} /></div>
              <div style={col}><div style={tag(C.L)}>After: new R (was L)</div><BitRow bits={sR} color={C.L} size={54} showIndices={false} delay={0} /></div>
            </div>
            <BitRow bits={sw} label="Swap Output (8 bits)" labelColor={C.swap} color={C.swap} size={50} delay={2400} />
          </div>
        );
      }

      /* ── 13: EP Round 2 ────────────────────────────────────────────────── */
      case 13: {
        if (!r2) return noData();
        const R2 = sw.slice(4) as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — EP Expansion" color={C.R} sub={`New R (right half after swap = [${R2.join("")}]) → EP expansion`} />
            <BitRow bits={sw} label="Swap Output (8 bits)" color={C.swap} size={50} delay={0} />
            <div style={{ ...note, opacity: 0, animation: "stagger-fade 0.5s ease forwards 400ms" }}>
              → Right half after swap = R2 input: [{R2.join("")}]
            </div>
            <DownArrow color={C.R} delay={800} />
            <PermTable table={EP} inputBits={R2} outputBits={r2.epResult} label="EP Table" color={C.R} delay={1200} />
            <DownArrow color={C.R} delay={2000} />
            <BitRow bits={r2.epResult} label="EP Output (8 bits)" labelColor={C.R} color={C.R} size={50} delay={2400} />
          </div>
        );
      }

      /* ── 14: XOR K2 ────────────────────────────────────────────────────── */
      case 14:
        if (!r2) return noData();
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — XOR with K2" color={C.xor} sub="EP-expanded bits XOR'd with K2 subkey" />
            <XorView a={r2.epResult} b={k2} result={r2.xorResult} labelA="EP(R₂) — 8 bits" labelB={`K2 = [${k2.join("")}]`} labelResult="XOR Result" colorA={C.R} colorB={C.key} colorResult={C.xor} delay={400} />
          </div>
        );

      /* ── 15: S0 Round 2 ────────────────────────────────────────────────── */
      case 15: {
        if (!r2) return noData();
        const inp = r2.s0Input;
        const rr = sboxRow(inp), cc = sboxCol(inp);
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — S0 Box Lookup" color={C.sbox} sub="Left 4 bits of Round 2 XOR result → lookup in S0" />
            <BitRow bits={inp} label="S0 Input (4 bits)" labelColor={C.sbox} color={C.sbox} size={60} delay={0} />
            <div style={{ ...row, gap: 48, alignItems: "flex-start", marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.sbox)}>Row = bits[0,3] = {inp[0]}{inp[3]} → r{rr}</div>
                <div style={tag(C.sbox)}>Col = bits[1,2] = {inp[1]}{inp[2]} → c{cc}</div>
                <div style={{ marginTop: 12 }}>
                  <SBoxTable sbox={S0} rowIdx={rr} colIdx={cc} label="S0 — 4×4 Lookup Table" color={C.sbox} delay={0} />
                </div>
              </div>
              <div style={{ ...col, justifyContent: "center", paddingTop: 50 }}>
                <div style={tag(C.sbox)}>S0[{rr}][{cc}] = {S0[rr][cc]}</div>
                <DownArrow color={C.sbox} delay={1600} />
                <BitRow bits={r2.s0Output} label="S0 Output (2 bits)" labelColor={C.sbox} color={C.sbox} size={64} delay={2200} />
              </div>
            </div>
          </div>
        );
      }

      /* ── 16: S1 Round 2 ────────────────────────────────────────────────── */
      case 16: {
        if (!r2) return noData();
        const inp = r2.s1Input;
        const rr = sboxRow(inp), cc = sboxCol(inp);
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — S1 Box Lookup" color={C.sbox2} sub="Right 4 bits of Round 2 XOR result → lookup in S1" />
            <BitRow bits={inp} label="S1 Input (4 bits)" labelColor={C.sbox2} color={C.sbox2} size={60} delay={0} />
            <div style={{ ...row, gap: 48, alignItems: "flex-start", marginTop: 8, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              <div style={col}>
                <div style={tag(C.sbox2)}>Row = bits[0,3] = {inp[0]}{inp[3]} → r{rr}</div>
                <div style={tag(C.sbox2)}>Col = bits[1,2] = {inp[1]}{inp[2]} → c{cc}</div>
                <div style={{ marginTop: 12 }}>
                  <SBoxTable sbox={S1} rowIdx={rr} colIdx={cc} label="S1 — 4×4 Lookup Table" color={C.sbox2} delay={0} />
                </div>
              </div>
              <div style={{ ...col, justifyContent: "center", paddingTop: 50 }}>
                <div style={tag(C.sbox2)}>S1[{rr}][{cc}] = {S1[rr][cc]}</div>
                <DownArrow color={C.sbox2} delay={1600} />
                <BitRow bits={r2.s1Output} label="S1 Output (2 bits)" labelColor={C.sbox2} color={C.sbox2} size={64} delay={2200} />
              </div>
            </div>
          </div>
        );
      }

      /* ── 17: P4 Round 2 ────────────────────────────────────────────────── */
      case 17: {
        if (!r2) return noData();
        const combined = [...r2.s0Output, ...r2.s1Output] as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — P4 Permutation" color={C.p4} sub={`S0+S1 combined (4 bits) → P4 [${P4.join(",")}]`} />
            <div style={{ ...row, opacity: 0, animation: "stagger-fade 0.5s ease forwards 0ms" }}>
              <div style={col}><div style={tag(C.sbox)}>S0 Out</div><BitRow bits={r2.s0Output} color={C.sbox} size={54} showIndices={false} delay={0} /></div>
              <div style={{ color: "#64748b", fontSize: 26, alignSelf: "flex-end", paddingBottom: 6 }}>+</div>
              <div style={col}><div style={tag(C.sbox2)}>S1 Out</div><BitRow bits={r2.s1Output} color={C.sbox2} size={54} showIndices={false} delay={0} /></div>
            </div>
            <DownArrow color={C.p4} delay={800} />
            <PermTable table={P4} inputBits={combined} outputBits={r2.p4Result} label={`P4 Table [${P4.join(",")}]`} color={C.p4} delay={1200} />
            <DownArrow color={C.p4} delay={2000} />
            <BitRow bits={r2.p4Result} label="P4 Output (4 bits)" labelColor={C.p4} color={C.p4} size={60} delay={2600} />
          </div>
        );
      }

      /* ── 18: XOR L Round 2 ─────────────────────────────────────────────── */
      case 18: {
        if (!r2) return noData();
        const swL = sw.slice(0, 4) as Bit[];
        const newL2 = r2.fkOutput.slice(0, 4) as Bit[];
        return (
          <div style={col}>
            <SectionLabel text="Round 2 — XOR P4 with L" color={C.L} sub="P4 result XOR'd with the swap-output left half → new left half" />
            <XorView a={r2.p4Result} b={swL} result={newL2} labelA="P4 Result" labelB={`L₂ = [${swL.join("")}]`} labelResult="New L (f_K₂ output left)" colorA={C.p4} colorB={C.L} colorResult={C.L} delay={400} />
          </div>
        );
      }

      /* ── 19: IP⁻¹ ──────────────────────────────────────────────────────── */
      case 19:
        return (
          <div style={col}>
            <SectionLabel text="Inverse IP (IP⁻¹)" color={C.swap} sub={`IP⁻¹ table: [${IP_INV.join(",")}] — reverses the initial permutation`} />
            <BitRow bits={r2?.fkOutput ?? Array(8).fill(null)} label="f_K₂ Output (8 bits)" color={C.swap} size={50} delay={0} />
            <DownArrow color={C.swap} delay={400} />
            <PermTable table={IP_INV} inputBits={r2?.fkOutput as Bit[] ?? []} outputBits={ct.length ? ct : Array(8).fill(null)} label="IP⁻¹ Table (source index)" color={C.swap} delay={800} />
            <DownArrow color={C.swap} delay={1600} />
            <BitRow bits={ct.length ? ct : Array(8).fill(null)} label="Ciphertext (8 bits)" labelColor={C.out} color={C.out} size={54} delay={2000} />
          </div>
        );

      /* ── 20: Output ────────────────────────────────────────────────────── */
      case 20:
        return (
          <div style={col}>
            <SectionLabel
              text={mode === "encryption" ? "🔐 Ciphertext Output" : "🔓 Recovered Plaintext"}
              color={C.out}
              sub={mode === "encryption" ? "Encryption complete — 8-bit ciphertext" : "Decryption complete — original plaintext recovered"}
            />
            <BitRow bits={ct.length ? ct : Array(8).fill(null)} labelColor={C.out} color={C.out} size={64} delay={0} />
            <div style={{ ...note, fontSize: 15, marginTop: 16, opacity: 0, animation: "stagger-fade 0.5s ease forwards 800ms" }}>
              Decimal: {parseInt((ct.length ? ct : Array(8).fill(0)).join(""), 2)} | Hex: 0x{parseInt((ct.length ? ct : Array(8).fill(0)).join(""), 2).toString(16).toUpperCase().padStart(2, "0")}
            </div>
          </div>
        );

      default: return null;
    }
  }

  // ── Layout styles ──────────────────────────────────────────────────────────
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
  const col: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 18 };
  const row: React.CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" };
  const note: React.CSSProperties = { fontSize: 18, color: "#cbd5e1", fontFamily: "monospace", textAlign: "center", maxWidth: 640, lineHeight: 1.6, fontWeight: "bold" };
  const tag = (c: string): React.CSSProperties => ({
    fontSize: 14, fontFamily: "monospace", color: "#ffffff", fontWeight: "bold",
    background: `${c}33`, border: `1.5px solid ${c}88`, borderRadius: 6, padding: "4px 12px",
  });

  // Step progress %
  const pct = (sub / (TOTAL - 1)) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "#0a0f1c", borderRadius: 12, overflow: "hidden", fontFamily: "monospace" }}>

      {/* ── Step breadcrumb strip ──────────────────────────────────────────── */}
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

      {/* ── Current step title ────────────────────────────────────────────── */}
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

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 24px 0", height: 4, background: "#1e293b", borderRadius: 2 }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: "linear-gradient(90deg,#818cf8,#60a5fa,#34d399,#f59e0b,#fbbf24)", transition: "width 0.3s ease" }} />
      </div>

      {/* ── Main visualization area ─────────────────────────────────────── */}
      <div style={{ padding: "16px 32px 32px", display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ animation: "fadeSlide 0.3s ease", maxWidth: 760, width: "100%", zoom: 0.75 }}>
          {panel()}
        </div>
      </div>

      {/* ── Navigation controls ───────────────────────────────────────────── */}
      <div style={{
        padding: "14px 24px", borderTop: "1px solid #1e293b",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        background: "#0f172a",
      }}>
        <button onClick={reset} style={btnStyle("#334155", "#94a3b8")} title="Reset">
          <RotateCcw size={15} />
        </button>
        <button onClick={prev} disabled={sub === 0} style={btnStyle("#1e293b", "#60a5fa")} title="Previous">
          <ChevronLeft size={18} /> Prev
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          disabled={sub === TOTAL - 1}
          style={btnStyle(playing ? "#7f1d1d" : "#1e3a5f", playing ? "#f87171" : "#60a5fa")}
        >
          {playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Auto-play</>}
        </button>
        <button onClick={next} disabled={sub === TOTAL - 1} style={btnStyle("#1e3a5f", "#60a5fa")} title="Next">
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

        {/* Jump to step */}
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

      <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── Button style helper ────────────────────────────────────────────────────────
function btnStyle(bg: string, clr: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
    background: bg, color: clr, fontFamily: "monospace", fontSize: 12,
    fontWeight: "bold", transition: "opacity 0.2s",
  };
}
