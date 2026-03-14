"""
Multi-Model Manager for MusicGen
Supports multiple MusicGen model variants with automatic model selection and fallback mechanisms.
"""

import os
import time
import torch
from typing import Dict, Optional, List, Tuple
from audiocraft.models import MusicGen
import warnings
warnings.filterwarnings('ignore')


class ModelManager:
    """
    Manages multiple MusicGen models with intelligent selection and fallback.
    
    Supported Models:
    - musicgen-small (300M params) - Fast generation, good quality
    - musicgen-medium (1.5B params) - Balanced speed and quality  
    - musicgen-large (3.3B params) - Best quality, slower generation
    - musicgen-melody - Melody conditioning support
    """
    
    def __init__(self):
        self.models: Dict[str, MusicGen] = {}
        self.current_model: Optional[MusicGen] = None
        self.current_model_name: Optional[str] = None
        self.model_info = {
            'musicgen-small': {
                'params': '300M',
                'speed': 'Fast',
                'quality': 'Good',
                'memory_gb': 2,
                'max_duration': 120,
                'description': 'Fastest generation with good quality'
            },
            'musicgen-medium': {
                'params': '1.5B', 
                'speed': 'Balanced',
                'quality': 'Better',
                'memory_gb': 6,
                'max_duration': 90,
                'description': 'Balanced speed and quality'
            },
            'musicgen-large': {
                'params': '3.3B',
                'speed': 'Slow',
                'quality': 'Best',
                'memory_gb': 12,
                'max_duration': 60,
                'description': 'Best quality, slower generation'
            },
            'musicgen-melody': {
                'params': '1.5B',
                'speed': 'Balanced',
                'quality': 'Better',
                'memory_gb': 6,
                'max_duration': 90,
                'description': 'Melody conditioning support'
            }
        }
        
        print("🎵 ModelManager initialized")
        print(f"📊 Available models: {list(self.model_info.keys())}")
    
    def get_model_info(self, model_name: str) -> Dict:
        """Get information about a specific model."""
        return self.model_info.get(model_name, {})
    
    def list_available_models(self) -> List[Dict]:
        """List all available models with their information."""
        models = []
        for name, info in self.model_info.items():
            models.append({
                'name': name,
                'display_name': f"{name.replace('musicgen-', '').title()} ({info['params']})",
                **info
            })
        return models
    
    def estimate_generation_time(self, model_name: str, duration: int) -> float:
        """
        Estimate generation time based on model and duration.
        
        Args:
            model_name: Name of the model
            duration: Duration in seconds
            
        Returns:
            Estimated time in seconds
        """
        # Base generation times (seconds per second of audio)
        base_times = {
            'musicgen-small': 0.8,    # ~0.8s per 1s of audio
            'musicgen-medium': 1.5,   # ~1.5s per 1s of audio  
            'musicgen-large': 3.0,    # ~3.0s per 1s of audio
            'musicgen-melody': 1.6    # ~1.6s per 1s of audio
        }
        
        base_time = base_times.get(model_name, 1.5)
        
        # Add model loading time if not loaded
        loading_time = 0 if model_name in self.models else 15
        
        return (duration * base_time) + loading_time
    
    def select_optimal_model(self, duration: int, quality_preference: str = 'balanced', 
                           user_model: Optional[str] = None) -> str:
        """
        Automatically select the best model based on requirements.
        
        Args:
            duration: Requested duration in seconds
            quality_preference: 'fast', 'balanced', or 'quality'
            user_model: User-specified model (overrides automatic selection)
            
        Returns:
            Selected model name
        """
        if user_model and user_model in self.model_info:
            print(f"🎯 Using user-specified model: {user_model}")
            return user_model
        
        # Automatic selection logic
        if quality_preference == 'fast' or duration > 60:
            selected = 'musicgen-small'
            reason = "fast generation" if quality_preference == 'fast' else "long duration"
        elif quality_preference == 'quality' and duration <= 30:
            selected = 'musicgen-large'
            reason = "quality preference with short duration"
        else:
            selected = 'musicgen-medium'
            reason = "balanced speed and quality"
        
        print(f"🤖 Auto-selected {selected} for {reason}")
        return selected
    
    def load_model(self, model_name: str, force_reload: bool = False) -> bool:
        """
        Load a specific model into memory.
        
        Args:
            model_name: Name of the model to load
            force_reload: Force reload even if already loaded
            
        Returns:
            True if successful, False otherwise
        """
        if not force_reload and model_name in self.models:
            self.current_model = self.models[model_name]
            self.current_model_name = model_name
            print(f"✅ Model {model_name} already loaded")
            return True
        
        if model_name not in self.model_info:
            print(f"❌ Unknown model: {model_name}")
            return False
        
        try:
            print(f"📥 Loading model: {model_name}")
            print(f"   Parameters: {self.model_info[model_name]['params']}")
            print(f"   Memory: ~{self.model_info[model_name]['memory_gb']}GB")
            
            start_time = time.time()
            
            # Load the model
            model = MusicGen.get_pretrained(model_name)
            
            # Store in cache
            self.models[model_name] = model
            self.current_model = model
            self.current_model_name = model_name
            
            load_time = time.time() - start_time
            print(f"✅ Model {model_name} loaded in {load_time:.1f}s")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to load model {model_name}: {str(e)}")
            return False
    
    def unload_model(self, model_name: str) -> bool:
        """
        Unload a model from memory to free up resources.
        
        Args:
            model_name: Name of the model to unload
            
        Returns:
            True if successful, False otherwise
        """
        if model_name not in self.models:
            print(f"⚠️  Model {model_name} not loaded")
            return False
        
        try:
            # Clear from cache
            del self.models[model_name]
            
            # Clear current model if it was the unloaded one
            if self.current_model_name == model_name:
                self.current_model = None
                self.current_model_name = None
            
            # Force garbage collection
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            print(f"🗑️  Model {model_name} unloaded")
            return True
            
        except Exception as e:
            print(f"❌ Failed to unload model {model_name}: {str(e)}")
            return False
    
    def generate(self, prompt: str, duration: int, model_name: Optional[str] = None, 
                **generation_params) -> Tuple[Optional[torch.Tensor], Dict]:
        """
        Generate music using the specified or current model.
        
        Args:
            prompt: Text prompt for generation
            duration: Duration in seconds
            model_name: Specific model to use (optional)
            **generation_params: Additional generation parameters
            
        Returns:
            Tuple of (generated_audio_tensor, metadata)
        """
        # Determine which model to use
        if model_name:
            if not self.load_model(model_name):
                print(f"❌ Failed to load requested model {model_name}")
                return None, {'error': f'Failed to load model {model_name}'}
        elif not self.current_model:
            # Auto-select and load a model
            auto_model = self.select_optimal_model(duration)
            if not self.load_model(auto_model):
                print(f"❌ Failed to load auto-selected model {auto_model}")
                return None, {'error': f'Failed to load model {auto_model}'}
        
        if not self.current_model:
            return None, {'error': 'No model available'}
        
        try:
            print(f"🎵 Generating with {self.current_model_name}")
            print(f"   Prompt: {prompt}")
            print(f"   Duration: {duration}s")
            
            # Set generation parameters
            self.current_model.set_generation_params(
                duration=duration,
                **generation_params
            )
            
            # Generate
            start_time = time.time()
            with torch.no_grad():
                wav = self.current_model.generate([prompt])
            
            generation_time = time.time() - start_time
            
            metadata = {
                'model': self.current_model_name,
                'generation_time': generation_time,
                'duration': duration,
                'prompt': prompt,
                'parameters': generation_params
            }
            
            print(f"✅ Generation complete in {generation_time:.1f}s")
            
            return wav, metadata
            
        except Exception as e:
            print(f"❌ Generation failed: {str(e)}")
            return None, {'error': str(e)}
    
    def get_fallback_model(self, failed_model: str) -> Optional[str]:
        """
        Get a fallback model when the primary model fails.
        
        Args:
            failed_model: Name of the model that failed
            
        Returns:
            Name of fallback model or None
        """
        # Fallback hierarchy: large -> medium -> small
        fallback_chain = {
            'musicgen-large': 'musicgen-medium',
            'musicgen-medium': 'musicgen-small', 
            'musicgen-melody': 'musicgen-medium',
            'musicgen-small': None  # No fallback for small
        }
        
        fallback = fallback_chain.get(failed_model)
        if fallback:
            print(f"🔄 Falling back from {failed_model} to {fallback}")
        
        return fallback
    
    def generate_with_fallback(self, prompt: str, duration: int, 
                             preferred_model: str, **generation_params) -> Tuple[Optional[torch.Tensor], Dict]:
        """
        Generate music with automatic fallback to smaller models if needed.
        
        Args:
            prompt: Text prompt for generation
            duration: Duration in seconds
            preferred_model: Preferred model to try first
            **generation_params: Additional generation parameters
            
        Returns:
            Tuple of (generated_audio_tensor, metadata)
        """
        current_model = preferred_model
        attempts = []
        
        while current_model:
            print(f"🎯 Attempting generation with {current_model}")
            
            result, metadata = self.generate(
                prompt=prompt,
                duration=duration,
                model_name=current_model,
                **generation_params
            )
            
            attempts.append({
                'model': current_model,
                'success': result is not None,
                'error': metadata.get('error')
            })
            
            if result is not None:
                metadata['attempts'] = attempts
                metadata['final_model'] = current_model
                return result, metadata
            
            # Try fallback
            current_model = self.get_fallback_model(current_model)
        
        # All models failed
        print("❌ All models failed")
        return None, {
            'error': 'All models failed',
            'attempts': attempts
        }
    
    def benchmark_models(self, test_prompt: str = "upbeat electronic music", 
                        test_duration: int = 10) -> Dict:
        """
        Benchmark all available models for comparison.
        
        Args:
            test_prompt: Prompt to use for testing
            test_duration: Duration for test generation
            
        Returns:
            Dictionary with benchmark results
        """
        print("🏁 Starting model benchmark...")
        print(f"   Test prompt: {test_prompt}")
        print(f"   Test duration: {test_duration}s")
        
        results = {}
        
        for model_name in self.model_info.keys():
            print(f"\n📊 Benchmarking {model_name}...")
            
            try:
                # Load model
                load_start = time.time()
                if not self.load_model(model_name):
                    results[model_name] = {'error': 'Failed to load'}
                    continue
                load_time = time.time() - load_start
                
                # Generate
                gen_start = time.time()
                wav, metadata = self.generate(
                    prompt=test_prompt,
                    duration=test_duration,
                    model_name=model_name
                )
                gen_time = time.time() - gen_start
                
                if wav is not None:
                    results[model_name] = {
                        'load_time': load_time,
                        'generation_time': gen_time,
                        'total_time': load_time + gen_time,
                        'speed_ratio': test_duration / gen_time,
                        'success': True
                    }
                    print(f"   ✅ Success: {gen_time:.1f}s generation")
                else:
                    results[model_name] = {
                        'error': metadata.get('error', 'Unknown error'),
                        'success': False
                    }
                    print(f"   ❌ Failed: {metadata.get('error', 'Unknown error')}")
                
            except Exception as e:
                results[model_name] = {
                    'error': str(e),
                    'success': False
                }
                print(f"   ❌ Exception: {str(e)}")
        
        print("\n📈 Benchmark Results:")
        for model_name, result in results.items():
            if result.get('success'):
                print(f"   {model_name}: {result['generation_time']:.1f}s "
                      f"({result['speed_ratio']:.1f}x realtime)")
            else:
                print(f"   {model_name}: FAILED - {result.get('error', 'Unknown')}")
        
        return results
    
    def get_memory_usage(self) -> Dict:
        """Get current memory usage information."""
        usage = {
            'loaded_models': list(self.models.keys()),
            'current_model': self.current_model_name
        }
        
        if torch.cuda.is_available():
            usage['gpu_memory'] = {
                'allocated': torch.cuda.memory_allocated() / 1024**3,  # GB
                'reserved': torch.cuda.memory_reserved() / 1024**3,    # GB
                'max_allocated': torch.cuda.max_memory_allocated() / 1024**3  # GB
            }
        
        return usage
    
    def cleanup(self):
        """Clean up all loaded models and free memory."""
        print("🧹 Cleaning up models...")
        
        for model_name in list(self.models.keys()):
            self.unload_model(model_name)
        
        self.models.clear()
        self.current_model = None
        self.current_model_name = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("✅ Cleanup complete")


# Global model manager instance
model_manager = ModelManager()


def get_model_manager() -> ModelManager:
    """Get the global model manager instance."""
    return model_manager


if __name__ == "__main__":
    # Test the model manager
    manager = ModelManager()
    
    # List available models
    print("\n📋 Available Models:")
    for model in manager.list_available_models():
        print(f"   {model['display_name']}: {model['description']}")
    
    # Test model selection
    print(f"\n🎯 Auto-selection tests:")
    print(f"   Fast 30s: {manager.select_optimal_model(30, 'fast')}")
    print(f"   Quality 15s: {manager.select_optimal_model(15, 'quality')}")
    print(f"   Balanced 45s: {manager.select_optimal_model(45, 'balanced')}")
    print(f"   Long 90s: {manager.select_optimal_model(90, 'quality')}")
    
    # Test time estimation
    print(f"\n⏱️  Time estimates:")
    for model in ['musicgen-small', 'musicgen-medium', 'musicgen-large']:
        time_est = manager.estimate_generation_time(model, 30)
        print(f"   {model} (30s): ~{time_est:.1f}s")