"use client";

// ── Shared visual components for S-DES schematic ─────────────────────────────

export type Bit = 0 | 1;

export const C = {
  plain:  "#818cf8",
  L:      "#60a5fa",
  R:      "#34d399",
  key:    "#4ade80",
  xor:    "#f59e0b",
  sbox:   "#fb7185",
  sbox2:  "#fda4af",
  p4:     "#22d3ee",
  swap:   "#c084fc",
  out:    "#fbbf24",
  dim:    "#475569",
  bg:     "#0f172a",
  card:   "rgba(30,41,59,0.6)",
};

// ── BitSquare ─────────────────────────────────────────────────────────────────
export function BitSquare({
  val, highlight, color, dim = false, size = 50, showIndex, index,
}: {
  val: Bit | null; highlight?: boolean; color?: string;
  dim?: boolean; size?: number; showIndex?: boolean; index?: number;
}) {
  const activeClr = color ?? (val === 1 ? "#3b82f6" : "#1e293b");
  const bg = highlight ? "#f59e0b" : (val === 1 ? activeClr : "#1e293b");
  const border = highlight ? "#f59e0b" : (val === 1 ? activeClr : "#334155");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {showIndex && index !== undefined && (
        <div style={{ fontSize: 20, color: "#ffffff", fontFamily: "monospace", fontWeight: "bold", opacity: 0.9 }}>{index}</div>
      )}
      <div style={{
        width: size === 42 ? 48 : size, height: size === 42 ? 48 : size, background: dim ? "#0f1a2a" : bg,
        border: `2px solid ${dim ? "#1e293b" : border}`, borderRadius: size > 30 ? 8 : 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size === 42 ? 26 : 20, fontWeight: "bold", fontFamily: "monospace",
        color: dim ? "#1e293b" : (highlight ? "#0f172a" : (val === 1 ? "#fff" : "#cbd5e1")),
        opacity: dim ? 0.35 : 1, transition: "all 0.3s ease",
        boxShadow: highlight ? "0 0 16px #f59e0b88" : (val === 1 && !dim ? `0 0 8px ${border}66` : "none"),
      }}>
        {val !== null ? val : "?"}
      </div>
    </div>
  );
}

// ── BitRow ────────────────────────────────────────────────────────────────────
export function BitRow({
  bits, label, labelColor, color, highlights, showIndices = true, size = 50, gap = 6, delay = 0,
}: {
  bits: (Bit | null)[]; label?: string; labelColor?: string; color?: string;
  highlights?: Set<number>; showIndices?: boolean; size?: number; gap?: number; delay?: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`
    }}>
      {label && (
        <div style={{
          fontSize: 14, fontFamily: "monospace", color: labelColor ?? "#ffffff",
          textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold",
        }}>
          {label}
        </div>
      )}
      <div style={{ display: "flex", gap }}>
        {bits.map((b, i) => (
          <BitSquare
            key={i} val={b} index={i} showIndex={showIndices}
            highlight={highlights?.has(i)} color={b === 1 ? color : undefined} size={size}
          />
        ))}
      </div>
    </div>
  );
}

// ── XorView ───────────────────────────────────────────────────────────────────
export function XorView({
  a, b, result, labelA, labelB, labelResult, colorA, colorB, colorResult, delay = 0,
}: {
  a: Bit[]; b: Bit[]; result: Bit[];
  labelA?: string; labelB?: string; labelResult?: string;
  colorA?: string; colorB?: string; colorResult?: string; delay?: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`
    }}>
      <BitRow bits={a} label={labelA} labelColor={colorA} color={colorA} size={46} delay={0} />
      <div style={{ fontSize: 32, color: C.xor, fontWeight: "bold", fontFamily: "monospace", lineHeight: 1 }}>⊕</div>
      <BitRow bits={b} label={labelB} labelColor={colorB} color={colorB} size={46} delay={0} />
      <div style={{ width: "100%", height: 2, background: `${C.xor}44`, borderRadius: 1 }} />
      <BitRow bits={result} label={labelResult} labelColor={colorResult} color={colorResult} size={46} delay={0} />
    </div>
  );
}

// ── PermTable ─────────────────────────────────────────────────────────────────
export function PermTable({
  table, inputBits, outputBits, label, color, delay = 0,
}: {
  table: number[]; inputBits?: (Bit | null)[]; outputBits?: (Bit | null)[];
  label?: string; color?: string; delay?: number;
}) {
  const clr = color ?? C.plain;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`
    }}>
      {label && (
        <div style={{ fontSize: 13, fontFamily: "monospace", color: "#ffffff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          {label}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {table.map((src, dst) => (
          <div key={dst} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {/* Source Index Reference */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 14, color: clr, opacity: 0.8, fontFamily: "monospace", textTransform: "uppercase", fontWeight: "bold" }}>Source</div>
              <div style={{
                width: 52, height: 42, background: `${clr}08`,
                border: `2px solid ${clr}44`, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontFamily: "monospace", color: clr, fontWeight: "bold",
              }}>
                {src}
              </div>
            </div>
            
            <div style={{ color: `${clr}88`, fontSize: 24, fontWeight: "bold" }}>↓</div>

            {/* Destination / Output Bit */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {outputBits && (
                <BitSquare val={outputBits[dst] ?? null} color={outputBits[dst] === 1 ? clr : undefined} size={42} showIndex={false} />
              )}
              <div style={{ fontSize: 14, color: "#ffffff", opacity: 1, fontFamily: "monospace", fontWeight: "bold" }}>Pos {dst}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, color: "#ffffff", fontFamily: "monospace", padding: "8px 24px", background: "#ffffff08", borderRadius: 8, fontStyle: "italic", marginTop: 12, fontWeight: "bold" }}>
        Mapping: The bit at input index <span style={{ color: clr, fontWeight: "bold" }}>[X]</span> moves to output position <span style={{ color: clr, fontWeight: "bold" }}>[Y]</span>
      </div>
    </div>
  );
}

// ── SBoxTable ─────────────────────────────────────────────────────────────────
export function SBoxTable({
  sbox, rowIdx, colIdx, label, color, delay = 0,
}: {
  sbox: number[][]; rowIdx: number; colIdx: number; label?: string; color?: string; delay?: number;
}) {
  const clr = color ?? C.sbox;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`
    }}>
      {label && (
        <div style={{ fontSize: 14, fontFamily: "monospace", color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </div>
      )}
      {/* Col header */}
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ width: 40 }} />
        {[0, 1, 2, 3].map(c => (
          <div key={c} style={{
            width: 60, height: 30, background: c === colIdx ? `${clr}25` : "transparent",
            border: c === colIdx ? `1px solid ${clr}` : "1px solid transparent",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: c === colIdx ? clr : C.dim, fontFamily: "monospace", fontWeight: "bold",
          }}>
            col {c}
          </div>
        ))}
      </div>
      {sbox.map((row, r) => (
        <div key={r} style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {/* Row header */}
          <div style={{
            width: 40, height: 60, background: r === rowIdx ? `${clr}25` : "transparent",
            border: r === rowIdx ? `1px solid ${clr}` : "1px solid transparent",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: r === rowIdx ? clr : C.dim, fontFamily: "monospace", fontWeight: "bold",
          }}>
            r{r}
          </div>
          {row.map((val, c) => {
            const selected = r === rowIdx && c === colIdx;
            const stripe = r === rowIdx || c === colIdx;
            return (
              <div key={c} style={{
                width: 60, height: 60,
                background: selected ? clr : (stripe ? `${clr}18` : "rgba(15,23,42,0.8)"),
                border: `2px solid ${selected ? clr : (stripe ? `${clr}55` : "#1e293b")}`,
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: selected ? 24 : 18, fontWeight: "bold", fontFamily: "monospace",
                color: selected ? "#0f172a" : (stripe ? clr : C.dim),
                transition: "all 0.4s ease",
                boxShadow: selected ? `0 0 20px ${clr}aa` : "none",
              }}>
                {val}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ text, color, sub }: { text: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginBottom: 4 }}>
      <div style={{
        fontSize: 20, fontWeight: "bold", fontFamily: "monospace",
        color: color ?? "#f1f5f9", textShadow: color ? `0 0 24px ${color}66` : "none",
      }}>
        {text}
      </div>
      {sub && <div style={{ fontSize: 14, color: "#ffffff", fontFamily: "monospace", textAlign: "center", maxWidth: 520 }}>{sub}</div>}
    </div>
  );
}

export function DownArrow({ color, delay = 0 }: { color?: string; delay?: number }) {
  return (
    <div style={{
      fontSize: 32, color: color ?? "#ffffff", lineHeight: 1, margin: "4px 0",
      opacity: 0, animation: "stagger-fade 0.5s ease forwards", animationDelay: `${delay}ms`
    }}>↓</div>
  );
}

export function sboxRow(bits: Bit[]): number { return (bits[0] << 1) | bits[3]; }
export function sboxCol(bits: Bit[]): number { return (bits[1] << 1) | bits[2]; }
