// ==========================================
// Blocrypt PRESENT Cipher - Core Logic
// ==========================================
// PRESENT: Lightweight 64-bit block cipher with 80-bit key
// Architecture: Substitution-Permutation Network (SPN)
// Reference: Bogdanov et al., CHES 2007

export type Bit = 0 | 1;

// ─── PRESENT S-Box (4-bit → 4-bit) ──────────────────────────
export const SBOX: number[]     = [0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD, 0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2];
export const SBOX_INV: number[] = [0x5, 0xE, 0xF, 0x8, 0xC, 0x1, 0x2, 0xD, 0xB, 0x4, 0x6, 0x3, 0x0, 0x7, 0x9, 0xA];

// ─── PRESENT pLayer Permutation Table (64-bit) ───────────────
// P(i) = bit i maps to position pLayer[i]
export const P_LAYER: number[] = [
   0, 16, 32, 48,  1, 17, 33, 49,
   2, 18, 34, 50,  3, 19, 35, 51,
   4, 20, 36, 52,  5, 21, 37, 53,
   6, 22, 38, 54,  7, 23, 39, 55,
   8, 24, 40, 56,  9, 25, 41, 57,
  10, 26, 42, 58, 11, 27, 43, 59,
  12, 28, 44, 60, 13, 29, 45, 61,
  14, 30, 46, 62, 15, 31, 47, 63,
];

// ─── Helper: BigInt ↔ Bit[] ───────────────────────────────────

export function bigintToBits(val: bigint, n: number): Bit[] {
  const bits: Bit[] = [];
  for (let i = n - 1; i >= 0; i--) {
    bits.push(Number((val >> BigInt(i)) & 1n) as Bit);
  }
  return bits;
}

export function bitsToBigint(bits: Bit[]): bigint {
  let val = 0n;
  for (const b of bits) {
    val = (val << 1n) | BigInt(b);
  }
  return val;
}

// ─── Key Schedule ─────────────────────────────────────────────
// Generates (totalRounds + 1) round keys from an 80-bit key.
// Each round key Ki is the 64 most significant bits of the key register
// after (i-1) update steps.

export function generatePresentRoundKeys(key80: Bit[], totalRounds: number): Bit[][] {
  // Work with bigint for easy bit manipulation
  let K = bitsToBigint(key80);
  const mask80 = (1n << 80n) - 1n;
  const mask64 = (1n << 64n) - 1n;

  const roundKeys: Bit[][] = [];

  for (let round = 1; round <= totalRounds + 1; round++) {
    // Extract 64 MSBs as round key
    const rk = bigintToBits(K >> 16n, 64);
    roundKeys.push(rk);

    // Key schedule update (only needed if more rounds follow)
    if (round <= totalRounds) {
      // 1. Rotate left by 61 bits (equiv to rotate right by 19)
      K = ((K << 61n) | (K >> 19n)) & mask80;

      // 2. Apply S-box to top 4 bits
      const top4 = Number((K >> 76n) & 0xFn);
      const sub4 = BigInt(SBOX[top4]);
      K = (K & ((1n << 76n) - 1n)) | (sub4 << 76n);

      // 3. XOR round counter into bits 19..15 (0-indexed from right)
      const counterBits = BigInt(round) & 0x1Fn;
      K ^= counterBits << 15n;
    }
  }

  return roundKeys;
}

// ─── PRESENT Operations ───────────────────────────────────────

function addRoundKey(state: Bit[], roundKey: Bit[]): Bit[] {
  return state.map((b, i) => (b ^ roundKey[i]) as Bit);
}

function sboxLayer(state: Bit[], inverse = false): Bit[] {
  const result: Bit[] = [];
  for (let n = 0; n < 16; n++) {
    const nibble = state.slice(n * 4, n * 4 + 4);
    const val = parseInt(nibble.join(""), 2);
    const sub = inverse ? SBOX_INV[val] : SBOX[val];
    result.push(...bigintToBits(BigInt(sub), 4));
  }
  return result;
}

function pLayer(state: Bit[], inverse = false): Bit[] {
  const result = new Array(64).fill(0) as Bit[];
  if (inverse) {
    // Build inverse perm table
    const P_INV = new Array(64).fill(0);
    for (let i = 0; i < 64; i++) P_INV[P_LAYER[i]] = i;
    for (let i = 0; i < 64; i++) result[P_INV[i]] = state[i];
  } else {
    for (let i = 0; i < 64; i++) result[P_LAYER[i]] = state[i];
  }
  return result;
}

// ─── State Interfaces ─────────────────────────────────────────

export interface PRESENTRoundState {
  round: number;
  inputState: Bit[];
  roundKey: Bit[];
  afterAddKey: Bit[];
  afterSBox: Bit[];
  afterPLayer: Bit[];

  // For encryption: the extra AddRoundKey at the very end
  // For decryption: the initial AddRoundKey at the very beginning
  extraAddKey?: Bit[];
  extraRoundKey?: Bit[];

  isLastRound: boolean;
}

export interface PRESENTState {
  plaintext: Bit[];
  key80: Bit[];
  mode: "encryption" | "decryption";
  totalRounds: number;

  // Current position
  // Current position
  round: number;        // 0 = not started, 1..totalRounds = completed
  currentState: Bit[];  // Running cipher state

  // Key schedule
  roundKeys: Bit[][];

  // History for display
  history: PRESENTRoundState[];
  completed: boolean;

  // Final output
  ciphertext: Bit[];
}

// ─── Create Initial State ─────────────────────────────────────

export function createPRESENTInitialState(
  plaintext: Bit[],
  key80: Bit[],
  totalRounds: number,
  mode: "encryption" | "decryption" = "encryption"
): PRESENTState {
  const roundKeys = generatePresentRoundKeys(key80, totalRounds);
  const keys = mode === "decryption" ? [...roundKeys].reverse() : roundKeys;
  return {
    plaintext,
    key80,
    mode,
    totalRounds,
    round: 0,
    currentState: [...plaintext] as Bit[],
    roundKeys: keys,
    history: [],
    completed: false,
    ciphertext: [],
  };
}

// ─── Step One Round ───────────────────────────────────────────

export function stepPRESENT(state: PRESENTState): PRESENTState {
  if (state.completed) return state;

  const round = state.round + 1;
  const inputState = [...state.currentState] as Bit[];
  const isLastStep = round === state.totalRounds;
  
  let nextState: Bit[];
  let afterAddKey: Bit[] = [];
  let afterSBox: Bit[] = [];
  let afterPLayer: Bit[] = [];
  let extraAddKey: Bit[] | undefined;
  let extraRoundKey: Bit[] | undefined;

  if (state.mode === "encryption") {
    // Encryption rounds: AddKey(Ki) -> SBox -> PLayer
    // Final Round (N): AddKey(Ki) -> SBox -> PLayer -> AddKey(Ki+1)
    const currentKey = state.roundKeys[round - 1];
    afterAddKey = addRoundKey(inputState, currentKey);
    afterSBox = sboxLayer(afterAddKey, false);
    afterPLayer = pLayer(afterSBox, false);
    
    if (isLastStep) {
      extraRoundKey = state.roundKeys[round];
      extraAddKey = addRoundKey(afterPLayer, extraRoundKey);
      nextState = extraAddKey;
    } else {
      nextState = afterPLayer;
    }
  } else {
    // Decryption rounds: Reverses encryption
    // Round 1: AddKey(Kn+1) -> PLayer_inv -> SBox_inv -> AddKey(Kn)
    // Round i: PLayer_inv -> SBox_inv -> AddKey(Ki)
    if (round === 1) {
      extraRoundKey = state.roundKeys[0];
      const afterInitial = addRoundKey(inputState, extraRoundKey);
      extraAddKey = afterInitial; 
      
      afterPLayer = pLayer(afterInitial, true);
      afterSBox = sboxLayer(afterPLayer, true);
      afterAddKey = addRoundKey(afterSBox, state.roundKeys[1]);
      nextState = afterAddKey;
    } else {
      afterPLayer = pLayer(inputState, true);
      afterSBox = sboxLayer(afterPLayer, true);
      afterAddKey = addRoundKey(afterSBox, state.roundKeys[round]);
      nextState = afterAddKey;
    }
  }

  const roundRecord: PRESENTRoundState = {
    round,
    inputState,
    roundKey: state.mode === "encryption" ? state.roundKeys[round - 1] : (round === 1 ? state.roundKeys[1] : state.roundKeys[round]),
    afterAddKey,
    afterSBox,
    afterPLayer,
    extraAddKey,
    extraRoundKey,
    isLastRound: isLastStep,
  };

  return {
    ...state,
    round: round,
    currentState: nextState,
    history: [...state.history, roundRecord],
    completed: isLastStep,
    ciphertext: isLastStep ? nextState : [],
  };
}

export function runAllPRESENT(state: PRESENTState): PRESENTState {
  let current = state;
  while (!current.completed) {
    current = stepPRESENT(current);
  }
  return current;
}

// ─── One-shot Encrypt / Decrypt ───────────────────────────────

export function presentEncrypt(plaintext: Bit[], key80: Bit[], totalRounds: number): PRESENTState {
  let state = createPRESENTInitialState(plaintext, key80, totalRounds, "encryption");
  return runAllPRESENT(state);
}

export function presentDecrypt(ciphertext: Bit[], key80: Bit[], totalRounds: number): PRESENTState {
  let state = createPRESENTInitialState(ciphertext, key80, totalRounds, "decryption");
  return runAllPRESENT(state);
}

// ─── Full Cycle ───────────────────────────────────────────────

export interface PRESENTFullCycleResult {
  encryptState: PRESENTState;
  decryptState: PRESENTState;
  plaintext: Bit[];
  ciphertext: Bit[];
  recovered: Bit[];
  success: boolean;
}

export function presentFullCycle(plaintext: Bit[], key80: Bit[], totalRounds: number): PRESENTFullCycleResult {
  const encryptState = presentEncrypt(plaintext, key80, totalRounds);
  const ciphertext = encryptState.ciphertext;
  const decryptState = presentDecrypt(ciphertext, key80, totalRounds);
  const recovered = decryptState.ciphertext;

  const success =
    plaintext.length === recovered.length &&
    plaintext.every((b, i) => b === recovered[i]);

  return { encryptState, decryptState, plaintext, ciphertext, recovered, success };
}

// ─── Dataset Generation ───────────────────────────────────────

export interface PRESENTDatasetRow {
  plaintext: Bit[];
  ciphertext: Bit[];
  label: 0 | 1;
}

function randomBits(n: number): Bit[] {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0) as Bit);
}

export function generatePRESENTDataset(
  numSamples: number = 1000,
  totalRounds: number = 4
): PRESENTDatasetRow[] {
  const dataset: PRESENTDatasetRow[] = [];
  const seen = new Set<string>();
  const halfSamples = Math.floor(numSamples / 2);
  const key80 = DEFAULT_PRESENT_KEY80;

  const getSampleKey = (p: Bit[], c: Bit[], l: number) => 
    `${p.join("")}|${c.join("")}|${l}`;

  // Valid ciphertext samples (label = 1)
  let validCount = 0;
  let attempts = 0;
  const maxAttempts = numSamples * 5; // Low multiplier for large 64-bit space

  while (validCount < halfSamples && attempts < maxAttempts) {
    attempts++;
    const p = randomBits(64) as Bit[];
    const { ciphertext } = presentEncrypt(p, key80, totalRounds);
    const key = getSampleKey(p, ciphertext, 1);
    
    if (!seen.has(key)) {
      seen.add(key);
      dataset.push({ plaintext: p, ciphertext, label: 1 });
      validCount++;
    }
  }

  // Random noise samples (label = 0)
  let noiseCount = 0;
  const noiseTarget = numSamples - halfSamples;
  while (noiseCount < noiseTarget && attempts < maxAttempts * 2) {
    attempts++;
    const p = randomBits(64) as Bit[];
    const c = randomBits(64) as Bit[];
    
    // Security check (unlikely in 64-bit space but good for consistency)
    const { ciphertext: validC } = presentEncrypt(p, key80, totalRounds);
    const isAccidentallyValid = c.every((b, idx) => b === validC[idx]);
    
    if (!isAccidentallyValid) {
      const key = getSampleKey(p, c, 0);
      if (!seen.has(key)) {
        seen.add(key);
        dataset.push({ plaintext: p, ciphertext: c, label: 0 });
        noiseCount++;
      }
    }
  }

  return dataset;
}

// ─── Default Values ───────────────────────────────────────────

export const DEFAULT_PRESENT_PLAINTEXT: Bit[] = [
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
];

export const DEFAULT_PRESENT_KEY80: Bit[] = [
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
  0,0,0,0, 0,0,0,0,
];

export const DEFAULT_PRESENT_ROUNDS = 4;
export const MIN_PRESENT_ROUNDS = 1;
export const MAX_PRESENT_ROUNDS = 8;

export function generateChaosDataset(
  numSamples: number = 1000,
  key80: Bit[] = DEFAULT_PRESENT_KEY80,
  totalRounds: number = 4
): { plaintext: number; ciphertext: number }[] {
  const dataset: { plaintext: number; ciphertext: number }[] = [];
  
  for (let i = 0; i < numSamples; i++) {
    const pBits = randomBits(64) as Bit[];
    const { ciphertext } = presentEncrypt(pBits, key80, totalRounds);
    
    // Convert to number (will lose precision beyond 53 bits, but okay for visualization)
    const pVal = Number(bitsToBigint(pBits));
    const cVal = Number(bitsToBigint(ciphertext));
    
    dataset.push({
      plaintext: pVal,
      ciphertext: cVal
    });
  }

  return dataset;
}
