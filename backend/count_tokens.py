
import asyncio
from itertools import count
from google import genai

import PIL.Image
import sys
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()  # reads variables from a .env file and sets them in os.environ

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

# Configure your API key
client = genai.Client(api_key=GEMINI_API_KEY)

img = PIL.Image.open(sys.argv[1])

# Count tokens for the combined input
model_name = "gemini-2.5-flash" 

def count_tokens(): 
    prompt = f"""I will give you a description of clothing styles I'm looking for. Tell me if the image I attach fits the style."""
    response = client.models.count_tokens(model=model_name, contents=[prompt, img])
    print(response.total_tokens)


async def get_response(description: str):
    prompt = f"""I will give you a description of clothing styles I'm looking for. Tell me if the image I attach fits the style.
                Then give a score from 1-5 where 1 is no match at all and 5 is a perfect match. 
                Give your response in structured json with fields "comments" (string) and "score" (integer). 
                Description: {description}"""
    response = await client.aio.models.generate_content(
        model=model_name,
        contents=[prompt, img]
    )
    print(f"Total Tokens: {response.text}")

asyncio.run(get_response("baggy jeans, casual loose button shirt"))

