"""
FastAPI Backend for Blocrypt - Feistel Cipher ML Analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.model_selection import train_test_split

from ml_models import (
    prepare_data,
    train_naive_bayes,
    train_logistic_regression,
    evaluate_model
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
    model_type: str  # "nb" or "lr"
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
        
        if request.model_type not in ["nb", "lr"]:
            raise HTTPException(status_code=400, detail="Model type must be 'nb' or 'lr'")
        
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
        if request.model_type == "nb":
            model = train_naive_bayes(X_train, y_train)
        else:  # lr
            model = train_logistic_regression(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        metrics = evaluate_model(y_test, y_pred)
        
        return TrainingResponse(
            **metrics,
            test_samples=len(X_test),
            train_samples=len(X_train),
            model_type=request.model_type
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/train-batch")
async def train_batch(request: TrainingRequest):
    """
    Train both models and return comparison.
    """
    try:
        results = {}
        
        for model_type in ["nb", "lr"]:
            req = TrainingRequest(
                dataset=request.dataset,
                model_type=model_type,
                test_size=request.test_size
            )
            
            X, y = prepare_data([row.dict() for row in request.dataset])
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=request.test_size,
                random_state=42,
                stratify=y
            )
            
            if model_type == "nb":
                model = train_naive_bayes(X_train, y_train)
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
