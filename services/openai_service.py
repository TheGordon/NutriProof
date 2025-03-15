from openai import OpenAI
import os
import pathlib
from dotenv import load_dotenv

# Get absolute path to .env file and force reload it
env_path = pathlib.Path('.env').absolute()
load_dotenv(dotenv_path=env_path, override=True)

class OpenAIService:
    def __init__(self):
        # Initialize OpenAI client with API key directly from environment
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables!")
            
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"
    
    def identify_claims(self, text):
        """
        Use GPT-4o to identify factual claims in the text that can be verified
        through Wolfram Alpha
        """
        prompt = f"""
        Analyze the following text and identify specific factual claims that can be 
        computationally verified using Wolfram Alpha. Focus on claims involving:
        - Mathematical calculations
        - Scientific constants
        - Geographic information
        - Historical dates
        - Physical measurements
        - Population statistics
        - Other factual, quantitative information
        
        Extract ONLY claims that can be verified through computation or factual lookup.
        Return only a JSON array of strings, with each string being a single claim.
        
        Text to analyze:
        {text}
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        import json
        try:
            # Try to parse the response as JSON and extract the claims array
            result = json.loads(content)
            if isinstance(result, dict) and "claims" in result:
                return result["claims"]
            else:
                # Fall back to returning the entire content if parsing fails
                return [claim for claim in content.strip('[]').split('","')]
        except:
            # If JSON parsing fails, fall back to the raw response (for debugging)
            return [content]
    
    def optimize_for_wolfram(self, claim):
        """
        Rephrase a claim into a query optimized for Wolfram Alpha
        """
        prompt = f"""
        Convert the following factual claim into a concise, clear query optimized for Wolfram Alpha.
        The query should be straightforward and directly solvable by Wolfram Alpha's computational engine.
        Return only the optimized query as plain text, without any explanations or additional formatting.
        
        Claim: {claim}
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content.strip()
    
    def interpret_verification(self, claim, wolfram_query, wolfram_response):
        """
        Interpret the Wolfram Alpha response to determine if the claim is true
        """
        prompt = f"""
        Based on the Wolfram Alpha response, determine whether the original claim is true, false, 
        or if the verification is inconclusive. Consider approximate values and reasonable margins of error.
        
        Original claim: {claim}
        Query sent to Wolfram Alpha: {wolfram_query}
        Wolfram Alpha response: {wolfram_response}
        
        Return ONLY one of these exact values: "True", "False", "Approximately True", "Approximately False", or "Inconclusive"
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        verification = response.choices[0].message.content.strip()
        
        # Normalize output to one of the expected values
        valid_outputs = ["True", "False", "Approximately True", "Approximately False", "Inconclusive"]
        if verification not in valid_outputs:
            # Try to match with the closest valid output
            for valid in valid_outputs:
                if valid.lower() in verification.lower():
                    return valid
            # Default to Inconclusive if no match
            return "Inconclusive"
            
        return verification 