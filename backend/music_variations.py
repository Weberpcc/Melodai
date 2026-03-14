"""
Music Variations Generator
Generates multiple variations of music with parameter tweaks and supports music continuation
"""

import torch
import torchaudio
import numpy as np
import os
import time
from audiocraft.models import MusicGen
from pydub import AudioSegment
from backend.music_generator import MusicGenerator


class MusicVariationGenerator:
    """Generates variations of music by tweaking generation parameters"""
    
    def __init__(self):
        self.generator = MusicGenerator()
        self.device = self.generator.device
        self.model = MusicGenerator._model
    
    def generate_variations(self, base_prompt, num_variations=3, duration=30, 
                          base_temperature=1.0, base_cfg=3.0, base_top_k=250, 
                          base_top_p=0.0, output_dir="generated_music"):
        """
        Generate multiple variations of the same prompt with parameter tweaks
        
        Args:
            base_prompt: The music description prompt
            num_variations: Number of variations to generate (default: 3)
            duration: Duration in seconds
            base_temperature: Base temperature value
            base_cfg: Base CFG coefficient
            base_top_k: Base top-k value
            base_top_p: Base top-p value
            output_dir: Directory to save variations
            
        Returns:
            List of dicts with file_path, metadata, and variation_params
        """
        print(f"\n🎨 Generating {num_variations} variations of: '{base_prompt}'")
        
        variations = []
        timestamp = int(time.time())
        
        # Define parameter variations
        variation_configs = self._create_variation_configs(
            num_variations, base_temperature, base_cfg, base_top_k, base_top_p
        )
        
        for i, config in enumerate(variation_configs):
            try:
                print(f"\n🎵 Variation {i+1}/{num_variations}")
                print(f"   Temperature: {config['temperature']:.2f}")
                print(f"   CFG Scale: {config['cfg_coef']:.2f}")
                print(f"   Top-K: {config['top_k']}")
                
                # Generate unique filename
                filename = f"variation_{timestamp}_{i+1}.mp3"
                file_path = os.path.join(output_dir, filename)
                
                # Generate music with varied parameters
                output_path, metadata = self.generator.generate(
                    prompt=base_prompt,
                    duration=duration,
                    temperature=config['temperature'],
                    cfg_coef=config['cfg_coef'],
                    top_k=config['top_k'],
                    top_p=config['top_p'],
                    output_path=file_path
                )
                
                if output_path and metadata:
                    variations.append({
                        'file_path': output_path,
                        'filename': filename,
                        'metadata': metadata,
                        'variation_number': i + 1,
                        'variation_params': config
                    })
                    print(f"   ✅ Saved: {filename}")
                else:
                    print(f"   ❌ Failed to generate variation {i+1}")
                    
            except Exception as e:
                print(f"   ❌ Error generating variation {i+1}: {e}")
                continue
        
        print(f"\n✅ Generated {len(variations)}/{num_variations} variations successfully")
        return variations
    
    def _create_variation_configs(self, num_variations, base_temp, base_cfg, base_top_k, base_top_p):
        """Create parameter configurations for variations"""
        configs = []
        
        if num_variations == 1:
            # Just use base parameters
            configs.append({
                'temperature': base_temp,
                'cfg_coef': base_cfg,
                'top_k': base_top_k,
                'top_p': base_top_p
            })
        elif num_variations == 2:
            # One more creative, one more conservative
            configs.append({
                'temperature': min(base_temp * 1.2, 2.0),
                'cfg_coef': base_cfg * 1.2,
                'top_k': base_top_k,
                'top_p': base_top_p
            })
            configs.append({
                'temperature': max(base_temp * 0.8, 0.5),
                'cfg_coef': base_cfg * 0.8,
                'top_k': base_top_k,
                'top_p': base_top_p
            })
        else:
            # Three or more variations with diverse parameters
            for i in range(num_variations):
                if i == 0:
                    # Base parameters
                    temp_mult = 1.0
                    cfg_mult = 1.0
                elif i == 1:
                    # More creative
                    temp_mult = 1.3
                    cfg_mult = 1.2
                elif i == 2:
                    # More conservative
                    temp_mult = 0.7
                    cfg_mult = 0.8
                else:
                    # Random variations
                    temp_mult = 0.8 + (i * 0.15)
                    cfg_mult = 0.9 + (i * 0.1)
                
                configs.append({
                    'temperature': np.clip(base_temp * temp_mult, 0.5, 2.0),
                    'cfg_coef': np.clip(base_cfg * cfg_mult, 1.0, 10.0),
                    'top_k': base_top_k,
                    'top_p': base_top_p
                })
        
        return configs
    
    def extend_music(self, original_audio_path, prompt, target_duration=60, 
                    temperature=1.0, cfg_coef=3.0, top_k=250, top_p=0.0,
                    output_dir="generated_music"):
        """
        Extend existing music by generating continuation
        
        Args:
            original_audio_path: Path to the original audio file
            prompt: The music description prompt
            target_duration: Target total duration in seconds
            temperature, cfg_coef, top_k, top_p: Generation parameters
            output_dir: Directory to save extended music
            
        Returns:
            Dict with file_path and metadata
        """
        print(f"\n🔄 Extending music from: {original_audio_path}")
        print(f"   Target duration: {target_duration}s")
        
        try:
            # Load original audio
            original_audio = AudioSegment.from_file(original_audio_path)
            original_duration = len(original_audio) / 1000  # Convert to seconds
            
            print(f"   Original duration: {original_duration:.1f}s")
            
            if original_duration >= target_duration:
                print(f"   ⚠️ Original is already {original_duration:.1f}s, no extension needed")
                return {
                    'file_path': original_audio_path,
                    'extended': False,
                    'message': 'No extension needed'
                }
            
            # Calculate extension duration needed
            extension_duration = target_duration - original_duration
            print(f"   Generating {extension_duration:.1f}s extension...")
            
            # Generate continuation with same prompt
            timestamp = int(time.time())
            temp_filename = f"temp_extension_{timestamp}.mp3"
            temp_path = os.path.join(output_dir, temp_filename)
            
            extension_path, metadata = self.generator.generate(
                prompt=prompt,
                duration=int(extension_duration),
                temperature=temperature,
                cfg_coef=cfg_coef,
                top_k=top_k,
                top_p=top_p,
                output_path=temp_path
            )
            
            if not extension_path:
                raise Exception("Failed to generate extension")
            
            # Load extension audio
            extension_audio = AudioSegment.from_file(extension_path)
            
            # Crossfade the two segments (2 second crossfade)
            crossfade_duration = 2000  # 2 seconds in milliseconds
            extended_audio = original_audio.append(extension_audio, crossfade=crossfade_duration)
            
            # Save extended version
            extended_filename = f"extended_{timestamp}.mp3"
            extended_path = os.path.join(output_dir, extended_filename)
            extended_audio.export(extended_path, format="mp3")
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            print(f"   ✅ Extended music saved: {extended_filename}")
            print(f"   Final duration: {len(extended_audio) / 1000:.1f}s")
            
            return {
                'file_path': extended_path,
                'filename': extended_filename,
                'extended': True,
                'original_duration': original_duration,
                'final_duration': len(extended_audio) / 1000,
                'metadata': metadata
            }
            
        except Exception as e:
            print(f"   ❌ Error extending music: {e}")
            return {
                'error': str(e),
                'extended': False
            }


def generate_variations(base_prompt, num_variations=3, duration=30, 
                       temperature=1.0, cfg_scale=3.0, top_k=250, top_p=0.0,
                       output_dir="generated_music"):
    """
    Convenience function to generate variations
    Returns list of audio file paths and metadata
    """
    generator = MusicVariationGenerator()
    return generator.generate_variations(
        base_prompt=base_prompt,
        num_variations=num_variations,
        duration=duration,
        base_temperature=temperature,
        base_cfg=cfg_scale,
        base_top_k=top_k,
        base_top_p=top_p,
        output_dir=output_dir
    )


# Test function
if __name__ == "__main__":
    print("🧪 Testing Music Variation Generator")
    
    # Test variations
    test_prompt = "upbeat electronic dance music with energetic beats"
    variations = generate_variations(
        base_prompt=test_prompt,
        num_variations=3,
        duration=15,
        temperature=1.0,
        cfg_scale=3.0
    )
    
    print(f"\n✅ Generated {len(variations)} variations")
    for var in variations:
        print(f"   - {var['filename']}")
