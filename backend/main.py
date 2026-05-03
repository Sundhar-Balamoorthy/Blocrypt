"""
FastAPI Backend for Blocrypt - Feistel Cipher ML Analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.model_selection import train_test_split, cross_validate

from ml_models import (
    prepare_data,
    train_random_forest,
    train_logistic_regression,
    train_mlp,
    evaluate_model,
    train_regression_rf,
    train_regression_mlp,
    train_regression_svr,
    evaluate_regression,
    train_cipher_identifier,
    extract_statistical_features
)

# Initialize FastAPI app
app = FastAPI(
    title="Blocrypt ML API",
    description="Machine Learning APIs for Feistel Cipher Cryptanalysis",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Request/Response Models ====================

class DatasetRow(BaseModel):
    plaintext: List[int]
    ciphertext: List[int]
    label: int


class TrainingRequest(BaseModel):
    dataset: List[DatasetRow]
    model_type: str  # "rf", "lr", or "mlp"
    test_size: float = 0.2


class TrainingResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: dict
    test_samples: int
    train_samples: int
    model_type: str


class RegressionRow(BaseModel):
    plaintext: float  # Decimal value
    ciphertext: float # Decimal value


class RegressionRequest(BaseModel):
    dataset: List[RegressionRow]
    model_type: str  # "rf", "mlp", or "svr"
    test_size: float = 0.2


class RegressionResponse(BaseModel):
    mse: float
    mae: float
    r2: float
    cv_r2: float  # 5-fold cross-validation average R2
    test_samples: int
    train_samples: int
    model_type: str


class IdentificationRow(BaseModel):
    plaintext: List[int]
    ciphertext: List[int]


class IdentificationRequest(BaseModel):
    dataset: List[IdentificationRow]


class IdentificationResponse(BaseModel):
    prediction: str  # "Feistel", "S-DES", or "PRESENT"
    confidence: float


# ==================== Routes ====================

@app.get("/")
def root():
    return {"message": "API working"}
'''async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "Blocrypt ML API"}
'''

@app.post("/api/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    Train ML model on dataset.
    
    Args:
        dataset: List of data rows with plaintext, ciphertext, and label
        model_type: "nb" for Naive Bayes, "lr" for Logistic Regression
        test_size: Proportion of data for testing (0.0-1.0)
    
    Returns:
        Model evaluation metrics
    """
    try:
        # Validate input
        if not request.dataset:
            raise HTTPException(status_code=400, detail="Dataset is empty")
        
        if request.model_type not in ["rf", "lr", "mlp"]:
            raise HTTPException(status_code=400, detail="Model type must be 'rf', 'lr', or 'mlp'")
        
        if not (0.0 < request.test_size < 1.0):
            raise HTTPException(status_code=400, detail="test_size must be between 0 and 1")
        
        # Convert dataset to numpy arrays
        X, y = prepare_data([row.dict() for row in request.dataset])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=request.test_size,
            random_state=42,
            stratify=y
        )
        
        # Train model based on type
        if request.model_type == "rf":
            model = train_random_forest(X_train, y_train)
        elif request.model_type == "mlp":
            model = train_mlp(X_train, y_train)
        else:  # lr
            model = train_logistic_regression(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        metrics = evaluate_model(y_test, y_pred)
        
        return TrainingResponse(
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1=metrics["f1"],
            confusion_matrix=metrics["confusion_matrix"],
            test_samples=len(X_test),
            train_samples=len(X_train),
            model_type=request.model_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/train-regression", response_model=RegressionResponse)
async def train_regression(request: RegressionRequest):
    """
    Train regression model on decimal dataset.
    """
    try:
        if not request.dataset:
            raise HTTPException(status_code=400, detail="Dataset is empty")
        
        # Prepare data (for regression, we use the raw decimal values)
        # X is plaintext, y is ciphertext (or vice versa depending on request)
        X = np.array([[row.plaintext] for row in request.dataset])
        y = np.array([row.ciphertext for row in request.dataset])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=request.test_size,
            random_state=42
        )
        
        # Train model
        if request.model_type == "rf":
            model = train_regression_rf(X_train, y_train)
        elif request.model_type == "mlp":
            model = train_regression_mlp(X_train, y_train)
        else: # svr
            model = train_regression_svr(X_train, y_train)
        
        # 5-Fold Cross Validation for generalization check
        cv_results = cross_validate(model, X, y, cv=5, scoring='r2')
        cv_r2_avg = np.mean(cv_results['test_score'])
        
        # Evaluate
        y_pred = model.predict(X_test)
        metrics = evaluate_regression(y_test, y_pred)
        
        return RegressionResponse(
            mse=metrics["mse"],
            mae=metrics["mae"],
            r2=metrics["r2"],
            cv_r2=float(cv_r2_avg),
            test_samples=len(X_test),
            train_samples=len(X_train),
            model_type=request.model_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/train-batch")
async def train_batch(request: TrainingRequest):
    """
    Train both models and return comparison.
    """
    try:
        results = {}
        
        for model_type in ["rf", "lr"]:
            X, y = prepare_data([row.dict() for row in request.dataset])
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=request.test_size,
                random_state=42,
                stratify=y
            )
            
            if model_type == "rf":
                model = train_random_forest(X_train, y_train)
            elif model_type == "mlp":
                model = train_mlp(X_train, y_train)
            else:
                model = train_logistic_regression(X_train, y_train)
            
            y_pred = model.predict(X_test)
            metrics = evaluate_model(y_test, y_pred)
            
            results[model_type] = {
                **metrics,
                "test_samples": len(X_test),
                "train_samples": len(X_train)
            }
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
