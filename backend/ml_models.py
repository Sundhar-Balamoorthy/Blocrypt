"""
Machine Learning Models for Feistel Cipher Analysis
Using optimized scikit-learn implementations
"""

import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import List, Tuple, Dict

def extract_statistical_features(bits: List[int]) -> List[float]:
    """
    Extract 5 statistical features from bit sequence.
    
    Features:
    1. Hamming weight (proportion of 1s)
    2. Alternating pattern distance
    3. Bit transition rate
    4. Shannon entropy
    5. Autocorrelation at lag 1
    """
    bits = np.array(bits)
    n = len(bits)
    features = []
    
    # Feature 1: Hamming weight
    hamming_weight = np.sum(bits) / n
    features.append(float(hamming_weight))
    
    # Feature 2: Alternating pattern distance
    alternating = np.array([(i % 2) for i in range(n)])
    alt_distance = np.sum(bits != alternating) / n
    features.append(float(alt_distance))
    
    # Feature 3: Transitions
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
    
    return features


def prepare_data(dataset: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
    """Convert dataset to feature matrix and labels."""
    X = []
    y = []
    
    for row in dataset:
        features = extract_statistical_features(row['ciphertext'])
        X.append(features)
        y.append(row['label'])
    
    return np.array(X), np.array(y)


def train_naive_bayes(X_train: np.ndarray, y_train: np.ndarray) -> GaussianNB:
    """Train Naive Bayes classifier."""
    model = GaussianNB()
    model.fit(X_train, y_train)
    return model


def train_logistic_regression(X_train: np.ndarray, y_train: np.ndarray) -> LogisticRegression:
    """Train Logistic Regression classifier with optimized parameters."""
    model = LogisticRegression(
        max_iter=1000,
        solver='lbfgs',
        random_state=42,
        C=1.0
    )
    model.fit(X_train, y_train)
    return model


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
