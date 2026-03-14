# backend/music_generator.py
import torch
import torchaudio
from audiocraft.models import MusicGen
from pydub import AudioSegment
import numpy as np
import os
import time
import json # New import for metadata

class MusicGenerator:
    _instance = None
    _model = None

    def __new__(cls):
        # Implements Singleton pattern to ensure only one instance (and one model load) exists.
        if cls._instance is None:
            cls._instance = super(MusicGenerator, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if MusicGenerator._model is None:
            print("⏳ Loading MusicGen Model (this takes a moment)...")
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            MusicGenerator._model = MusicGen.get_pretrained('facebook/musicgen-small', device=self.device)
            MusicGenerator._model.set_generation_params(duration=30) # Set default duration
            print(f"✅ Model Loaded on {self.device}.")

    def generate(self, prompt, duration=30, temperature=1.0, cfg_coef=3.0,
                 top_k=250, top_p=0.0, output_path="output.mp3"):
        """
        Generates music, applies post-processing, and returns file path and metadata.
        """
        model = MusicGenerator._model
        start_time = time.time()
        
        # 1. Configure Parameters
        model.set_generation_params(
            duration=duration, 
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            cfg_coef=cfg_coef
        )
        
        # 2. Generate (Returns Tensor: [1, 1, samples])
        print(f"🎹 Generating (T={temperature:.2f}, D={duration}s): {prompt}")
        try:
            wav_tensor = model.generate([prompt], progress=True)
        except Exception as e:
            # Simple error handling for generation failure
            print(f"❌ Generation Failed: {e}")
            return None, None # Return no file and no metadata

        # 3. Process to Pydub AudioSegment
        wav_cpu = wav_tensor[0].cpu().detach().numpy()
        
        # Convert float32 [-1, 1] to int16
        wav_int16 = (wav_cpu * 32767).astype(np.int16)
        
        audio_segment = AudioSegment(
            wav_int16.tobytes(), 
            frame_rate=32000, 
            sample_width=2, 
            channels=1 # Assuming mono output from musicgen-small
        )
        
        # 4. Post-Processing (Fade In/Out) - 1 second (1000ms)
        processed_audio = audio_segment.fade_in(1000).fade_out(1000)
        
        # 5. Save
        processed_audio.export(output_path, format="mp3")
        
        # 6. Metadata Capture
        generation_metadata = {
            "prompt": prompt,
            "model": "facebook/musicgen-small",
            "device_used": self.device,
            "duration_s": duration,
            "temperature": temperature,
            "cfg_coef": cfg_coef,
            "generation_time_s": round(time.time() - start_time, 2),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        if self.device == 'cuda':
            torch.cuda.empty_cache()
            
        return output_path, generation_metadata

# --- Deliverable Functions (Test Generations) ---

def run_test_generations():
    """Runs 15 diverse generations using predefined settings."""
    
    # 1. Load test settings (from configuration file)
    try:
        from .music_config import TEST_GENERATIONS # Assuming this is run from main_service
    except ImportError:
        # Fallback if run directly
        print("Falling back to internal test settings...")
        TEST_GENERATIONS = internal_test_settings 
    
    
    output_dir = "test_generations_1_5"
    os.makedirs(output_dir, exist_ok=True)
    
    generator = MusicGenerator()
    results = []

    print("\n--- Running 15 Test Generations ---")
    
    for i, test in enumerate(TEST_GENERATIONS):
        try:
            # Create a unique filename
            base_name = test['prompt'][:20].replace(' ', '_').replace(',', '')
            filename = f"{i+1}_{base_name}_{int(time.time())}.mp3"
            output_path = os.path.join(output_dir, filename)
            
            # Generate music
            file_path, metadata = generator.generate(
                prompt=test['prompt'],
                duration=test.get('duration', 20), # Use 20s for faster testing
                temperature=test.get('temperature', 1.0),
                cfg_coef=test.get('cfg_coef', 3.0),
                output_path=output_path
            )
            
            if metadata:
                results.append(metadata)
                print(f"   -> Success: {file_path}")

        except Exception as e:
            print(f"Test {i+1} failed: {e}")
    
    # Save all metadata to a summary file
    metadata_path = os.path.join(output_dir, "generation_summary.json")
    with open(metadata_path, 'w') as f:
        json.dump(results, f, indent=4)
        
    print(f"\n✅ All generation metadata saved to: {metadata_path}")
    print(f"✅ 15 Test generations complete. Find files in: {output_dir}")

# Internal Test Settings (Fallback)
internal_test_settings = [
    {'prompt': "upbeat happy pop music, major key, synth and bright drums", 'duration': 15, 'temperature': 1.1, 'cfg_coef': 5.0},
    {'prompt': "sad slow piano melody, minor key, reflective, light reverb", 'duration': 10, 'temperature': 0.8, 'cfg_coef': 3.0},
    {'prompt': "energetic electronic dance music, driving beat, powerful bassline", 'duration': 15, 'temperature': 1.2, 'cfg_coef': 6.0},
    {'prompt': "calm peaceful ambient sounds, smooth pads, no rhythm", 'duration': 20, 'temperature': 0.5, 'cfg_coef': 2.0},
    {'prompt': "romantic acoustic guitar, soft fingerpicking, gentle percussion", 'duration': 25, 'temperature': 0.9, 'cfg_coef': 3.5},
    {'prompt': "intense dramatic orchestral, loud brass, fast strings", 'duration': 20, 'temperature': 1.0, 'cfg_coef': 7.0},
    {'prompt': "groovy funk bass, tight drums, wah guitar, medium tempo", 'duration': 10, 'temperature': 1.1, 'cfg_coef': 4.0},
    {'prompt': "mysterious dark atmospheric, slow synth drone, unsettling mood", 'duration': 15, 'temperature': 0.7, 'cfg_coef': 3.0},
    {'prompt': "lo-fi hip hop beat, dusty vinyl crackle, rhodes piano", 'duration': 12, 'temperature': 1.0, 'cfg_coef': 3.0},
    {'prompt': "heavy metal riff, distorted guitar, double bass drum", 'duration': 15, 'temperature': 1.3, 'cfg_coef': 5.0},
    {'prompt': "8-bit chiptune background music, fast paced, arcade sound", 'duration': 20, 'temperature': 1.1, 'cfg_coef': 4.5},
    {'prompt': "smooth jazz saxophone solo, relaxed beat, walking bass", 'duration': 15, 'temperature': 0.9, 'cfg_coef': 2.5},
    {'prompt': "children's cartoon music, whimsical, bouncy rhythm", 'duration': 10, 'temperature': 1.2, 'cfg_coef': 5.0},
    {'prompt': "epic movie trailer score, crescendo and large percussion hits", 'duration': 10, 'temperature': 1.0, 'cfg_coef': 7.5},
    {'prompt': "minimal techno loop, repetitive kick drum, subtle filter sweep", 'duration': 15, 'temperature': 0.6, 'cfg_coef': 2.0},
]


if __name__ == "__main__":
    run_test_generations()