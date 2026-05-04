"""
Machine Learning Models for Feistel Cipher Analysis
Using optimized scikit-learn implementations
"""

import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    mean_squared_error, mean_absolute_error, r2_score
)
from typing import List, Tuple, Dict, Optional

scaler = StandardScaler()


def bigram_features(bits: np.ndarray) -> List[float]:
    """Compute bigram frequencies (00,01,10,11)."""
    if len(bits) < 2:
        return [0, 0, 0, 0]

    pairs = bits[:-1] * 2 + bits[1:]

    counts = [
        np.sum(pairs == 0),  # 00
        np.sum(pairs == 1),  # 01
        np.sum(pairs == 2),  # 10
        np.sum(pairs == 3)   # 11
    ]

    total = len(pairs)
    return [c / total for c in counts]


def run_length_features(bits: np.ndarray) -> List[float]:
    """Compute run-length statistics."""
    runs = []
    current_run = 1

    for i in range(1, len(bits)):
        if bits[i] == bits[i - 1]:
            current_run += 1
        else:
            runs.append(current_run)
            current_run = 1

    runs.append(current_run)

    longest_run = max(runs)
    avg_run = np.mean(runs)
    run_count = len(runs)

    return [longest_run, avg_run, run_count]


def extract_statistical_features(ciphertext: List[int], plaintext: Optional[List[int]] = None) -> List[float]:
    """
    Extract statistical features from bit sequences.

    Features:
    1. Hamming weight (C)
    2. Alternating pattern distance (C)
    3. Bit transition rate (C)
    4. Shannon entropy (C)
    5. Autocorrelation (C)
    6–9. Bigram frequencies (C)
    10–12. Run-length features (C)
    13-15. Relationship features (if P is provided)
    """

    bits = np.array(ciphertext)
    n = len(bits)
    features = []

    # Feature 1: Hamming weight
    hamming_weight = np.sum(bits) / n
    features.append(float(hamming_weight))

    # Feature 2: Alternating distance
    alternating = np.array([(i % 2) for i in range(n)])
    alt_distance = np.sum(bits != alternating) / n
    features.append(float(alt_distance))

    # Feature 3: Transition rate
    transitions = np.sum(bits[:-1] != bits[1:]) / (n - 1) if n > 1 else 0
    features.append(float(transitions))

    # Feature 4: Entropy
    zeros = np.sum(bits == 0)
    ones = n - zeros
    p0 = zeros / n
    p1 = ones / n

    entropy = 0.0
    if p0 > 0:
        entropy -= p0 * np.log2(p0)
    if p1 > 0:
        entropy -= p1 * np.log2(p1)

    features.append(float(entropy))

    # Feature 5: Autocorrelation
    autocorr = np.mean(bits[:-1] == bits[1:]) if n > 1 else 0
    features.append(float(autocorr))

    # Feature 6–9: Bigram frequencies
    features.extend(bigram_features(bits))

    # Feature 10–12: Run length features
    features.extend(run_length_features(bits))

    # Feature 13-15: Relationship features (Plaintext vs Ciphertext)
    if plaintext is not None and len(plaintext) == n:
        p_bits = np.array(plaintext)
        
        # 13. Hamming Distance
        hamming_dist = np.sum(bits != p_bits) / n
        features.append(float(hamming_dist))
        
        # 14. XOR Hamming Weight (P XOR C)
        xor_weight = np.sum(bits ^ p_bits) / n
        features.append(float(xor_weight))
        
        # 15. Bit-wise Correlation
        correlation = np.corrcoef(bits, p_bits)[0, 1] if np.std(bits) > 0 and np.std(p_bits) > 0 else 0
        features.append(float(correlation))
    else:
        # Padding for consistency if P is not provided
        features.extend([0.0, 0.0, 0.0])

    return features


def prepare_data(dataset: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
    """Convert dataset to feature matrix and labels."""
    X = []
    y = []

    for row in dataset:
        features = extract_statistical_features(
            row['ciphertext'], 
            row.get('plaintext')
        )
        X.append(features)
        y.append(row['label'])

    X = np.array(X)
    y = np.array(y)

    # Feature scaling
    X = scaler.fit_transform(X)

    return X, y


def train_naive_bayes(X_train: np.ndarray, y_train: np.ndarray) -> GaussianNB:
    """Train Naive Bayes classifier."""
    model = GaussianNB()
    model.fit(X_train, y_train)
    return model


def train_logistic_regression(X_train: np.ndarray, y_train: np.ndarray) -> LogisticRegression:
    """Train Logistic Regression classifier with optimized parameters."""
    model = LogisticRegression(
        max_iter=2000,
        solver='lbfgs',
        random_state=42,
        C=1.0,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)
    return model


def train_random_forest(X_train: np.ndarray, y_train: np.ndarray) -> RandomForestClassifier:
    """Train Random Forest classifier."""
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model


def train_mlp(X_train: np.ndarray, y_train: np.ndarray) -> MLPClassifier:
    """Train Multi-Layer Perceptron (Neural Network) classifier."""
    model = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation='relu',
        solver='adam',
        alpha=0.0001,
        batch_size='auto',
        learning_rate='constant',
        learning_rate_init=0.001,
        max_iter=1000,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1
    )
    model.fit(X_train, y_train)
    return model


def sample_confidence(model, X: np.ndarray) -> List[float]:
    """Return the model's confidence score for each sample."""
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)
        return np.max(probs, axis=1).astype(float).tolist()

    if hasattr(model, "decision_function"):
        scores = model.decision_function(X)
        if scores.ndim == 1:
            probs = 1 / (1 + np.exp(-scores))
            return np.maximum(probs, 1 - probs).astype(float).tolist()

        exp = np.exp(scores - np.max(scores, axis=1, keepdims=True))
        probs = exp / np.sum(exp, axis=1, keepdims=True)
        return np.max(probs, axis=1).astype(float).tolist()

    return [1.0 for _ in range(len(X))]


def compute_round_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    rounds: np.ndarray,
    confidences: Optional[np.ndarray] = None
) -> List[Dict]:
    """Compute evaluation metrics grouped by cipher round count."""
    metrics_by_round = []
    for round_value in np.unique(rounds):
        mask = rounds == round_value
        if np.sum(mask) == 0:
            continue

        group_metrics = evaluate_model(y_true[mask], y_pred[mask])
        metrics_by_round.append({
            "rounds": int(round_value),
            "accuracy": float(group_metrics["accuracy"]),
            "precision": float(group_metrics["precision"]),
            "recall": float(group_metrics["recall"]),
            "f1": float(group_metrics["f1"]),
            "test_samples": int(np.sum(mask)),
            "avg_confidence": float(np.mean(confidences[mask])) if confidences is not None else 0.0
        })

    metrics_by_round.sort(key=lambda item: item["rounds"])
    return metrics_by_round


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """Compute comprehensive evaluation metrics."""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "confusion_matrix": {
            "tp": int(tp),
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn)
        }
    }


def train_regression_rf(X_train: np.ndarray, y_train: np.ndarray) -> RandomForestRegressor:
    """Train Random Forest Regressor."""
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model


def train_regression_mlp(X_train: np.ndarray, y_train: np.ndarray) -> MLPRegressor:
    """Train MLP Regressor."""
    # MLP with early_stopping needs a minimum amount of data for the validation split.
    # If the dataset is too small, we disable early_stopping to prevent errors.
    use_early_stopping = len(X_train) >= 20
    
    model = make_pipeline(
        StandardScaler(),
        MLPRegressor(
            hidden_layer_sizes=(100, 50),
            activation='relu',
            solver='adam',
            max_iter=2000,
            random_state=42,
            early_stopping=use_early_stopping,
            validation_fraction=0.1 if use_early_stopping else 0.0
        )
    )
    model.fit(X_train, y_train)
    return model


def train_regression_svr(X_train: np.ndarray, y_train: np.ndarray) -> SVR:
    """Train Support Vector Regressor (SVR)."""
    # Scale inputs; SVR is sensitive to input feature ranges.
    model = make_pipeline(
        StandardScaler(),
        SVR(kernel='rbf', C=100.0, epsilon=0.1)
    )
    model.fit(X_train, y_train)
    return model


def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """Compute regression metrics."""
    mse = mean_squared_error(y_true, y_pred)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    return {
        "mse": float(mse),
        "mae": float(mae),
        "r2": float(r2)
    }


def train_cipher_identifier(X_train: np.ndarray, y_train: np.ndarray) -> RandomForestClassifier:
    """
    Train a classifier to identify the algorithm (0: Feistel, 1: S-DES, 2: PRESENT).
    This uses the same statistical features extracted from (P, C) pairs.
    """
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model