import requests
import json

url = "http://localhost:8000/api/train"
data = {
    "dataset": [
        {"plaintext": [1,0,1,0,1,0,1,0], "ciphertext": [0,1,0,1,0,1,0,1], "label": 1},
        {"plaintext": [0,0,0,0,0,0,0,0], "ciphertext": [1,1,1,1,1,1,1,1], "label": 0},
        {"plaintext": [1,1,1,1,1,1,1,1], "ciphertext": [0,0,0,0,0,0,0,0], "label": 1},
        {"plaintext": [0,1,0,1,0,1,0,1], "ciphertext": [1,0,1,0,1,0,1,0], "label": 0},
    ] * 10,
    "model_type": "mlp",
    "test_size": 0.2
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Accuracy: {response.json()['accuracy']}")
    else:
        print(f"Error detail: {response.text}")
except Exception as e:
    print(f"Request error: {e}")
