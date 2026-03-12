// ==========================================
// Machine Learning for Feistel Cipher Analysis
// ==========================================

export interface Bit {
  0: 0;
  1: 1;
}

export type BitValue = 0 | 1;

export interface DataPoint {
  features: number[];
  label: number;
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
}

// --- Simple Statistical Feature Extraction ---
export function extractStatisticalFeatures(bits: BitValue[]): number[] {
  const features: number[] = [];

  // Feature 1: Hamming weight (number of 1s)
  const hammingWeight = bits.filter((b) => b === 1).length;
  features.push(hammingWeight / bits.length);

  // Feature 2: Hamming distance from alternating pattern
  const alternating = Array.from({ length: bits.length }, (_, i) => (i % 2) as BitValue);
  const altDistance = bits.filter((b, i) => b !== alternating[i]).length;
  features.push(altDistance / bits.length);

  // Feature 3: Run length encoding (transitions)
  let transitions = 0;
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] !== bits[i - 1]) transitions++;
  }
  features.push(transitions / bits.length);

  // Feature 4: Entropy estimate
  const zeros = bits.filter((b) => b === 0).length;
  const ones = bits.length - zeros;
  const p0 = zeros / bits.length;
  const p1 = ones / bits.length;
  const entropy =
    -(p0 > 0 ? p0 * Math.log2(p0) : 0) - (p1 > 0 ? p1 * Math.log2(p1) : 0);
  features.push(entropy);

  // Feature 5: Autocorrelation at lag 1
  let autocorr = 0;
  for (let i = 1; i < bits.length; i++) {
    autocorr += bits[i] === bits[i - 1] ? 1 : -1;
  }
  features.push(autocorr / bits.length);

  return features;
}

// --- Naive Bayes Classifier ---
export class NaiveBayesClassifier {
  private classMeans: Map<number, number[]> = new Map();
  private classStds: Map<number, number[]> = new Map();
  private classPriors: Map<number, number> = new Map();
  private classes: number[] = [];

  fit(data: DataPoint[]): void {
    const grouped = new Map<number, number[][]>();

    // Group by class
    for (const point of data) {
      if (!grouped.has(point.label)) {
        grouped.set(point.label, []);
      }
      grouped.get(point.label)!.push(point.features);
    }

    const numFeatures = data[0].features.length;
    const totalSamples = data.length;

    // Calculate means and stds for each class
    for (const [label, samples] of grouped) {
      this.classes.push(label);

      // Calculate mean for each feature
      const means: number[] = Array(numFeatures).fill(0);
      for (const sample of samples) {
        for (let i = 0; i < numFeatures; i++) {
          means[i] += sample[i];
        }
      }
      for (let i = 0; i < numFeatures; i++) {
        means[i] /= samples.length;
      }

      // Calculate std for each feature
      const stds: number[] = Array(numFeatures).fill(0);
      for (const sample of samples) {
        for (let i = 0; i < numFeatures; i++) {
          stds[i] += Math.pow(sample[i] - means[i], 2);
        }
      }
      for (let i = 0; i < numFeatures; i++) {
        stds[i] = Math.sqrt(stds[i] / samples.length) + 1e-6; // avoid division by zero
      }

      this.classMeans.set(label, means);
      this.classStds.set(label, stds);
      this.classPriors.set(label, samples.length / totalSamples);
    }
  }

  predict(features: number[]): number {
    let bestLabel = this.classes[0];
    let bestScore = -Infinity;

    for (const label of this.classes) {
      const means = this.classMeans.get(label);
      const stds = this.classStds.get(label);
      const prior = this.classPriors.get(label);

      if (!means || !stds || !prior) continue;

      // Calculate Gaussian probability
      let logProb = Math.log(prior);
      for (let i = 0; i < features.length; i++) {
        const numerator = Math.pow(features[i] - means[i], 2);
        const denominator = 2 * Math.pow(stds[i], 2);
        const gaussianProb = Math.exp(-numerator / denominator) / (stds[i] * Math.sqrt(2 * Math.PI));
        logProb += Math.log(Math.max(gaussianProb, 1e-10));
      }

      if (logProb > bestScore) {
        bestScore = logProb;
        bestLabel = label;
      }
    }

    return bestLabel;
  }

  predictBatch(featuresList: number[][]): number[] {
    return featuresList.map((features) => this.predict(features));
  }
}

// --- Logistic Regression Classifier ---
export class LogisticRegressionClassifier {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private iterations: number = 1000;

  fit(data: DataPoint[]): void {
    const numFeatures = data[0]?.features.length || 0;
    this.weights = Array(numFeatures).fill(0);
    this.bias = 0;

    // Gradient descent optimization
    for (let iter = 0; iter < this.iterations; iter++) {
      for (const point of data) {
        // Calculate prediction
        let score = this.bias;
        for (let i = 0; i < numFeatures; i++) {
          score += this.weights[i] * point.features[i];
        }

        // Sigmoid function
        const prediction = 1 / (1 + Math.exp(-score));
        const error = prediction - point.label;

        // Update bias
        this.bias -= this.learningRate * error;

        // Update weights
        for (let i = 0; i < numFeatures; i++) {
          this.weights[i] -= this.learningRate * error * point.features[i];
        }
      }
    }
  }

  predict(features: number[]): number {
    let score = this.bias;
    for (let i = 0; i < features.length; i++) {
      score += this.weights[i] * features[i];
    }

    // Sigmoid function
    const probability = 1 / (1 + Math.exp(-Math.max(Math.min(score, 500), -500)));
    return probability >= 0.5 ? 1 : 0;
  }

  predictBatch(featuresList: number[][]): number[] {
    return featuresList.map((features) => this.predict(features));
  }
}

// --- Model Evaluation ---
export function evaluateModel(
  predictions: number[],
  actuals: number[]
): MLMetrics {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i];
    const actual = actuals[i];

    if (pred === 1 && actual === 1) tp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 1) fn++;
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp === 0 ? 0 : tp / (tp + fp);
  const recall = tp === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    accuracy,
    precision,
    recall,
    f1,
    confusionMatrix: { tp, tn, fp, fn },
  };
}

// --- Train-Test Split ---
export function trainTestSplit(
  data: DataPoint[],
  testSize: number = 0.2
): { train: DataPoint[]; test: DataPoint[] } {
  const splitIndex = Math.floor(data.length * (1 - testSize));
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return {
    train: shuffled.slice(0, splitIndex),
    test: shuffled.slice(splitIndex),
  };
}
