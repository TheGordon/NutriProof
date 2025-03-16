from flask import Flask, request, jsonify
from flask_cors import CORS  # Add this line
import os
import json
from services.fact_checker import FactChecker

app = Flask(__name__)
CORS(app)  # Add this line to enable CORS
fact_checker = FactChecker()

@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "message": "GPT-4o & Wolfram Alpha Fact-Checking API is running"
    })

@app.route('/api/fact-check', methods=['POST'])
def fact_check():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing required 'text' field in request body"}), 400
            
        text = data['text']
        results = fact_checker.process_text(text)
        
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 