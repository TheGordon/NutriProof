from .openai_service import OpenAIService
from .wolfram_service import WolframService
import json
import os
from datetime import datetime

class FactChecker:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.wolfram_service = WolframService()
    
    def process_text(self, text):
        """
        Process text through the fact-checking pipeline:
        1. Identify claims with GPT.
        2. Convert claims to Wolfram-optimized queries.
        3. Query Wolfram Alpha for verified info.
        4. Have GPT produce a final verdict & explanation that references the Wolfram data and the full context.
        5. Store results.
        """
        # Identify claims
        claims = self.openai_service.identify_claims(text)
        
        results = []
        for claim in claims:
            # Optimize claim for Wolfram
            wolfram_query = self.openai_service.optimize_for_wolfram(claim)
            # Retrieve verified info from Wolfram
            wolfram_response = self.wolfram_service.verify_claim(wolfram_query)
            # Generate final answer with verdict using full context (the original text)
            verdict, explanation = self.openai_service.generate_final_answer_with_verdict(claim, wolfram_query, wolfram_response, text)
            result = {
                "claim": claim,
                "wolfram_query": wolfram_query,
                "wolfram_response": wolfram_response,
                "verdict": verdict,
                "final_answer": explanation
            }
            results.append(result)
        
        self._store_results(results)
        return results
    
    def _store_results(self, results):
        os.makedirs('results', exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results/fact_check_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        return filename
