# debug_env.py
import os
from dotenv import load_dotenv
import pathlib

# Get absolute path to .env file
env_path = pathlib.Path('.env').absolute()
print(f"Looking for .env at: {env_path}")

# Force reload the .env file
load_dotenv(dotenv_path=env_path, override=True)

# Get environment variables
openai_key = os.getenv('OPENAI_API_KEY')
wolfram_key = os.getenv('WOLFRAM_APPID')

# Check if keys were found
if not openai_key:
    print("ERROR: OPENAI_API_KEY not found in environment!")
else:
    print(f"OpenAI Key (last 4 chars): ...{openai_key[-4:]}")

if not wolfram_key:
    print("ERROR: WOLFRAM_APPID not found in environment!")
else:
    print(f"Wolfram Key: {wolfram_key}")

# Also read the file directly to verify its contents
print("\nDirect contents of .env file:")
try:
    with open(env_path, 'r') as f:
        for line in f:
            # Only print keys partially to avoid exposing full keys
            if 'OPENAI_API_KEY=' in line:
                key_value = line.split('=')[1].strip()
                print(f"OPENAI_API_KEY=...{key_value[-4:]}")
            elif 'WOLFRAM_APPID=' in line:
                print(line.strip())
            elif line.strip() and not line.startswith('#'):
                print(line.strip())
except Exception as e:
    print(f"Error reading .env file: {e}")