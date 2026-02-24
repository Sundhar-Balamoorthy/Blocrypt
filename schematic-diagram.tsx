"use client";

import type { FeistelState } from "@/lib/feistel";

interface SchematicDiagramProps {
  state: FeistelState;
}

export function SchematicDiagram({ state }: SchematicDiagramProps) {
  const lastRound =
    state.history.length > 0
      ? state.history[state.history.length - 1]
      : null;

  const lIn = lastRound ? lastRound.prevL : state.L;
  const rIn = lastRound ? lastRound.prevR : state.R;
  const lOut = lastRound ? lastRound.newL : state.L;
  const rOut = lastRound ? lastRound.newR : state.R;

  const W = 500;
  const H = lastRound ? 500 : 180;

  // Key x positions
  const lCenter = 125; // L column center
  const rCenter = 375; // R column center
  const boxW = 160;
  const boxH = 50;
  const halfBox = boxW / 2;

  // Key y positions
  const inputY = 50;
  const fY = 190;
  const xorY = 280;
  const outputY = 420;
  const fR = 32;
  const xorR = 22;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[560px] mx-auto"
        role="img"
        aria-label={`Feistel cipher round ${state.round} schematic diagram`}
      >
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id="arrow-gray"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="fill-muted-foreground" />
          </marker>
          <marker
            id="arrow-orange"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
          </marker>
          <marker
            id="arrow-green"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
          </marker>
          <marker
            id="arrow-red"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {/* ========== Title ========== */}
        <text
          x={W / 2}
          y="22"
          textAnchor="middle"
          className="fill-foreground font-mono"
          fontSize="14"
          fontWeight="bold"
        >
          {lastRound
            ? `Feistel Round ${lastRound.round}`
            : "Feistel Cipher - Initial State"}
        </text>

        {/* ========== INPUT L BOX (top left) ========== */}
        <rect
          x={lCenter - halfBox}
          y={inputY}
          width={boxW}
          height={boxH}
          rx="6"
          className="stroke-[var(--bit-l)]"
          fill="rgba(59,130,246,0.12)"
          strokeWidth="2"
        />
        <text
          x={lCenter}
          y={inputY + 18}
          textAnchor="middle"
          className="fill-[var(--bit-l)] font-mono"
          fontSize="11"
          fontWeight="bold"
        >
          {lastRound ? `Round ${lastRound.round} Input L` : "L (input)"}
        </text>
        <text
          x={lCenter}
          y={inputY + 37}
          textAnchor="middle"
          className="fill-foreground font-mono"
          fontSize="12"
          fontWeight="bold"
        >
          [{lIn.join(", ")}]
        </text>

        {/* ========== INPUT R BOX (top right) ========== */}
        <rect
          x={rCenter - halfBox}
          y={inputY}
          width={boxW}
          height={boxH}
          rx="6"
          className="stroke-[var(--bit-r)]"
          fill="rgba(34,197,94,0.12)"
          strokeWidth="2"
        />
        <text
          x={rCenter}
          y={inputY + 18}
          textAnchor="middle"
          className="fill-[var(--bit-r)] font-mono"
          fontSize="11"
          fontWeight="bold"
        >
          {lastRound ? `Round ${lastRound.round} Input R` : "R (input)"}
        </text>
        <text
          x={rCenter}
          y={inputY + 37}
          textAnchor="middle"
          className="fill-foreground font-mono"
          fontSize="12"
          fontWeight="bold"
        >
          [{rIn.join(", ")}]
        </text>

        {lastRound && (
          <>
            {/* ========== R input -> F (vertical arrow down) ========== */}
            <line
              x1={rCenter}
              y1={inputY + boxH}
              x2={rCenter}
              y2={fY - fR}
              stroke="#6b7280"
              strokeWidth="1.8"
              markerEnd="url(#arrow-gray)"
            />

            {/* ========== F function circle (orange) ========== */}
            <circle
              cx={rCenter}
              cy={fY}
              r={fR}
              fill="rgba(245,158,11,0.2)"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <text
              x={rCenter}
              y={fY + 6}
              textAnchor="middle"
              fill="#f59e0b"
              className="font-mono"
              fontSize="20"
              fontWeight="bold"
            >
              F
            </text>

            {/* ========== Key label (to the right of F) ========== */}
            <text
              x={rCenter + fR + 12}
              y={fY - 6}
              className="fill-[var(--bit-key)] font-mono"
              fontSize="11"
              fontWeight="bold"
            >
              Key K{lastRound.round}:
            </text>
            <text
              x={rCenter + fR + 12}
              y={fY + 10}
              className="fill-[var(--bit-key)] font-mono"
              fontSize="10"
            >
              [{lastRound.roundKeyBits.join("")}]
            </text>

            {/* ========== f_out label (center, between F and XOR) ========== */}
            <text
              x={W / 2}
              y={fY + fR + 26}
              textAnchor="middle"
              fill="#f97316"
              className="font-mono"
              fontSize="11"
              fontWeight="bold"
            >
              f_out: [{lastRound.fOutput.join("")}]
            </text>

            {/* ========== F output -> XOR (diagonal dashed arrow) ========== */}
            <line
              x1={rCenter - fR + 4}
              y1={fY + fR * 0.6}
              x2={lCenter + xorR + 3}
              y2={xorY - 4}
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="6,4"
              markerEnd="url(#arrow-orange)"
            />

            {/* ========== L input -> XOR (vertical arrow down) ========== */}
            <line
              x1={lCenter}
              y1={inputY + boxH}
              x2={lCenter}
              y2={xorY - xorR}
              stroke="#6b7280"
              strokeWidth="1.8"
              markerEnd="url(#arrow-gray)"
            />

            {/* ========== XOR circle ========== */}
            <circle
              cx={lCenter}
              cy={xorY}
              r={xorR}
              fill="rgba(156,163,175,0.15)"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            <text
              x={lCenter}
              y={xorY + 7}
              textAnchor="middle"
              className="fill-foreground font-mono"
              fontSize="22"
              fontWeight="bold"
            >
              {"⊕"}
            </text>
            <text
              x={lCenter}
              y={xorY + xorR + 16}
              textAnchor="middle"
              className="fill-muted-foreground font-mono"
              fontSize="10"
            >
              XOR
            </text>

            {/* ========== SWAP ARROWS ========== */}

            {/* Green curved arrow: R input -> Output L (direct transfer / swap) */}
            <path
              d={`M ${rCenter} ${inputY + boxH + 2} C ${rCenter + 80} ${(inputY + boxH + outputY) / 2}, ${lCenter - 80} ${(inputY + boxH + outputY) / 2}, ${lCenter} ${outputY - 2}`}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              markerEnd="url(#arrow-green)"
            />

            {/* Red curved arrow: XOR result -> Output R */}
            <path
              d={`M ${lCenter} ${xorY + xorR + 2} C ${lCenter - 70} ${(xorY + outputY) / 2 + 20}, ${rCenter + 70} ${(xorY + outputY) / 2 + 20}, ${rCenter} ${outputY - 2}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              markerEnd="url(#arrow-red)"
            />

            {/* ========== OUTPUT L BOX (bottom left) ========== */}
            <rect
              x={lCenter - halfBox}
              y={outputY}
              width={boxW}
              height={boxH}
              rx="6"
              fill="rgba(34,197,94,0.12)"
              stroke="#22c55e"
              strokeWidth="2"
            />
            <text
              x={lCenter}
              y={outputY + 18}
              textAnchor="middle"
              fill="#22c55e"
              className="font-mono"
              fontSize="11"
              fontWeight="bold"
            >
              Output L
            </text>
            <text
              x={lCenter}
              y={outputY + 37}
              textAnchor="middle"
              className="fill-foreground font-mono"
              fontSize="12"
              fontWeight="bold"
            >
              [{lOut.join(", ")}]
            </text>

            {/* ========== OUTPUT R BOX (bottom right) ========== */}
            <rect
              x={rCenter - halfBox}
              y={outputY}
              width={boxW}
              height={boxH}
              rx="6"
              fill="rgba(239,68,68,0.1)"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <text
              x={rCenter}
              y={outputY + 18}
              textAnchor="middle"
              fill="#ef4444"
              className="font-mono"
              fontSize="11"
              fontWeight="bold"
            >
              Output R (XOR result)
            </text>
            <text
              x={rCenter}
              y={outputY + 37}
              textAnchor="middle"
              className="fill-foreground font-mono"
              fontSize="12"
              fontWeight="bold"
            >
              [{rOut.join(", ")}]
            </text>

            {/* ========== Legend ========== */}
            <g transform={`translate(${W / 2 - 130}, ${outputY + boxH + 14})`}>
              <line x1="0" y1="4" x2="20" y2="4" stroke="#22c55e" strokeWidth="2.5" />
              <text x="26" y="8" className="fill-muted-foreground font-mono" fontSize="10">
                Direct swap (R{"→"}L)
              </text>
              <line x1="130" y1="4" x2="150" y2="4" stroke="#ef4444" strokeWidth="2.5" />
              <text x="156" y="8" className="fill-muted-foreground font-mono" fontSize="10">
                XOR result ({"→"}R)
              </text>
            </g>
          </>
        )}

        {/* When no rounds yet, show the initial state only */}
        {!lastRound && (
          <>
            <text
              x={W / 2}
              y={inputY + boxH + 28}
              textAnchor="middle"
              className="fill-muted-foreground font-mono"
              fontSize="11"
            >
              Click "Next Round" to begin the Feistel rounds
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
