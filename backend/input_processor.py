# backend/input_processor.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv  # <--- NEW IMPORT

class InputProcessor:
    def __init__(self):
        # Load environment variables from .env file in root directory
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))  # Load from root
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            # Debugging help: Print where it's looking
            print("⚠️  Debug: Could not find API key.")
            print(f"   Current working directory: {os.getcwd()}")
            print(f"   Looking for .env file in: {os.path.join(os.path.dirname(__file__), '..', '.env')}")
            raise ValueError("OPENAI_API_KEY not found in environment variables or root .env file")
            
        self.client = OpenAI(api_key=self.api_key)

    def process_input(self, user_text):
        """
        Analyzes user text and extracts musical parameters.
        """
        system_prompt = """
        You are a music producer assistant. Extract the following JSON parameters from the user's request:
        - mood: (string) e.g., happy, sad, energetic, calm, dark
        - energy: (int) 1-10 scale (default 5)
        - style: (string) genre e.g., lo-fi, cinematic, rock, ambient
        - tempo: (string) slow, medium, fast (default medium)
        - instruments: (string) comma separated list
        - duration: (int) seconds (default 30, max 30)
        
        Return ONLY valid JSON.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            data = json.loads(response.choices[0].message.content)
            
            defaults = {
                "mood": "neutral", "energy": 5, "style": "general", 
                "tempo": "medium", "instruments": "synth", "duration": 30
            }
            
            final_params = {**defaults, **data}
            return final_params

        except Exception as e:
            print(f"❌ LLM Error: {e}. Using fallback.")
            return self._fallback_parsing(user_text)

    def _fallback_parsing(self, text):
        text = text.lower()
        mood = "happy" if "happy" in text else "neutral"
        if "sad" in text: mood = "sad"
        if "calm" in text: mood = "calm"
        
        return {
            "mood": mood,
            "energy": 5,
            "style": "acoustic",
            "tempo": "medium",
            "instruments": "piano",
            "duration": 30
        }