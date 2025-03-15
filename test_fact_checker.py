#!/usr/bin/env python
"""
Test script for the GPT-4o & Wolfram Alpha Fact-Checking Assistant.
This script demonstrates how to use the fact checker directly without the API.
"""

from services.fact_checker import FactChecker
import json

def main():
    # Initialize the fact checker
    fact_checker = FactChecker()
    
    # Test text with factual claims
    test_text = """
    The Earth's equatorial radius is approximately 9,378 kilometers.
    The speed of light in a vacuum is exactly 299,792,458 meters per second.
    The gravitational acceleration on Earth is about 16.8 m/s².
    Icecream is amazing!
    The boiling point of water at standard atmospheric pressure is 100 degrees Celsius.
    The distance from Earth to the Moon is approximately 384,400 kilometers.
    """
    
    print("Starting fact-checking process...")
    print(f"Input text:\n{test_text}\n")
    
    # Run the fact-checking process
    results = fact_checker.process_text(test_text)
    
    # Display the results
    print("\nFact-Checking Results:")
    print("=====================")
    
    for i, result in enumerate(results, 1):
        print(f"\nClaim {i}: {result['claim']}")
        print(f"Wolfram Query: {result['wolfram_query']}")
        print(f"Wolfram Response: {result['wolfram_response']}")
        print(f"Verification: {result['verification']}")
        print("-" * 50)
    
    # Save the results to a JSON file
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to test_results.json")

if __name__ == "__main__":
    main() 