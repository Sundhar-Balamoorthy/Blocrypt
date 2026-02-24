"use client";

import type { RoundState, Bit } from "@/lib/feistel";

interface RoundSchematicProps {
  round: RoundState;
  phase?: "encryption" | "decryption";
}

/**
 * A single Feistel-round schematic matching the original notebook layout:
 *
 *   [Input L]           [Input R]
 *      |                    |
 *      |  (gray)            | (gray)
 *      v                    v
 *     XOR <---(orange)---- [F] -- K label
 *      |                    |
 *      |  (red curve)       | (green curve)
 *      v                    v
 *   [Output R(XOR)]      [Output L]
 *
 * Green curve: R input swaps straight down to Output L
 * Red curve: XOR result crosses to Output R
 */
export function RoundSchematic({ round, phase = "encryption" }: RoundSchematicProps) {
  const W = 520;
  const H = 420;

  const lCenter = 130;
  const rCenter = 390;
  const boxW = 170;
  const boxH = 52;
  const halfBox = boxW / 2;

  const inputY = 30;
  const fY = 155;
  const xorY = 240;
  const outputY = 350;
  const fR = 30;
  const xorR = 20;

  const uid = `rnd-${round.round}-${phase}`;

  const formatBits = (bits: Bit[]) => `[${bits.join(",")}]`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[520px]"
      role="img"
      aria-label={`${phase} round ${round.round} schematic`}
    >
      <defs>
        <marker id={`${uid}-arr-gray`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
        </marker>
        <marker id={`${uid}-arr-orange`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
        </marker>
        <marker id={`${uid}-arr-green`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
        </marker>
        <marker id={`${uid}-arr-red`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
      </defs>

      {/* ── Input L (top-left, blue border) ── */}
      <rect
        x={lCenter - halfBox}
        y={inputY}
        width={boxW}
        height={boxH}
        rx="5"
        fill="rgba(59,130,246,0.1)"
        stroke="#3b82f6"
        strokeWidth="2"
      />
      <text x={lCenter} y={inputY + 20} textAnchor="middle" fill="#60a5fa" className="font-mono" fontSize="11" fontWeight="bold">
        {`Rnd ${round.round} Input L`}
      </text>
      <text x={lCenter} y={inputY + 40} textAnchor="middle" fill="#e2e8f0" className="font-mono" fontSize="13" fontWeight="bold">
        {formatBits(round.prevL)}
      </text>

      {/* ── Input R (top-right, green border) ── */}
      <rect
        x={rCenter - halfBox}
        y={inputY}
        width={boxW}
        height={boxH}
        rx="5"
        fill="rgba(34,197,94,0.1)"
        stroke="#22c55e"
        strokeWidth="2"
      />
      <text x={rCenter} y={inputY + 20} textAnchor="middle" fill="#4ade80" className="font-mono" fontSize="11" fontWeight="bold">
        {`Rnd ${round.round} Input R`}
      </text>
      <text x={rCenter} y={inputY + 40} textAnchor="middle" fill="#e2e8f0" className="font-mono" fontSize="13" fontWeight="bold">
        {formatBits(round.prevR)}
      </text>

      {/* ── Gray arrow: R input -> F ── */}
      <line
        x1={rCenter}
        y1={inputY + boxH}
        x2={rCenter}
        y2={fY - fR}
        stroke="#6b7280"
        strokeWidth="2"
        markerEnd={`url(#${uid}-arr-gray)`}
      />

      {/* ── F circle (orange) ── */}
      <circle cx={rCenter} cy={fY} r={fR} fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeWidth="2.5" />
      <text x={rCenter} y={fY + 7} textAnchor="middle" fill="#f59e0b" className="font-mono" fontSize="22" fontWeight="bold">
        F
      </text>

      {/* ── Key label (green, right of F) ── */}
      <text
        x={rCenter + fR + 14}
        y={fY + 5}
        fill="#4ade80"
        className="font-mono"
        fontSize="11"
        fontWeight="bold"
      >
        {`K${round.round}: [${round.roundKeyBits.join("")}]`}
      </text>

      {/* ── Orange dashed arrow: F -> XOR (diagonal) ── */}
      <line
        x1={rCenter - fR + 2}
        y1={fY + fR * 0.7}
        x2={lCenter + xorR + 6}
        y2={xorY - 6}
        stroke="#f59e0b"
        strokeWidth="2"
        strokeDasharray="7,4"
        markerEnd={`url(#${uid}-arr-orange)`}
      />

      {/* ── f_out label (along the dashed line) ── */}
      <text
        x={(rCenter - fR + lCenter + xorR) / 2 + 20}
        y={(fY + fR * 0.7 + xorY) / 2 - 6}
        textAnchor="middle"
        fill="#fb923c"
        className="font-mono"
        fontSize="11"
        fontWeight="bold"
      >
        {`f_out: ${formatBits(round.fOutput)}`}
      </text>

      {/* ── Gray arrow: L input -> XOR (straight down) ── */}
      <line
        x1={lCenter}
        y1={inputY + boxH}
        x2={lCenter}
        y2={xorY - xorR}
        stroke="#6b7280"
        strokeWidth="2"
        markerEnd={`url(#${uid}-arr-gray)`}
      />

      {/* ── XOR circle ── */}
      <circle cx={lCenter} cy={xorY} r={xorR} fill="rgba(156,163,175,0.12)" stroke="#9ca3af" strokeWidth="2" />
      <text x={lCenter} y={xorY + 6} textAnchor="middle" fill="#e2e8f0" className="font-mono" fontSize="18" fontWeight="bold">
        {"⊕"}
      </text>

      {/* ── Green curved arrow: R input -> Output L (swap) ── */}
      <path
        d={`M ${rCenter} ${inputY + boxH + 2}
            C ${rCenter + 70} ${(inputY + boxH + outputY) / 2},
              ${lCenter - 70} ${(inputY + boxH + outputY) / 2},
              ${lCenter} ${outputY - 4}`}
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
        markerEnd={`url(#${uid}-arr-green)`}
      />

      {/* ── Red curved arrow: XOR -> Output R ── */}
      <path
        d={`M ${lCenter + xorR} ${xorY + 8}
            C ${lCenter + 60} ${(xorY + outputY) / 2 + 30},
              ${rCenter - 60} ${(xorY + outputY) / 2 + 30},
              ${rCenter} ${outputY - 4}`}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
        markerEnd={`url(#${uid}-arr-red)`}
      />

      {/* ── Output L (bottom-left, green border) ── */}
      <rect
        x={lCenter - halfBox}
        y={outputY}
        width={boxW}
        height={boxH}
        rx="5"
        fill="rgba(34,197,94,0.1)"
        stroke="#22c55e"
        strokeWidth="2"
      />
      <text x={lCenter} y={outputY + 20} textAnchor="middle" fill="#4ade80" className="font-mono" fontSize="11" fontWeight="bold">
        Output L
      </text>
      <text x={lCenter} y={outputY + 40} textAnchor="middle" fill="#e2e8f0" className="font-mono" fontSize="13" fontWeight="bold">
        {formatBits(round.newL)}
      </text>

      {/* ── Output R (bottom-right, red border) ── */}
      <rect
        x={rCenter - halfBox}
        y={outputY}
        width={boxW}
        height={boxH}
        rx="5"
        fill="rgba(239,68,68,0.08)"
        stroke="#ef4444"
        strokeWidth="2"
      />
      <text x={rCenter} y={outputY + 20} textAnchor="middle" fill="#f87171" className="font-mono" fontSize="11" fontWeight="bold">
        Output R (XOR)
      </text>
      <text x={rCenter} y={outputY + 40} textAnchor="middle" fill="#e2e8f0" className="font-mono" fontSize="13" fontWeight="bold">
        {formatBits(round.newR)}
      </text>
    </svg>
  );
}
