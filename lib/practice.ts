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
  type PRESENTState
} from "./present";

export type ChallengeType = "encrypt" | "decrypt" | "round";

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
    const answer = [...next.L, ...next.R] as Bit[];
    const hiddenIndices = [0, 4, 7]; 
    
    return {
      id: `feistel-round-${Date.now()}`,
      type: "round",
      cipher: "feistel",
      difficulty,
      description: `Determine the output (L', R') of a single Feistel round.`,
      given: { inputL: L, inputR: R, key: K },
      answer,
      hiddenIndices,
      hint: "L' is always the same as the previous R. R' is the XOR of previous L and the F-function output."
    };
  } else {
    const rounds = difficulty === "easy" ? 2 : (difficulty === "medium" ? 4 : 6);
    const P = randomBits(8);
    const keys = Array.from({ length: rounds }, () => Math.floor(Math.random() * 16));
    let state = createInitialState(P, rounds, keys, "encryption");
    state = runAllRounds(state);
    const answer = [...state.L, ...state.R] as Bit[];
    
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
      hint: `Round keys: ${keys.join(", ")}. Follow the data flow through each round.`
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

    return {
      id: `sdes-round-${Date.now()}`,
      type: "round",
      cipher: "sdes",
      difficulty,
      description: "Apply the Initial Permutation (IP) to the 8-bit plaintext.",
      given: { plaintext: P },
      answer,
      hiddenIndices,
      hint: "IP table: [1, 5, 2, 0, 3, 7, 4, 6]. Bit 0 moves to position 1, bit 1 moves to position 5, etc."
    };
  } else {
    const P = randomBits(8);
    const K10 = randomBits(10);
    const state = sdesEncrypt(P, K10);
    const answer = state.ciphertext;
    
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
      hint: "Key generation first, then IP -> fK1 -> SW -> fK2 -> IP-1."
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
    hint: "Each nibble (4 bits) goes through the S-Box. Then bits are permuted via the pLayer."
  };
}
