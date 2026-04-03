"use client";

import type { PRESENTState } from "@/lib/present";

interface PresentSchematicProps {
  state: PRESENTState;
}

export function PresentSchematic({ state }: PresentSchematicProps) {
  const W = 540;
  const cx = W / 2;
  const boxW = 180;
  const boxH = 44;

  // Vertical positions per block within one round cell
  const ROUND_H = 210;
  const HEADER_H = 60;

  const completedRounds = state.history.length;

  const fmt = (bits: (0|1)[]) =>
    bits.length === 0 ? "…" : bits.slice(0, 8).join("") + "…";

  function Block({
    y, label, sublabel, color, fill, active
  }: {
    y: number; label: string; sublabel?: string; color: string; fill: string; active: boolean;
  }) {
    return (
      <>
        <rect x={cx - boxW / 2} y={y} width={boxW} height={boxH} rx={6}
          fill={active ? fill : "rgba(40,40,40,0.4)"}
          stroke={active ? color : "#333"} strokeWidth={active ? 2 : 1}
        />
        <text x={cx} y={y + (sublabel ? 16 : 27)} textAnchor="middle"
          fill={active ? color : "#444"} fontFamily="monospace" fontSize={11} fontWeight="bold">
          {label}
        </text>
        {sublabel && (
          <text x={cx} y={y + 33} textAnchor="middle"
            fill={active ? "#bbb" : "#444"} fontFamily="monospace" fontSize={9}>
            {sublabel}
          </text>
        )}
      </>
    );
  }

  const totalH = HEADER_H + Math.max(1, state.totalRounds) * ROUND_H + 100;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full max-w-[540px] mx-auto" role="img"
        aria-label="PRESENT cipher schematic">
        <defs>
          <marker id="present-arrow-on" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
          </marker>
          <marker id="present-arrow-off" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#333" />
          </marker>
        </defs>

        {/* Input */}
        <Block y={10} label={state.mode === "encryption" ? "Plaintext (64-bit)" : "Ciphertext (64-bit)"}
          sublabel={fmt(state.plaintext)}
          color="#60a5fa" fill="rgba(59,130,246,0.15)" active={true} />

        {/* Per-round cells */}
        {Array.from({ length: state.totalRounds }, (_, idx) => {
          const roundNum = idx + 1;
          const active = completedRounds >= roundNum;
          const rdata = state.history[idx];
          const yBase = HEADER_H + idx * ROUND_H;
          const y_input = yBase;
          const y_addKey = yBase + 50;
          const y_sbox = yBase + 110;
          const y_player = yBase + 170;
          const isLast = roundNum === state.totalRounds;

          return (
            <g key={roundNum}>
              {/* Arrow from above */}
              <line x1={cx} y1={y_input - 0} x2={cx} y2={y_addKey}
                stroke={active ? "#60a5fa" : "#333"} strokeWidth={active ? 1.5 : 1}
                markerEnd={`url(#present-arrow-${active ? "on" : "off"})`} />

              {/* Round Label */}
              <text x={24} y={y_addKey + 24} textAnchor="start"
                fill={active ? "#94a3b8" : "#333"} fontFamily="monospace" fontSize={10} fontWeight="bold">
                R{roundNum}
              </text>

              {/* addRoundKey */}
              <Block y={y_addKey} label="addRoundKey (⊕)"
                sublabel={active && rdata ? fmt(rdata.afterAddKey.length > 0 ? rdata.afterAddKey : rdata.inputState) : ""}
                color="#a78bfa" fill="rgba(167,139,250,0.15)" active={active} />

              {/* Key feed-in */}
              {active && rdata && (
                <>
                  <line x1={cx + boxW / 2 + 2} y1={y_addKey + 22}
                    x2={cx + boxW / 2 + 50} y2={y_addKey + 22}
                    stroke="#4ade80" strokeWidth={1.5} strokeDasharray="4,3" />
                  <text x={cx + boxW / 2 + 54} y={y_addKey + 18}
                    fill="#4ade80" fontFamily="monospace" fontSize={9} fontWeight="bold">K{roundNum}:</text>
                  <text x={cx + boxW / 2 + 54} y={y_addKey + 30}
                    fill="#4ade80" fontFamily="monospace" fontSize={8}>{fmt(rdata.roundKey)}</text>
                </>
              )}

              {/* Arrow → S-box */}
              <line x1={cx} y1={y_addKey + boxH} x2={cx} y2={y_sbox}
                stroke={active ? "#a78bfa" : "#333"} strokeWidth={active ? 1.5 : 1}
                markerEnd={`url(#present-arrow-${active ? "on" : "off"})`} />

              {/* sBoxLayer */}
              <Block y={y_sbox} label="sBoxLayer (16× 4-bit S-box)"
                sublabel={active && rdata ? fmt(rdata.afterSBox) : ""}
                color="#f59e0b" fill="rgba(245,158,11,0.15)" active={active} />

              {/* Arrow → P-layer or output */}
              {!isLast && (
                <>
                  <line x1={cx} y1={y_sbox + boxH} x2={cx} y2={y_player}
                    stroke={active ? "#f59e0b" : "#333"} strokeWidth={active ? 1.5 : 1}
                    markerEnd={`url(#present-arrow-${active ? "on" : "off"})`} />
                  <Block y={y_player} label="pLayer (64-bit permutation)"
                    sublabel={active && rdata && rdata.afterPLayer.length > 0 ? fmt(rdata.afterPLayer) : ""}
                    color="#34d399" fill="rgba(52,211,153,0.15)" active={active} />
                </>
              )}
            </g>
          );
        })}

        {/* Final addRoundKey + Output */}
        {(() => {
          const yFinal = HEADER_H + state.totalRounds * ROUND_H + 10;
          const done = state.completed;
          return (
            <>
              <line x1={cx} y1={HEADER_H + (state.totalRounds - 1) * ROUND_H + (state.totalRounds > 0 ? 110 + boxH : 0)}
                x2={cx} y2={yFinal}
                stroke={done ? "#60a5fa" : "#333"} strokeWidth={done ? 1.5 : 1}
                markerEnd={`url(#present-arrow-${done ? "on" : "off"})`} />
              <Block y={yFinal} label="addRoundKey — Final"
                sublabel={done ? fmt(state.ciphertext) : ""}
                color="#f59e0b" fill="rgba(245,158,11,0.15)" active={done} />
              {done && (
                <text x={cx} y={yFinal + boxH + 22} textAnchor="middle"
                  fill="#fbbf24" fontFamily="monospace" fontSize={11} fontWeight="bold">
                  ▼ {state.mode === "encryption" ? "Ciphertext" : "Recovered Plaintext"}: {fmt(state.ciphertext)}
                </text>
              )}
            </>
          );
        })()}
      </svg>
    </div>
  );
}
