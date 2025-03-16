import requests
from urllib.parse import quote_plus
import os
import pathlib
from dotenv import load_dotenv
import xml.etree.ElementTree as ET

env_path = pathlib.Path('.env').absolute()
load_dotenv(dotenv_path=env_path, override=True)

class WolframService:
    def __init__(self):
        self.appid = os.getenv('WOLFRAM_APPID')
        if not self.appid:
            raise ValueError("WOLFRAM_APPID not found in environment variables!")
        self.base_url = "https://api.wolframalpha.com/v2/query"
    
    def verify_claim(self, query):
        """
        Query Wolfram Alpha Full Results API for the 'Result' pod in plaintext.
        Return that plaintext if found, else return an error or fallback message.
        """
        try:
            encoded_query = quote_plus(query)
            url = (
                f"{self.base_url}?appid={self.appid}"
                f"&input={encoded_query}"
                f"&includepodid=Result"
                f"&format=plaintext"
            )
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                result_pod = root.find(".//pod[@id='Result']")
                if result_pod is not None:
                    plaintext_elem = result_pod.find(".//plaintext")
                    if plaintext_elem is not None and plaintext_elem.text:
                        return plaintext_elem.text.strip()
                    else:
                        return "No plaintext result found."
                else:
                    return "No 'Result' pod found in the Wolfram Alpha response."
            else:
                return f"Error: WolframAlpha API returned status code {response.status_code}"
        except Exception as e:
            return f"Error during WolframAlpha query: {str(e)}"
