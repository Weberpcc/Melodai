# backend/main_service.py
import os
import time
import uuid
from backend.input_processor import InputProcessor
from backend.prompt_enhancer import PromptEnhancer
from backend.music_generator import MusicGenerator
from backend.cache_manager import CacheManager
from backend.progress_tracker import get_progress_tracker, GenerationStage

class MusicGenerationPipeline:
    def __init__(self):
        # Initialize components
        self.input_processor = InputProcessor()
        self.prompt_enhancer = PromptEnhancer()
        self.music_generator = MusicGenerator()
        self.cache_manager = CacheManager()
        
        # Create output folder in root directory
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.output_dir = os.path.join(root_dir, "generated_music")
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"📁 Output directory: {self.output_dir}")

    def run_pipeline(self, user_text, duration=30, temperature=1.0, cfg_scale=3.0, top_k=250, top_p=0.0, progress_callback=None):
        print(f"\n--- Starting Pipeline for: '{user_text}' ---")
        
        # Generate unique ID for this generation
        generation_id = str(uuid.uuid4())
        progress_tracker = get_progress_tracker()
        progress_tracker.start_generation(generation_id, progress_callback)
        
        try:
            # 1. Analyze Request
            print("🤖 1. Processing Input with LLM...")
            progress_tracker.update_progress(generation_id, GenerationStage.PROCESSING, 30, "Analyzing your request with AI...")
            params = self.input_processor.process_input(user_text)
            print(f"   -> Extracted Params: {params}")
            
            # 2. Create Optimized Prompt
            print("✨ 2. Enhancing Prompt...")
            progress_tracker.update_progress(generation_id, GenerationStage.ENHANCING, 50, "Optimizing prompt for best results...")
            enhanced_prompt = self.prompt_enhancer.enhance(params)
            print(f"   -> Final Prompt: {enhanced_prompt}")
            progress_tracker.update_progress(generation_id, GenerationStage.ENHANCING, 100, "Prompt optimization complete")
            
            # 3. Use provided temperature directly from frontend
            final_temp = temperature
            print(f"🌡️  Using temperature: {final_temp:.2f}")
            
            # --- CACHE CHECK ---
            generation_params = {
                "duration": duration,
                "temperature": final_temp,
                "cfg_scale": cfg_scale,
                "top_k": top_k,
                "top_p": top_p
            }
            
            cache_key = self.cache_manager.get_cache_key(user_text, generation_params)
            cached_result = self.cache_manager.get(cache_key)
            
            if cached_result:
                print("⚡ Cache HIT! Returning cached result.")
                progress_tracker.complete_generation(generation_id)
                return {
                    "status": "success",
                    "file_path": cached_result['file_path'],
                    "enhanced_prompt": enhanced_prompt,
                    "parameters": params,
                    "cached": True,
                    "generation_id": generation_id
                }
            # -------------------
        
            # 4. Generate Music
            timestamp = int(time.time())
            filename = f"gen_{timestamp}.mp3"
            file_path = os.path.join(self.output_dir, filename)
            
            print("🎵 3. Generating Audio...")
            progress_tracker.update_progress(generation_id, GenerationStage.GENERATING, 10, "Initializing music generation...")
            print(f"🎛️  Generator Parameters:")
            print(f"   Prompt: {enhanced_prompt}")
            print(f"   Duration: {duration}s")
            print(f"   Temperature: {final_temp:.2f}")
            print(f"   CFG Coefficient: {cfg_scale}")
            print(f"   Top-K: {top_k}")
            print(f"   Top-P: {top_p}")
            
            progress_tracker.update_progress(generation_id, GenerationStage.GENERATING, 30, "Creating your unique audio...")
            
            output_path, generation_metadata = self.music_generator.generate(
                prompt=enhanced_prompt,
                duration=duration,
                temperature=final_temp,
                cfg_coef=cfg_scale,
                top_k=top_k,
                top_p=top_p,
                output_path=file_path
            )
            
            progress_tracker.update_progress(generation_id, GenerationStage.GENERATING, 90, "Finalizing audio...")
            
            # --- CACHE SET ---
            if output_path:
                self.cache_manager.set(
                    cache_key, 
                    output_path, 
                    {
                        "prompt": enhanced_prompt,
                        "params": generation_params,
                        "user_input": user_text
                    }
                )
            # -----------------
            
            progress_tracker.complete_generation(generation_id)
            
            return {
                "status": "success",
                "file_path": output_path,
                "enhanced_prompt": enhanced_prompt,
                "parameters": params,
                "cached": False,
                "generation_id": generation_id
            }
        except Exception as e:
            progress_tracker.cleanup_generation(generation_id)
            raise e

# Test execution if run directly
if __name__ == "__main__":
    pipeline = MusicGenerationPipeline()
    
    test_inputs = [
        "I need upbeat music for a morning workout",
        "Something very sad and slow with piano"
    ]
    
    for input_text in test_inputs:
        result = pipeline.run_pipeline(input_text)
        print(f"✅ Result: {result['file_path']}\n")