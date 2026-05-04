import requests
import json

url = "http://localhost:8000/api/train"
data = {
    "dataset": [
        {"plaintext": [1,0,1,0,1,0,1,0], "ciphertext": [0,1,0,1,0,1,0,1], "label": 1, "rounds": 1},
        {"plaintext": [0,0,0,0,0,0,0,0], "ciphertext": [1,1,1,1,1,1,1,1], "label": 0, "rounds": 1},
        {"plaintext": [1,1,1,1,1,1,1,1], "ciphertext": [0,0,0,0,0,0,0,0], "label": 1, "rounds": 2},
        {"plaintext": [0,1,0,1,0,1,0,1], "ciphertext": [1,0,1,0,1,0,1,0], "label": 0, "rounds": 2},
    ] * 10,
    "model_type": "mlp",
    "test_size": 0.2
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        json_data = response.json()
        print(f"Success! Accuracy: {json_data['accuracy']}")
        if 'test_confidence_scores' in json_data:
            print(f"Sample confidence scores (first 5): {json_data['test_confidence_scores'][:5]}")
        if 'round_metrics' in json_data and json_data['round_metrics']:
            print("Round metrics:")
            for round_metric in json_data['round_metrics']:
                print(f"  rounds={round_metric['rounds']}, accuracy={round_metric['accuracy']:.3f}, avg_confidence={round_metric['avg_confidence']:.3f}")
    else:
        print(f"Error detail: {response.text}")
except Exception as e:
    print(f"Request error: {e}")
