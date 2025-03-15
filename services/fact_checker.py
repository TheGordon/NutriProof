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
        1. Identify claims with GPT-4o
        2. Convert claims to Wolfram queries
        3. Verify claims with Wolfram Alpha
        4. Store results
        """
        # Step 1: Identify claims
        claims = self.openai_service.identify_claims(text)
        
        # Step 2 & 3: Process each claim and verify with Wolfram
        results = []
        for claim in claims:
            # Get Wolfram-optimized query for this claim
            wolfram_query = self.openai_service.optimize_for_wolfram(claim)
            
            # Get verification from Wolfram Alpha
            wolfram_response = self.wolfram_service.verify_claim(wolfram_query)
            
            # Use GPT to determine if claim is true based on Wolfram response
            verification = self.openai_service.interpret_verification(
                claim, 
                wolfram_query, 
                wolfram_response
            )
            
            # Store result
            result = {
                "claim": claim,
                "wolfram_query": wolfram_query,
                "wolfram_response": wolfram_response,
                "verification": verification
            }
            results.append(result)
        
        # Step 4: Store results
        self._store_results(results)
        
        return results
    
    def _store_results(self, results):
        """
        Store the results of fact-checking in a JSON file
        """
        # Create results directory if it doesn't exist
        os.makedirs('results', exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results/fact_check_{timestamp}.json"
        
        # Write results to file
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
            
        return filename 