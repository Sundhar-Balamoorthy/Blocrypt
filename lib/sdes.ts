// ==========================================
// Blocrypt S-DES (Simplified DES) - Core Logic
// ==========================================

export type Bit = 0 | 1;

// ─── Permutation Tables ───────────────────────────────────────

// P10: Permutation of 10-bit key (1-indexed → 0-indexed internally)
export const P10 = [2, 4, 1, 6, 3, 9, 0, 8, 7, 5];

// P8: Select 8 bits from 10 (produces subkey)
export const P8 = [5, 2, 6, 3, 7, 4, 9, 8];

// IP: Initial Permutation on 8-bit plaintext
export const IP = [1, 5, 2, 0, 3, 7, 4, 6];

// IP_INV: Inverse Initial Permutation
export const IP_INV = [3, 0, 2, 4, 6, 1, 7, 5];

// EP: Expansion/Permutation of 4 bits → 8 bits
export const EP = [3, 0, 1, 2, 1, 2, 3, 0];

// P4: Permutation of 4 bits
export const P4 = [1, 3, 2, 0];

// S-Boxes (4x4 lookup: row from bits 0,3; col from bits 1,2)
export const S0: number[][] = [
  [1, 0, 3, 2],
  [3, 2, 1, 0],
  [0, 2, 1, 3],
  [3, 1, 3, 2],
];

export const S1: number[][] = [
  [0, 1, 2, 3],
  [2, 0, 1, 3],
  [3, 0, 1, 0],
  [2, 1, 0, 3],
];

// ─── State Interfaces ─────────────────────────────────────────

export interface SDESKeyState {
  key10: Bit[];         // Original 10-bit key
  p10Result: Bit[];     // After P10
  ls1Result: Bit[];     // After LS-1
  k1: Bit[];            // Subkey 1 (after P8)
  ls2Result: Bit[];     // After LS-2
  k2: Bit[];            // Subkey 2 (after P8)
}

export interface SDESRoundDetail {
  round: 1 | 2;
  input: Bit[];          // 8-bit input to this f_K
  subkey: Bit[];         // K1 or K2
  epResult: Bit[];       // After EP expansion
  xorResult: Bit[];      // XOR with subkey
  s0Input: Bit[];        // Left 4 bits into S0
  s1Input: Bit[];        // Right 4 bits into S1
  s0Output: Bit[];       // 2 bits from S0
  s1Output: Bit[];       // 2 bits from S1
  sboxCombined: Bit[];   // 4 bits [S0, S1]
  p4Result: Bit[];       // After P4
  fkOutput: Bit[];       // XOR of f_K output with left half
  swapped?: Bit[];       // After SW (only for round 1)
}

export interface SDESState {
  // Inputs
  plaintext: Bit[];
  key10: Bit[];
  mode: "encryption" | "decryption";

  // Key schedule
  keyState: SDESKeyState;

  // Step progress (0 = initial, 1 = after IP, 2 = after fK1, 3 = after SW, 4 = after fK2/done)
  step: 0 | 1 | 2 | 3 | 4;

  // Intermediate values
  ipOutput: Bit[];        // After IP
  afterFk1: Bit[];        // After f_K with K1
  afterSwap: Bit[];       // After SW
  afterFk2: Bit[];        // After f_K with K2
  ciphertext: Bit[];      // After IP-1

  // Round details for display
  round1Detail: SDESRoundDetail | null;
  round2Detail: SDESRoundDetail | null;

  completed: boolean;
}

// ─── Helper Utilities ─────────────────────────────────────────

function permute(bits: Bit[], table: number[]): Bit[] {
  return table.map((i) => bits[i]);
}

function leftShift(bits: Bit[], n: number): Bit[] {
  return [...bits.slice(n), ...bits.slice(0, n)] as Bit[];
}

function xorBits(a: Bit[], b: Bit[]): Bit[] {
  return a.map((bit, i) => (bit ^ b[i]) as Bit);
}

function intToBits2(x: number): Bit[] {
  return [((x >> 1) & 1) as Bit, (x & 1) as Bit];
}

// ─── Key Generation ───────────────────────────────────────────

export function generateKeys(key10: Bit[]): SDESKeyState {
  const p10Result = permute(key10, P10);

  // Split into two halves of 5
  const left5 = p10Result.slice(0, 5) as Bit[];
  const right5 = p10Result.slice(5) as Bit[];

  // LS-1: shift each half left by 1
  const ls1Left = leftShift(left5, 1);
  const ls1Right = leftShift(right5, 1);
  const ls1Result = [...ls1Left, ...ls1Right] as Bit[];

  // K1 = P8 of ls1Result
  const k1 = permute(ls1Result, P8);

  // LS-2: shift each half left by 2 (cumulative from ls1)
  const ls2Left = leftShift(ls1Left, 2);
  const ls2Right = leftShift(ls1Right, 2);
  const ls2Result = [...ls2Left, ...ls2Right] as Bit[];

  // K2 = P8 of ls2Result
  const k2 = permute(ls2Result, P8);

  return {
    key10,
    p10Result: p10Result as Bit[],
    ls1Result,
    k1: k1 as Bit[],
    ls2Result,
    k2: k2 as Bit[],
  };
}

// ─── S-Box Lookup ─────────────────────────────────────────────

function sboxLookup(bits: Bit[], sbox: number[][]): Bit[] {
  const row = (bits[0] << 1) | bits[3];
  const col = (bits[1] << 1) | bits[2];
  return intToBits2(sbox[row][col]);
}

// ─── f_K Round Function ───────────────────────────────────────

function fK(input: Bit[], subkey: Bit[], round: 1 | 2): SDESRoundDetail {
  const left = input.slice(0, 4) as Bit[];
  const right = input.slice(4) as Bit[];

  // EP: expand right half 4→8 bits
  const epResult = permute(right, EP) as Bit[];

  // XOR with subkey
  const xorResult = xorBits(epResult, subkey);

  // Split XOR result into two 4-bit halves for S-boxes
  const s0Input = xorResult.slice(0, 4) as Bit[];
  const s1Input = xorResult.slice(4) as Bit[];

  // S-box lookup
  const s0Output = sboxLookup(s0Input, S0);
  const s1Output = sboxLookup(s1Input, S1);

  // Combine S-box outputs and apply P4
  const sboxCombined = [...s0Output, ...s1Output] as Bit[];
  const p4Result = permute(sboxCombined, P4) as Bit[];

  // XOR with left half
  const fkOutput = xorBits(left, p4Result);

  return {
    round,
    input,
    subkey,
    epResult,
    xorResult,
    s0Input,
    s1Input,
    s0Output,
    s1Output,
    sboxCombined,
    p4Result,
    fkOutput: [...fkOutput, ...right] as Bit[],
  };
}

// ─── Encrypt / Decrypt ────────────────────────────────────────

export function sdesEncrypt(plaintext: Bit[], key10: Bit[]): SDESState {
  const keyState = generateKeys(key10);

  // IP
  const ipOutput = permute(plaintext, IP) as Bit[];

  // Round 1: f_K with K1
  const rnd1 = fK(ipOutput, keyState.k1, 1);
  const afterFk1 = rnd1.fkOutput;

  // SW: swap halves
  const afterSwap = [...afterFk1.slice(4), ...afterFk1.slice(0, 4)] as Bit[];
  rnd1.swapped = afterSwap;

  // Round 2: f_K with K2
  const rnd2 = fK(afterSwap, keyState.k2, 2);
  const afterFk2 = rnd2.fkOutput;

  // IP-1
  const ciphertext = permute(afterFk2, IP_INV) as Bit[];

  return {
    plaintext,
    key10,
    mode: "encryption",
    keyState,
    step: 4,
    ipOutput,
    afterFk1,
    afterSwap,
    afterFk2,
    ciphertext,
    round1Detail: rnd1,
    round2Detail: rnd2,
    completed: true,
  };
}

export function sdesDecrypt(ciphertext: Bit[], key10: Bit[]): SDESState {
  const keyState = generateKeys(key10);

  // IP
  const ipOutput = permute(ciphertext, IP) as Bit[];

  // Round 1 (decryption uses K2 first)
  const rnd1 = fK(ipOutput, keyState.k2, 1);
  const afterFk1 = rnd1.fkOutput;

  // SW
  const afterSwap = [...afterFk1.slice(4), ...afterFk1.slice(0, 4)] as Bit[];
  rnd1.swapped = afterSwap;

  // Round 2 (uses K1)
  const rnd2 = fK(afterSwap, keyState.k1, 2);
  const afterFk2 = rnd2.fkOutput;

  // IP-1
  const plaintext = permute(afterFk2, IP_INV) as Bit[];

  return {
    plaintext: ciphertext,   // original input was ciphertext
    key10,
    mode: "decryption",
    keyState,
    step: 4,
    ipOutput,
    afterFk1,
    afterSwap,
    afterFk2,
    ciphertext: plaintext,   // output is recovered plaintext
    round1Detail: rnd1,
    round2Detail: rnd2,
    completed: true,
  };
}

// ─── Step-by-Step Simulator ───────────────────────────────────

export function createSDESInitialState(
  plaintext: Bit[],
  key10: Bit[],
  mode: "encryption" | "decryption" = "encryption"
): SDESState {
  const keyState = generateKeys(key10);
  return {
    plaintext,
    key10,
    mode,
    keyState,
    step: 0,
    ipOutput: [],
    afterFk1: [],
    afterSwap: [],
    afterFk2: [],
    ciphertext: [],
    round1Detail: null,
    round2Detail: null,
    completed: false,
  };
}

export function stepSDES(state: SDESState): SDESState {
  if (state.completed) return state;

  const { keyState, plaintext, mode, step } = state;
  const k1 = mode === "encryption" ? keyState.k1 : keyState.k2;
  const k2 = mode === "encryption" ? keyState.k2 : keyState.k1;

  if (step === 0) {
    // Step 1: Apply IP
    const ipOutput = permute(plaintext, IP) as Bit[];
    return { ...state, step: 1, ipOutput };
  }

  if (step === 1) {
    // Step 2: Round 1 f_K
    const rnd1 = fK(state.ipOutput, k1, 1);
    const afterFk1 = rnd1.fkOutput;
    const afterSwap = [...afterFk1.slice(4), ...afterFk1.slice(0, 4)] as Bit[];
    rnd1.swapped = afterSwap;
    return { ...state, step: 2, afterFk1, round1Detail: rnd1 };
  }

  if (step === 2) {
    // Step 3: SW (Swap)
    const afterSwap = [...state.afterFk1.slice(4), ...state.afterFk1.slice(0, 4)] as Bit[];
    return { ...state, step: 3, afterSwap };
  }

  if (step === 3) {
    // Step 4: Round 2 f_K + IP-1
    const rnd2 = fK(state.afterSwap, k2, 2);
    const afterFk2 = rnd2.fkOutput;
    const ciphertext = permute(afterFk2, IP_INV) as Bit[];
    return { ...state, step: 4, afterFk2, ciphertext, round2Detail: rnd2, completed: true };
  }

  return { ...state, completed: true };
}

export function runAllSDES(state: SDESState): SDESState {
  let current = state;
  while (!current.completed) {
    current = stepSDES(current);
  }
  return current;
}

// ─── Full Cycle ───────────────────────────────────────────────

export interface SDESFullCycleResult {
  encryptState: SDESState;
  decryptState: SDESState;
  plaintext: Bit[];
  ciphertext: Bit[];
  recovered: Bit[];
  success: boolean;
}

export function sdesFullCycle(plaintext: Bit[], key10: Bit[]): SDESFullCycleResult {
  const encryptState = sdesEncrypt(plaintext, key10);
  const ciphertext = encryptState.ciphertext;
  const decryptState = sdesDecrypt(ciphertext, key10);
  const recovered = decryptState.ciphertext;

  const success =
    plaintext.length === recovered.length &&
    plaintext.every((b, i) => b === recovered[i]);

  return { encryptState, decryptState, plaintext, ciphertext, recovered, success };
}

// ─── Dataset Generation ───────────────────────────────────────

export interface SDESDatasetRow {
  plaintext: Bit[];
  ciphertext: Bit[];
  label: 0 | 1;
}

function randomBits(n: number): Bit[] {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0) as Bit);
}

export function generateSDESDataset(numSamples: number = 1000): SDESDatasetRow[] {
  const dataset: SDESDatasetRow[] = [];
  const halfSamples = Math.floor(numSamples / 2);
  const key10: Bit[] = [1, 0, 1, 0, 0, 0, 0, 0, 1, 0];

  // Valid ciphertext samples (label = 1)
  for (let i = 0; i < halfSamples; i++) {
    const p = randomBits(8) as Bit[];
    const { ciphertext } = sdesEncrypt(p, key10);
    dataset.push({ plaintext: p, ciphertext, label: 1 });
  }

  // Random noise samples (label = 0)
  for (let i = 0; i < numSamples - halfSamples; i++) {
    dataset.push({
      plaintext: randomBits(8) as Bit[],
      ciphertext: randomBits(8) as Bit[],
      label: 0,
    });
  }

  return dataset;
}

// ─── Default Values ───────────────────────────────────────────

export const DEFAULT_SDES_PLAINTEXT: Bit[] = [1, 0, 1, 1, 0, 1, 0, 0];
export const DEFAULT_SDES_KEY10: Bit[] = [1, 0, 1, 0, 0, 0, 0, 0, 1, 0];
