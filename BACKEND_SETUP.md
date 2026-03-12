# FastAPI Backend Setup Guide

This guide explains how to set up and run the FastAPI backend for Blocrypt ML algorithms.

## Prerequisites

- Python 3.8 or higher
- pip package manager

## Installation Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
```

### 3. Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

## Running the Backend

### Option 1: Manual Start
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Using Startup Script (macOS/Linux)
```bash
chmod +x ../start-backend.sh
../start-backend.sh
```

The API will be available at: `http://localhost:8000`

### API Documentation
Once the server is running, visit:
- API Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## Configure Frontend

The frontend is already configured to use `http://localhost:8000` by default.

If you need to change the API URL, edit `.env.local` in the project root:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running Both Services

You'll need two terminal windows:

**Terminal 1: Backend**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload
```

**Terminal 2: Frontend**
```bash
npm run dev
```

Then open: `http://localhost:3000`

## Available Endpoints

### POST `/api/train`
Train a single model (Naive Bayes or Logistic Regression)

**Request:**
```json
{
  "dataset": [
    {
      "plaintext": [1, 0, 1, ...],
      "ciphertext": [0, 1, 0, ...],
      "label": 1
    }
  ],
  "model_type": "nb",
  "test_size": 0.2
}
```

**Response:**
```json
{
  "accuracy": 0.95,
  "precision": 0.94,
  "recall": 0.96,
  "f1": 0.95,
  "confusion_matrix": {
    "tp": 96,
    "tn": 90,
    "fp": 4,
    "fn": 10
  },
  "test_samples": 200,
  "train_samples": 800,
  "model_type": "nb"
}
```

### POST `/api/train-batch`
Train both models and return comparison

### GET `/health`
Health check endpoint

## Troubleshooting

### Port 8000 Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn main:app --reload --port 8001
```

### CORS Errors
Check that `NEXT_PUBLIC_API_URL` matches the backend URL in `.env.local`

### Import Errors
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

## Performance Notes

The backend uses scikit-learn's optimized implementations:
- **Naive Bayes**: Gaussian Naive Bayes classifier
- **Logistic Regression**: Optimized with L-BFGS solver

For datasets with 10,000+ samples, the API provides:
- Faster training vs JavaScript implementations
- Better numerical stability
- Support for larger datasets
- More advanced algorithm options in the future
