# NutriProof Project

## Features/Workflow

- Utilizes GPT-4o to extract factual claims from input text
- Reformats claims into queries optimized for Wolfram Alpha
- Processes claims through Wolfram Alpha for mathematical/factual accuracy
- enerates JSON records of claims, verification steps, and results
- Maintains a timestamped history of all fact-checking operations



## Installation

### Backend Setup

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

```bash
python app.py
```

The server will start at `http://localhost:5000`.

## API Usage

### Fact-Check Endpoint

**URL**: `/api/fact-check`
**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "text": "The radius of the Earth is 6,371 kilometers. The speed of light is approximately 300,000 kilometers per second."
}
```

**Response**:
```json
[
  {
    "claim": "The radius of the Earth is 6,371 kilometers.",
    "wolfram_query": "What is the radius of the Earth in kilometers?",
    "wolfram_response": "Earth radius ≈ 6371 km",
    "verification": "True"
  },
  {
    "claim": "The speed of light is approximately 300,000 kilometers per second.",
    "wolfram_query": "What is the speed of light in kilometers per second?",
    "wolfram_response": "Speed of light = 299,792 km/s",
    "verification": "Approximately True"
  }
]
```

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:5000/api/fact-check \
  -H "Content-Type: application/json" \
  -d '{"text":"The radius of the Earth is 6,371 kilometers. The speed of light is approximately 300,000 kilometers per second."}'
```

### Using Python Requests

```python
import requests
import json

url = "http://localhost:5000/api/fact-check"
payload = {
    "text": "The radius of the Earth is 6,371 kilometers. The speed of light is approximately 300,000 kilometers per second."
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())
```
