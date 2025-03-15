import requests
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WolframService:
    def __init__(self):
        # Wolfram Alpha API key from environment
        self.appid = os.getenv('WOLFRAM_APPID')
        self.base_url = "https://api.wolframalpha.com/v1/result"
    
    def verify_claim(self, query):
        """
        Verify a claim by querying Wolfram Alpha
        
        Args:
            query (str): The query to send to Wolfram Alpha
            
        Returns:
            str: Wolfram Alpha's response
        """
        try:
            # Encode the query for URL
            encoded_query = quote_plus(query)
            
            # Build the full URL with parameters
            url = f"{self.base_url}?appid={self.appid}&i={encoded_query}"
            
            # Send the request to Wolfram Alpha
            response = requests.get(url, timeout=10)
            
            # Check if the request was successful
            if response.status_code == 200:
                return response.text
            else:
                # Try with the simpler API if the first attempt fails
                return self._fallback_verification(query)
                
        except Exception as e:
            # If there's an error, try with a different API endpoint
            return self._fallback_verification(query)
    
    def _fallback_verification(self, query):
        """
        Fallback method using a different Wolfram Alpha API endpoint
        """
        try:
            # Encode the query for URL
            encoded_query = quote_plus(query)
            
            # Use the spoken results API as an alternative
            url = f"https://api.wolframalpha.com/v1/spoken?appid={self.appid}&i={encoded_query}"
            
            # Send the request to Wolfram Alpha
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.text
            else:
                return f"Error: Unable to verify. Status code: {response.status_code}"
                
        except Exception as e:
            return f"Error: {str(e)}" 