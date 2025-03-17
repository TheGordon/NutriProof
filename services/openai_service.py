from openai import OpenAI
import os
import pathlib
from dotenv import load_dotenv
import json
import textwrap

env_path = pathlib.Path('.env').absolute()
load_dotenv(dotenv_path=env_path, override=True)

class OpenAIService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables!")
        self.client = OpenAI(api_key=api_key)
        self.model = "ft:gpt-4o-2024-08-06:personal::BBtUWaHi" # Fine-tuned model id
    
    def identify_claims(self, text):
        """
        Use GPT to identify factual claims in the text that can be verified via Wolfram Alpha.
        Returns a list of claim strings.
        """
        prompt = textwrap.dedent(f"""\
            Analyze the following text and identify specific factual claims that can be verified using information obtainable from the Wolfram Alpha API.
            Return ONLY a JSON array of string(s), each string being one verifiable claim. Make sure to capture the nuance of the claim(s) given the context of the ENTIRE selected text, for each claim. This is especially important for texts with nuanced meanings from sources like social media posts.

            Text to analyze:
            {text}
        """)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "claims" in data:
                return data["claims"]
            return [content]  # fallback
        except Exception:
            return [content]  # fallback
    
    def optimize_for_wolfram(self, claim):
        """
        Rephrase a claim into a concise query for Wolfram Alpha's Full Results API.
        """
        prompt = textwrap.dedent(f"""\
            Before completing the task below, keep in mind that you should focus on optimizing your query to have the highest chance of getting relevant information from Wolfram Alpha's API primarily for the following kinds of data: mathematical calculations, physical exercise, public health, blood alcohol content, nutrition, food preparation, food comparisons, dietary references, personal health, drugs and prescriptions, food compositions, child growth, US food prices, and food science—just know that whatever claim you may be creating a claim about will most likely have to do with one of those categories.
            Convert this claim into a concise query suitable for Wolfram Alpha's Full Results API:
            Claim: {claim}

            Return just the exact query text (IN PURE PLAINTEXT) and absolutely nothing else.
        """)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    
    def generate_final_answer_with_verdict(self, claim, wolfram_query, wolfram_response, context):
        """
        1. Compare the claim (and the full context) to the Wolfram response.
        2. Produce a short verdict: "True", "False", "Approximately True", "Approximately False", or "Inconclusive".
        3. Produce a longer explanation referencing the data from Wolfram and the overall context.

        Return (verdict, explanation).
        """
        # Check if Wolfram returned valid data
        wolfram_data_ok = True
        if ("No plaintext result found" in wolfram_response or
            "No 'Result' pod found" in wolfram_response or
            "Error:" in wolfram_response):
            wolfram_data_ok = False
        
        if wolfram_data_ok:
            prompt = textwrap.dedent(f"""\
                You are a fact-checking assistant, who must be capable of analyzing claims in text—especially more nuanced claims from sources like social media. Consider the following context and claim:
                Context: The text selected by the user was: {context}
                - Original claim (you may have to adjust this based on the full context): {claim}
                - Wolfram query: {wolfram_query}
                - Wolfram Alpha plaintext result: {wolfram_response}

                1) Decide if the claim is fully correct, partially correct, or incorrect based on the Wolfram data and the overall context.
                   - If numeric values or facts are close, it might be "True" or "Approximately True".
                   - If they differ significantly, "False" or "Approximately False".
                   - If data is missing or unclear, "Inconclusive".
                2) Provide a short verdict (choose one of "True", "False", "Approximately True", "Approximately False", or "Inconclusive").
                3) Provide a short but clear explanation referencing both the Wolfram data and the context.

                Return your answer as valid JSON in the format:
                {{
                  "verdict": "...",
                  "explanation": "..."
                }}
                Only output the JSON object, nothing else.
            """)
        else:
            prompt = textwrap.dedent(f"""\
                You are a fact-checking assistant, who must be capable of analyzing claims in text—especially more nuanced claims from sources like social media. Consider the following context and claim:
                Context: The text selected by the user was: {context}
                - Original claim (you may have to adjust this based on the full context): {claim}
                - Wolfram query: {wolfram_query}
                - Wolfram Alpha plaintext result: {wolfram_response} (which is not usable or missing)

                Since Wolfram data is unavailable or invalid, use your own reasoning along with the context provided to judge the claim.
                Provide:
                1) A short verdict (choose one of "True", "False", "Approximately True", "Approximately False", or "Inconclusive").
                2) A short explanation referencing the original claim and the context.
                
                Return your answer as valid JSON in the format:
                {{
                  "verdict": "...",
                  "explanation": "..."
                }}
                Only output the JSON object, nothing else.
            """)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        print(prompt)
        print("\n\n")
        raw_output = response.choices[0].message.content.strip()
        print(raw_output)
        # Removes any triple backticks or markdown formatting
        cleaned_output = raw_output.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(cleaned_output)
            verdict = parsed.get("verdict", "Inconclusive")
            explanation = parsed.get("explanation", "No explanation provided.")
        except Exception as e:
            verdict = "Inconclusive"
            explanation = f"Could not parse GPT response as JSON. Raw output:\n{raw_output}\nError: {str(e)}"
        return verdict, explanation

    def interpret_verification(self, claim, wolfram_query, wolfram_response):
        """
        Legacy method to interpret the Wolfram response. Not used if we rely on generate_final_answer_with_verdict.
        """
        prompt = textwrap.dedent(f"""\
            Based on the Wolfram Alpha response, determine whether the original claim is 
            "True", "False", "Approximately True", "Approximately False", or "Inconclusive".
            Original claim: {claim}
            Wolfram query: {wolfram_query}
            Wolfram response: {wolfram_response}
        """)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.choices[0].message.content.strip()
        valid = ["True", "False", "Approximately True", "Approximately False", "Inconclusive"]
        for v in valid:
            if v.lower() in text.lower():
                return v
        return "Inconclusive"
