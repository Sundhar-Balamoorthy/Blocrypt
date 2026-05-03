// ==========================================
// Blocrypt Feistel Cipher - Core Logic
// ==========================================

export type Bit = 0 | 1;

export interface RoundState {
  round: number;
  prevL: Bit[];
  prevR: Bit[];
  roundKey: number;
  roundKeyBits: Bit[];
  fOutput: Bit[];
  xorResult: Bit[];
  newL: Bit[];
  newR: Bit[];
  mode: "encryption" | "decryption";
}

export interface FeistelState {
  L: Bit[];
  R: Bit[];
  round: number;
  totalRounds: number;
  keys: number[];
  mode: "encryption" | "decryption";
  history: RoundState[];
  completed: boolean;
}

// --- Bit Manipulation Helpers ---

export function xorBits(a: Bit[], b: Bit[]): Bit[] {
  return a.map((bit, i) => (bit ^ b[i]) as Bit);
}

export function bitsToInt(bits: Bit[]): number {
  return parseInt(bits.join(""), 2);
}

export function intToBits(x: number, n: number): Bit[] {
  const clamped = ((x % (1 << n)) + (1 << n)) % (1 << n);
  return clamped
    .toString(2)
    .padStart(n, "0")
    .split("")
    .map((b) => parseInt(b) as Bit);
}

// --- Round Function ---

export function feistelF(right: Bit[], subkey: number): Bit[] {
  const val = bitsToInt(right) ^ subkey;
  return intToBits(val % (1 << right.length), right.length);
}

// --- Simulator Factory ---

export function createInitialState(
  plaintext: Bit[],
  totalRounds: number,
  keys: number[],
  mode: "encryption" | "decryption" = "encryption"
): FeistelState {
  const half = plaintext.length / 2;
  return {
    L: plaintext.slice(0, half) as Bit[],
    R: plaintext.slice(half) as Bit[],
    round: 0,
    totalRounds,
    keys,
    mode,
    history: [],
    completed: false,
  };
}

// --- Step through one round ---

export function stepRound(state: FeistelState): FeistelState {
  if (state.round >= state.totalRounds) {
    return { ...state, completed: true };
  }

  const prevL = [...state.L] as Bit[];
  const prevR = [...state.R] as Bit[];
  const halfLen = state.L.length;

  let roundKey: number;
  let fOutput: Bit[];
  let xorResult: Bit[];
  let newL: Bit[];
  let newR: Bit[];

  if (state.mode === "encryption") {
    roundKey = state.keys[state.round % state.keys.length];
    fOutput = feistelF(prevR, roundKey);
    xorResult = xorBits(prevL, fOutput);
    newL = [...prevR] as Bit[];
    newR = xorResult;
  } else {
    // Decryption: reversed key order, F applied to L
    roundKey =
      state.keys[(state.totalRounds - 1 - state.round) % state.keys.length];
    fOutput = feistelF(prevL, roundKey);
    xorResult = xorBits(prevR, fOutput);
    newL = xorResult;
    newR = [...prevL] as Bit[];
  }

  const roundState: RoundState = {
    round: state.round + 1,
    prevL,
    prevR,
    roundKey,
    roundKeyBits: intToBits(roundKey, halfLen),
    fOutput,
    xorResult,
    newL,
    newR,
    mode: state.mode,
  };

  const newRound = state.round + 1;

  return {
    ...state,
    L: newL,
    R: newR,
    round: newRound,
    history: [...state.history, roundState],
    completed: newRound >= state.totalRounds,
  };
}

// --- Run all rounds ---

export function runAllRounds(state: FeistelState): FeistelState {
  let current = state;
  while (!current.completed) {
    current = stepRound(current);
  }
  return current;
}

// --- Flip a bit (0-7 across L+R) ---

export function flipBit(state: FeistelState, index: number): FeistelState {
  const halfLen = state.L.length;
  const newL = [...state.L] as Bit[];
  const newR = [...state.R] as Bit[];

  if (index < halfLen) {
    newL[index] = (newL[index] ^ 1) as Bit;
  } else {
    newR[index - halfLen] = (newR[index - halfLen] ^ 1) as Bit;
  }

  return { ...state, L: newL, R: newR };
}

// --- Full Cycle (Encrypt then Decrypt) ---

export interface FullCycleResult {
  encryptionHistory: RoundState[];
  decryptionHistory: RoundState[];
  ciphertext: Bit[];
  recovered: Bit[];
  original: Bit[];
  success: boolean;
}

export function runFullCycle(
  plaintext: Bit[],
  totalRounds: number,
  keys: number[]
): FullCycleResult {
  // Encryption
  let encState = createInitialState(plaintext, totalRounds, keys, "encryption");
  encState = runAllRounds(encState);
  const ciphertext = [...encState.L, ...encState.R] as Bit[];

  // Decryption
  let decState = createInitialState(
    ciphertext,
    totalRounds,
    keys,
    "decryption"
  );
  decState = runAllRounds(decState);
  const recovered = [...decState.L, ...decState.R] as Bit[];

  const success =
    plaintext.length === recovered.length &&
    plaintext.every((bit, i) => bit === recovered[i]);

  return {
    encryptionHistory: encState.history,
    decryptionHistory: decState.history,
    ciphertext,
    recovered,
    original: plaintext,
    success,
  };
}


// --- Bit Flip Simulation Helper ---

export interface BitFlipSimulation {
  originalCipher: Bit[];
  flippedCipher: Bit[];
  diff: boolean[];
}

/**
 * Runs encryption on the given plaintext, then flips a specified bit and
 * encrypts again. Returns both ciphertexts and a mask indicating which bits
 * differ. Useful for visualizing avalanche/bit‑flip effects.
 */
export function simulateBitFlip(
  plaintext: Bit[],
  flipIndex: number,
  totalRounds: number,
  keys: number[]
): BitFlipSimulation {
  const orig = runFullCycle(plaintext, totalRounds, keys);
  const originalCipher = orig.ciphertext;

  const flippedPlain = [...plaintext] as Bit[];
  flippedPlain[flipIndex] = (flippedPlain[flipIndex] ^ 1) as Bit;

  const flipped = runFullCycle(flippedPlain, totalRounds, keys);
  const flippedCipher = flipped.ciphertext;

  const diff = originalCipher.map((b, i) => b !== flippedCipher[i]);
  return { originalCipher, flippedCipher, diff };
}

// --- Dataset Generation ---

export interface DatasetRow {
  plaintext: Bit[];
  ciphertext: Bit[];
  label: 0 | 1;
}

function randomBits(n: number): Bit[] {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0) as Bit);
}

export function generateDataset(
  numSamples: number = 1000,
  baseKeys: number[] = [3, 5, 7, 9]
): DatasetRow[] {
  const dataset: DatasetRow[] = [];
  const seen = new Set<string>();
  const halfSamples = Math.floor(numSamples / 2);
  
  // Helper to stringify a sample for uniqueness check
  const getSampleKey = (p: Bit[], c: Bit[], l: number) => 
    `${p.join("")}|${c.join("")}|${l}`;

  // Valid ciphertext samples (label = 1)
  let validCount = 0;
  let attempts = 0;
  const maxAttempts = numSamples * 50; // Increased to handle collisions in small space

  while (validCount < halfSamples && attempts < maxAttempts) {
    attempts++;
    const p = randomBits(8);
    
    // If we need more unique samples than the 8-bit space allows (256), 
    // we vary the keys per sample to ensure variety.
    let currentKeys = baseKeys;
    if (validCount >= 256) {
      // Use random keys for each sample to maximize the (P, C) mapping space.
      // This allows for up to 65,536 unique (P, C) pairs.
      currentKeys = baseKeys.map(() => Math.floor(Math.random() * 16));
    }
      
    let state = createInitialState(p, currentKeys.length, currentKeys, "encryption");
    state = runAllRounds(state);
    const c = [...state.L, ...state.R] as Bit[];
    
    const key = getSampleKey(p, c, 1);
    if (!seen.has(key)) {
      seen.add(key);
      dataset.push({
        plaintext: p,
        ciphertext: c,
        label: 1,
      });
      validCount++;
    }
  }

  // Random noise samples (label = 0)
  let noiseCount = 0;
  const noiseTarget = numSamples - halfSamples;
  while (noiseCount < noiseTarget && attempts < maxAttempts * 2) {
    attempts++;
    const p = randomBits(8);
    const c = randomBits(8);
    
    // Security check: Ensure this random noise is NOT accidentally a valid ciphertext
    let state = createInitialState(p, baseKeys.length, baseKeys, "encryption");
    state = runAllRounds(state);
    const validC = [...state.L, ...state.R] as Bit[];
    const isAccidentallyValid = c.every((b, idx) => b === validC[idx]);
    
    if (!isAccidentallyValid) {
      const key = getSampleKey(p, c, 0);
      if (!seen.has(key)) {
        seen.add(key);
        dataset.push({
          plaintext: p,
          ciphertext: c,
          label: 0,
        });
        noiseCount++;
      }
    }
  }

  return dataset;
}

export function datasetToCSV(dataset: DatasetRow[]): string {
  if (!dataset || dataset.length === 0) return "";
  
  const pLen = dataset[0].plaintext.length;
  const cLen = dataset[0].ciphertext.length;

  const headers = [
    ...Array.from({ length: pLen }, (_, i) => `P${i}`),
    ...Array.from({ length: cLen }, (_, i) => `C${i}`),
    "Label",
  ].join(",");

  const rows = dataset.map((row) =>
    [...row.plaintext, ...row.ciphertext, row.label].join(",")
  );

  return [headers, ...rows].join("\n");
}

// --- Default values ---

export const DEFAULT_PLAINTEXT: Bit[] = [1, 1, 0, 0, 1, 0, 1, 0];
export const DEFAULT_KEYS = [3, 5, 7, 9];
export const DEFAULT_ROUNDS = 4;

export interface ChaosDatasetRow {
  plaintext: number;
  ciphertext: number;
}

export function generateChaosDataset(
  numSamples: number = 1000,
  baseKeys: number[] = [3, 5, 7, 9]
): ChaosDatasetRow[] {
  const dataset: ChaosDatasetRow[] = [];
  const maxVal = 255; // 8-bit

  for (let i = 0; i < numSamples; i++) {
    const pVal = Math.floor(Math.random() * (maxVal + 1));
    const pBits = intToBits(pVal, 8);
    
    // To get unique mappings beyond 256, we vary the keys per sample
    // The model DOES NOT see these keys, so it must try to find a key-independent pattern.
    let currentKeys = baseKeys;
    if (i >= 256 || numSamples > 256) {
      currentKeys = baseKeys.map(() => Math.floor(Math.random() * 16));
    }

    let state = createInitialState(pBits, currentKeys.length, currentKeys, "encryption");
    state = runAllRounds(state);
    const cVal = bitsToInt([...state.L, ...state.R] as Bit[]);
    
    dataset.push({
      plaintext: pVal,
      ciphertext: cVal
    });
  }

  return dataset;
}
