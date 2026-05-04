import { 
  type Bit, 
  createInitialState, 
  stepRound, 
  runAllRounds,
  intToBits
} from "./feistel";
import {
  sdesEncrypt,
  generateKeys,
  type SDESState
} from "./sdes";
import {
  presentEncrypt,
  bigintToBits,
  bitsToBigint,
  type PRESENTState,
  SBOX as PRESENT_SBOX,
  P_LAYER as PRESENT_PLAYER
} from "./present";

// --- Reference Tables for Explanations ---
const SDES_IP = [1, 5, 2, 0, 3, 7, 4, 6];
const SDES_IP_INV = [3, 0, 2, 4, 6, 1, 7, 5];
const SDES_EP = [3, 0, 1, 2, 1, 2, 3, 0];
const SDES_P4 = [1, 3, 2, 0];
const SDES_S0 = [
  [1, 0, 3, 2], [3, 2, 1, 0], [0, 2, 1, 3], [3, 1, 3, 2]
];
const SDES_S1 = [
  [0, 1, 2, 3], [2, 0, 1, 3], [3, 0, 1, 0], [2, 1, 0, 3]
];

function formatMatrix(m: number[][]) {
  return m.map(row => row.join("  ")).join("\n");
}

function formatArray(a: number[]) {
  return `[ ${a.join(", ")} ]`;
}

export type ChallengeType = "encrypt" | "decrypt" | "round";
export type PracticeBit = Bit | -1;

export interface ExplanationStep {
  label: string;
  details: string;
  bits: Bit[];
  table?: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  cipher: "feistel" | "sdes" | "present";
  difficulty: "easy" | "medium" | "hard";
  description: string;
  given: {
    plaintext?: Bit[];
    ciphertext?: Bit[];
    key?: number | number[] | Bit[];
    rounds?: number;
    inputL?: Bit[];
    inputR?: Bit[];
  };
  answer: Bit[];
  hiddenIndices: number[]; // which indices of the answer are hidden
  hint?: string;
  explanationSteps?: ExplanationStep[];
}

function randomBits(n: number): Bit[] {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0) as Bit);
}

export function generateFeistelChallenge(difficulty: "easy" | "medium" | "hard"): Challenge {
  const type: ChallengeType = difficulty === "easy" ? (Math.random() > 0.5 ? "round" : "encrypt") : "encrypt";
  
  if (type === "round") {
    const L = randomBits(4);
    const R = randomBits(4);
    const K = Math.floor(Math.random() * 16);
    const state = createInitialState([...L, ...R], 1, [K], "encryption");
    const next = stepRound(state);
    const roundData = next.history[0];
    const answer = [...next.L, ...next.R] as Bit[];
    const hiddenIndices = [0, 4, 7]; 
    
    const explanationSteps: ExplanationStep[] = [
      { 
        label: "Step 1: Preparation", 
        details: `Split the 8-bit input block into two 4-bit halves: Left (L0) = [${L.join("")}] and Right (R0) = [${R.join("")}].`, 
        bits: [...L, ...R] 
      },
      { 
        label: "Step 2: F-Function Calculation", 
        details: `Apply the round function F to the Right half (R0) using the Round Key (K1=${K}). In this mini-Feistel, F(R, K) = R XOR K. \nBinary K1: [${roundData.roundKeyBits.join("")}]`, 
        bits: roundData.fOutput 
      },
      { 
        label: "Step 3: XOR with Left Half", 
        details: `Take the output of the F-function and XOR it with the original Left half (L0). This produces the new Right half (R1) for the next step.\n[${L.join("")}] XOR [${roundData.fOutput.join("")}] = [${roundData.xorResult.join("")}]`, 
        bits: roundData.xorResult 
      },
      { 
        label: "Step 4: Swap and Combine", 
        details: "In a Feistel cipher, the new Left half (L1) is simply the old Right half (R0), and the new Right half (R1) is the result of our XOR calculation. Result: [L1 || R1].", 
        bits: answer 
      }
    ];
    
    return {
      id: `feistel-round-${Date.now()}`,
      type: "round",
      cipher: "feistel",
      difficulty,
      description: `Determine the output (L', R') of a single Feistel round.`,
      given: { inputL: L, inputR: R, key: K },
      answer,
      hiddenIndices,
      hint: "L' is always the same as the previous R. R' is the XOR of previous L and the F-function output.",
      explanationSteps
    };
  } else {
    const rounds = difficulty === "easy" ? 2 : (difficulty === "medium" ? 4 : 6);
    const P = randomBits(8);
    const keys = Array.from({ length: rounds }, () => Math.floor(Math.random() * 16));
    let state = createInitialState(P, rounds, keys, "encryption");
    state = runAllRounds(state);
    const answer = [...state.L, ...state.R] as Bit[];
    
    const explanationSteps: ExplanationStep[] = [
      { label: "Step 0: Initial State", details: `Start with plaintext block [${P.join("")}] and a sequence of ${rounds} round keys: ${keys.join(", ")}.`, bits: P }
    ];
    state.history.forEach((rh, i) => {
      explanationSteps.push({
        label: `Round ${i+1} Process`,
        details: `Round ${i+1} using Key K${i+1}=${rh.roundKey}.\n1. New Left (L${i+1}) = Old Right (R${i})\n2. New Right (R${i+1}) = Old Left (L${i}) XOR F(R${i}, K${i+1})`,
        bits: [...rh.newL, ...rh.newR]
      });
    });
    
    let hiddenIndices: number[];
    if (difficulty === "easy") hiddenIndices = [0, 2, 4, 6];
    else if (difficulty === "medium") hiddenIndices = [0, 1, 2, 3, 4, 5, 6, 7].filter(() => Math.random() > 0.3);
    else hiddenIndices = [0, 1, 2, 3, 4, 5, 6, 7];
    
    return {
      id: `feistel-encrypt-${Date.now()}`,
      type: "encrypt",
      cipher: "feistel",
      difficulty,
      description: `Calculate the final ciphertext after ${rounds} rounds of encryption.`,
      given: { plaintext: P, key: keys, rounds },
      answer,
      hiddenIndices,
      hint: `Round keys: ${keys.join(", ")}. Follow the data flow through each round.`,
      explanationSteps
    };
  }
}

export function generateSDESChallenge(difficulty: "easy" | "medium" | "hard"): Challenge {
  const type: ChallengeType = difficulty === "easy" ? (Math.random() > 0.5 ? "round" : "encrypt") : "encrypt";

  if (type === "round") {
    const P = randomBits(8);
    const K10 = randomBits(10);
    const state = sdesEncrypt(P, K10);
    const answer = state.ipOutput;
    const hiddenIndices = [0, 1, 2, 3];

    const explanationSteps: ExplanationStep[] = [
      { 
        label: "Step 1: Input", 
        details: `8-bit plaintext: [${P.join("")}]`, 
        bits: P 
      },
      { 
        label: "Step 2: Initial Permutation (IP)", 
        details: "Reorder the bits according to the IP table. Bit at index 1 moves to pos 0, bit 5 to pos 1, etc.", 
        bits: answer,
        table: `IP Table: ${formatArray(SDES_IP)}`
      }
    ];

    return {
      id: `sdes-round-${Date.now()}`,
      type: "round",
      cipher: "sdes",
      difficulty,
      description: "Apply the Initial Permutation (IP) to the 8-bit plaintext.",
      given: { plaintext: P },
      answer,
      hiddenIndices,
      hint: "IP table: [1, 5, 2, 0, 3, 7, 4, 6]. Bit 0 moves to position 1, bit 1 moves to position 5, etc.",
      explanationSteps
    };
  } else {
    const P = randomBits(8);
    const K10 = randomBits(10);
    const state = sdesEncrypt(P, K10);
    const answer = state.ciphertext;
    
    const explanationSteps: ExplanationStep[] = [
      { label: "Step 1: Key Schedule", details: `Generate subkeys K1 and K2 from the 10-bit key [${K10.join("")}].\nK1: [${state.keyState.k1.join("")}]\nK2: [${state.keyState.k2.join("")}]`, bits: K10 },
      { label: "Step 2: Initial Permutation (IP)", details: "Shuffle the plaintext bits.", bits: state.ipOutput, table: `IP Table: ${formatArray(SDES_IP)}` },
      { 
        label: "Step 3: Round 1 (fK1)", 
        details: "1. Expand Right half (EP)\n2. XOR with K1\n3. S-Box substitution\n4. P4 permutation\n5. XOR with Left half.", 
        bits: state.afterFk1,
        table: `EP: ${formatArray(SDES_EP)}\nS0:\n${formatMatrix(SDES_S0)}\nS1:\n${formatMatrix(SDES_S1)}\nP4: ${formatArray(SDES_P4)}`
      },
      { label: "Step 4: Switch (SW)", details: "Swap the 4-bit halves.", bits: state.afterSwap },
      { label: "Step 5: Round 2 (fK2)", details: "Repeat the round function using subkey K2.", bits: state.afterFk2 },
      { label: "Step 6: Inverse IP (IP-1)", details: "Final permutation to produce the ciphertext.", bits: state.ciphertext, table: `IP-1 Table: ${formatArray(SDES_IP_INV)}` }
    ];
    
    let hiddenIndices: number[];
    if (difficulty === "easy") hiddenIndices = [0, 4, 7];
    else if (difficulty === "medium") hiddenIndices = [0, 1, 4, 5, 6, 7];
    else hiddenIndices = [0, 1, 2, 3, 4, 5, 6, 7];

    return {
      id: `sdes-encrypt-${Date.now()}`,
      type: "encrypt",
      cipher: "sdes",
      difficulty,
      description: "Perform the full S-DES encryption (2 rounds).",
      given: { plaintext: P, key: K10 },
      answer,
      hiddenIndices,
      hint: "Key generation first, then IP -> fK1 -> SW -> fK2 -> IP-1.",
      explanationSteps
    };
  }
}

export function generatePRESENTChallenge(difficulty: "easy" | "medium" | "hard"): Challenge {
  // For PRESENT, we'll use a 16-bit "mini" version for the worksheet to keep it practical
  const type: ChallengeType = difficulty === "easy" ? (Math.random() > 0.5 ? "round" : "encrypt") : "encrypt";
  
  const P64 = randomBits(64);
  const K80 = randomBits(80);
  const rounds = difficulty === "easy" ? 1 : (difficulty === "medium" ? 2 : 3);
  const state = presentEncrypt(P64, K80, rounds);
  
  // We only show and ask for the first 16 bits to make it solvable
  const answer = state.ciphertext.slice(0, 16) as Bit[];
  
  const explanationSteps: ExplanationStep[] = [
    { label: "Step 0: Initial State", details: `Input block (first 16 bits): [${P64.slice(0, 16).join("")}]`, bits: P64.slice(0, 16) as Bit[] }
  ];
  state.history.forEach((rh, i) => {
    explanationSteps.push({
      label: `Round ${i+1} - S-Box Layer`,
      details: "Each 4-bit nibble is replaced by a value from the S-Box table.",
      bits: rh.afterSBox.slice(0, 16) as Bit[],
      table: `S-Box (Hex): ${PRESENT_SBOX.map(v => v.toString(16).toUpperCase()).join(" ")}`
    });
    explanationSteps.push({
      label: `Round ${i+1} - P-Layer (Permutation)`,
      details: "Bits are moved to new positions according to the pLayer table.",
      bits: rh.afterPLayer.slice(0, 16) as Bit[],
      table: `pLayer (First 16): ${formatArray(PRESENT_PLAYER.slice(0, 16))}`
    });
  });
  
  let hiddenIndices: number[];
  if (difficulty === "easy") hiddenIndices = [0, 4, 8, 12];
  else if (difficulty === "medium") hiddenIndices = [0, 1, 4, 5, 8, 9, 12, 13];
  else hiddenIndices = Array.from({ length: 16 }, (_, i) => i);

  return {
    id: `present-encrypt-${Date.now()}`,
    type: type,
    cipher: "present",
    difficulty,
    description: `Determine the first 16 bits of the state after ${rounds} round(s) of PRESENT.`,
    given: { plaintext: P64.slice(0, 16) as Bit[], key: K80.slice(0, 16) as Bit[], rounds },
    answer,
    hiddenIndices,
    hint: "Each nibble (4 bits) goes through the S-Box. Then bits are permuted via the pLayer.",
    explanationSteps
  };
}
