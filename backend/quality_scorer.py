"""
Quality Scoring System for Generated Music
Evaluates audio quality, duration accuracy, silence detection, dynamic range, and frequency balance.
"""

import os
import numpy as np
import torch
import torchaudio
import librosa
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Import music generator
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from music_generator import MusicGenerator


class QualityScorer:
    """
    Comprehensive audio quality scoring system.
    
    Scoring Breakdown:
    - Audio Quality (25 points): Checks for clipping/distortion and proper volume levels
    - Duration Accuracy (15 points): Verifies audio matches requested duration (±2s tolerance)
    - Silence Detection (20 points): Ensures no long silent sections (>1s)
    - Dynamic Range (20 points): Measures variation in loudness (not flat/boring)
    - Frequency Balance (20 points): Checks spectral distribution across frequency bands
    
    Total: 100 points
    Minimum passing score: 65/100
    """
    
    def __init__(self, min_score: int = 65, max_retries: int = 2):
        self.min_score = min_score
        self.max_retries = max_retries
        
    def score_audio(self, audio_file: str, expected_params: Dict) -> Dict:
        """
        Score an audio file based on multiple quality metrics.
        
        Args:
            audio_file: Path to the audio file
            expected_params: Dictionary with 'duration', 'prompt', etc.
            
        Returns:
            Dictionary with individual scores and overall score
        """
        # Load audio
        waveform, sample_rate = torchaudio.load(audio_file)
        audio_np = waveform.numpy()[0]  # Convert to mono numpy array
        
        # Calculate individual scores
        scores = {
            'audio_quality': self._check_audio_quality(audio_np),
            'duration_accuracy': self._check_duration(audio_np, sample_rate, expected_params.get('duration', 10)),
            'silence_detection': self._check_silence(audio_np, sample_rate),
            'dynamic_range': self._check_dynamics(audio_np),
            'frequency_balance': self._check_frequency(audio_np, sample_rate)
        }
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(scores)
        scores['overall_score'] = overall_score
        
        return scores
    
    def _check_audio_quality(self, audio: np.ndarray) -> float:
        """
        Check for clipping and proper volume normalization.
        Max: 25 points
        """
        score = 25.0
        
        # Check for clipping (values at or near ±1.0)
        clipping_threshold = 0.99
        clipped_samples = np.sum(np.abs(audio) >= clipping_threshold)
        clipping_ratio = clipped_samples / len(audio)
        
        if clipping_ratio > 0.01:  # More than 1% clipped
            score -= 15
        elif clipping_ratio > 0.001:  # More than 0.1% clipped
            score -= 8
        
        # Check volume normalization
        rms = np.sqrt(np.mean(audio**2))
        if rms < 0.05:  # Too quiet
            score -= 10
        elif rms > 0.5:  # Too loud
            score -= 5
        
        return max(0, score)
    
    def _check_duration(self, audio: np.ndarray, sample_rate: int, expected_duration: float) -> float:
        """
        Check if duration matches expected (±2s tolerance).
        Max: 15 points
        """
        actual_duration = len(audio) / sample_rate
        duration_diff = abs(actual_duration - expected_duration)
        
        if duration_diff <= 2.0:
            return 15.0
        elif duration_diff <= 4.0:
            return 10.0
        elif duration_diff <= 6.0:
            return 5.0
        else:
            return 0.0
    
    def _check_silence(self, audio: np.ndarray, sample_rate: int) -> float:
        """
        Detect long silent sections (>1s).
        Max: 20 points
        """
        score = 20.0
        
        # Calculate RMS in windows
        window_size = int(0.1 * sample_rate)  # 100ms windows
        silence_threshold = 0.01
        
        silent_windows = 0
        for i in range(0, len(audio) - window_size, window_size):
            window = audio[i:i + window_size]
            rms = np.sqrt(np.mean(window**2))
            if rms < silence_threshold:
                silent_windows += 1
        
        # Check for consecutive silent windows (>1s = 10 windows)
        max_consecutive_silence = 0
        current_silence = 0
        
        for i in range(0, len(audio) - window_size, window_size):
            window = audio[i:i + window_size]
            rms = np.sqrt(np.mean(window**2))
            if rms < silence_threshold:
                current_silence += 1
                max_consecutive_silence = max(max_consecutive_silence, current_silence)
            else:
                current_silence = 0
        
        # Penalize based on longest silence
        if max_consecutive_silence > 10:  # >1s
            score -= min(20, (max_consecutive_silence - 10) * 2)
        
        return max(0, score)
    
    def _check_dynamics(self, audio: np.ndarray) -> float:
        """
        Check dynamic range - music should have variation, not be flat.
        Max: 20 points
        """
        # Calculate RMS in 0.5s windows
        sample_rate = 32000  # Assumed from MusicGen
        window_size = int(0.5 * sample_rate)
        
        rms_values = []
        for i in range(0, len(audio) - window_size, window_size // 2):
            window = audio[i:i + window_size]
            rms = np.sqrt(np.mean(window**2))
            rms_values.append(rms)
        
        if len(rms_values) < 2:
            return 10.0  # Not enough data
        
        rms_values = np.array(rms_values)
        
        # Calculate dynamic range in dB
        if np.max(rms_values) > 0 and np.min(rms_values) > 0:
            dynamic_range_db = 20 * np.log10(np.max(rms_values) / (np.min(rms_values) + 1e-10))
        else:
            dynamic_range_db = 0
        
        # Calculate variation (standard deviation)
        rms_std = np.std(rms_values)
        
        score = 0.0
        
        # Score based on dynamic range
        if dynamic_range_db > 20:
            score += 10
        elif dynamic_range_db > 10:
            score += 7
        elif dynamic_range_db > 5:
            score += 4
        
        # Score based on variation
        if rms_std > 0.05:
            score += 10
        elif rms_std > 0.02:
            score += 7
        elif rms_std > 0.01:
            score += 4
        
        return min(20, score)
    
    def _check_frequency(self, audio: np.ndarray, sample_rate: int) -> float:
        """
        Check frequency balance across spectrum.
        Max: 20 points
        """
        # Compute spectrogram
        n_fft = 2048
        hop_length = 512
        
        # Use librosa for spectral analysis
        S = np.abs(librosa.stft(audio, n_fft=n_fft, hop_length=hop_length))
        
        # Divide into frequency bands
        freq_bins = librosa.fft_frequencies(sr=sample_rate, n_fft=n_fft)
        
        # Define bands: bass (20-250Hz), mid (250-2kHz), high (2k-8kHz)
        bass_mask = (freq_bins >= 20) & (freq_bins < 250)
        mid_mask = (freq_bins >= 250) & (freq_bins < 2000)
        high_mask = (freq_bins >= 2000) & (freq_bins < 8000)
        
        bass_energy = np.mean(S[bass_mask, :])
        mid_energy = np.mean(S[mid_mask, :])
        high_energy = np.mean(S[high_mask, :])
        
        total_energy = bass_energy + mid_energy + high_energy
        
        if total_energy == 0:
            return 0.0
        
        # Calculate balance
        bass_ratio = bass_energy / total_energy
        mid_ratio = mid_energy / total_energy
        high_ratio = high_energy / total_energy
        
        score = 20.0
        
        # Penalize if any band is too dominant or too weak
        if bass_ratio > 0.7 or bass_ratio < 0.1:
            score -= 7
        if mid_ratio > 0.7 or mid_ratio < 0.1:
            score -= 7
        if high_ratio > 0.7 or high_ratio < 0.05:
            score -= 7
        
        return max(0, score)
    
    def _calculate_overall_score(self, scores: Dict) -> float:
        """Calculate weighted overall score out of 100."""
        return sum([
            scores['audio_quality'],      # 25 points
            scores['duration_accuracy'],  # 15 points
            scores['silence_detection'],  # 20 points
            scores['dynamic_range'],      # 20 points
            scores['frequency_balance']   # 20 points
        ])
    
    def generate_with_quality_check(self, prompt: str, params: Dict, output_dir: str) -> Tuple[str, Dict, int]:
        """
        Generate music with automatic quality checking and retry.
        
        Returns:
            Tuple of (audio_file_path, scores, attempts)
        """
        generator = MusicGenerator()
        attempts = 0
        best_score = 0
        best_file = None
        best_scores = None
        
        for attempt in range(self.max_retries + 1):
            attempts += 1
            
            # Generate audio
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"attempt_{attempt}_{timestamp}.wav"
            filepath = os.path.join(output_dir, filename)
            
            # Generate music
            file_path, metadata = generator.generate(
                prompt=prompt,
                duration=params['duration'],
                output_path=filepath,
                temperature=params.get('temperature', 1.0),
                top_k=params.get('top_k', 250),
                top_p=params.get('top_p', 0.0),
                cfg_coef=params.get('cfg_coef', 3.0)
            )
            
            # Check if generation failed
            if file_path is None:
                raise Exception("Music generation failed")
            
            # Score the audio
            scores = self.score_audio(filepath, params)
            
            # Keep track of best attempt
            if scores['overall_score'] > best_score:
                best_score = scores['overall_score']
                best_file = filepath
                best_scores = scores
            
            # Check if quality is acceptable
            if scores['overall_score'] >= self.min_score:
                # Clean up other attempts
                if filepath != best_file and os.path.exists(filepath):
                    os.remove(filepath)
                return best_file, best_scores, attempts
            
            print(f"  Attempt {attempts}: Score {scores['overall_score']:.1f}/100 (below threshold {self.min_score})")
        
        # Return best attempt even if below threshold
        print(f"  Max retries reached. Best score: {best_score:.1f}/100")
        return best_file, best_scores, attempts


def run_quality_evaluation():
    """
    Run quality scoring on 20 diverse samples and generate a report.
    """
    print("=" * 80)
    print("MUSIC GENERATION QUALITY SCORING SYSTEM")
    print("=" * 80)
    print()
    
    # Create output directory
    output_dir = "quality_test_samples"
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize scorer
    scorer = QualityScorer(min_score=65, max_retries=2)
    
    # Define diverse test prompts with varied parameters
    test_cases = [
        {"prompt": "upbeat electronic dance music with heavy bass", "temperature": 1.0, "top_k": 250, "cfg_coef": 3.0},
        {"prompt": "calm acoustic guitar melody", "temperature": 0.8, "top_k": 200, "cfg_coef": 4.0},
        {"prompt": "energetic rock guitar solo", "temperature": 1.2, "top_k": 300, "cfg_coef": 2.5},
        {"prompt": "smooth jazz piano with saxophone", "temperature": 0.9, "top_k": 220, "cfg_coef": 3.5},
        {"prompt": "ambient atmospheric soundscape", "temperature": 0.7, "top_k": 180, "cfg_coef": 4.5},
        {"prompt": "fast-paced drum and bass", "temperature": 1.1, "top_k": 280, "cfg_coef": 2.8},
        {"prompt": "classical orchestral strings", "temperature": 0.85, "top_k": 210, "cfg_coef": 3.8},
        {"prompt": "funky bass groove with drums", "temperature": 1.0, "top_k": 250, "cfg_coef": 3.2},
        {"prompt": "dark cinematic horror music", "temperature": 0.95, "top_k": 240, "cfg_coef": 3.3},
        {"prompt": "happy ukulele tropical vibes", "temperature": 0.9, "top_k": 230, "cfg_coef": 3.6},
        {"prompt": "aggressive metal guitar riffs", "temperature": 1.15, "top_k": 290, "cfg_coef": 2.6},
        {"prompt": "lo-fi hip hop beats to study", "temperature": 0.88, "top_k": 215, "cfg_coef": 3.7},
        {"prompt": "epic trailer music with orchestra", "temperature": 1.05, "top_k": 260, "cfg_coef": 3.1},
        {"prompt": "retro 80s synthwave", "temperature": 0.92, "top_k": 235, "cfg_coef": 3.4},
        {"prompt": "country folk acoustic", "temperature": 0.82, "top_k": 205, "cfg_coef": 3.9},
        {"prompt": "techno club banger", "temperature": 1.08, "top_k": 270, "cfg_coef": 2.9},
        {"prompt": "peaceful meditation music", "temperature": 0.75, "top_k": 190, "cfg_coef": 4.2},
        {"prompt": "latin salsa dance rhythm", "temperature": 0.98, "top_k": 245, "cfg_coef": 3.25},
        {"prompt": "blues guitar with harmonica", "temperature": 0.87, "top_k": 225, "cfg_coef": 3.65},
        {"prompt": "futuristic sci-fi electronic", "temperature": 1.03, "top_k": 255, "cfg_coef": 3.15}
    ]
    
    # Results storage
    results = []
    
    print(f"Generating and scoring {len(test_cases)} samples...")
    print(f"Quality threshold: {scorer.min_score}/100")
    print(f"Max retries per sample: {scorer.max_retries}")
    print(f"Duration: 10 seconds (small model)")
    print()
    
    # Generate and score each sample
    for idx, test_case in enumerate(test_cases, 1):
        print(f"[{idx}/{len(test_cases)}] Generating: '{test_case['prompt']}'")
        
        params = {
            'duration': 10,
            'temperature': test_case['temperature'],
            'top_k': test_case['top_k'],
            'cfg_coef': test_case['cfg_coef'],
            'prompt': test_case['prompt']
        }
        
        try:
            # Generate with quality check
            audio_file, scores, attempts = scorer.generate_with_quality_check(
                prompt=test_case['prompt'],
                params=params,
                output_dir=output_dir
            )
            
            # Rename file to be more descriptive
            safe_prompt = "".join(c if c.isalnum() or c in (' ', '-') else '_' for c in test_case['prompt'])
            safe_prompt = safe_prompt.replace(' ', '_')[:50]
            new_filename = f"sample_{idx:02d}_{safe_prompt}.wav"
            new_filepath = os.path.join(output_dir, new_filename)
            
            if os.path.exists(audio_file):
                os.rename(audio_file, new_filepath)
                audio_file = new_filepath
            
            # Store results
            results.append({
                'sample_id': idx,
                'filename': new_filename,
                'prompt': test_case['prompt'],
                'temperature': test_case['temperature'],
                'top_k': test_case['top_k'],
                'cfg_coef': test_case['cfg_coef'],
                'audio_quality': scores['audio_quality'],
                'duration_accuracy': scores['duration_accuracy'],
                'silence_detection': scores['silence_detection'],
                'dynamic_range': scores['dynamic_range'],
                'frequency_balance': scores['frequency_balance'],
                'overall_score': scores['overall_score'],
                'attempts': attempts,
                'passed': scores['overall_score'] >= scorer.min_score
            })
            
            print(f"  ✓ Score: {scores['overall_score']:.1f}/100 | Attempts: {attempts}")
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            results.append({
                'sample_id': idx,
                'filename': 'FAILED',
                'prompt': test_case['prompt'],
                'temperature': test_case['temperature'],
                'top_k': test_case['top_k'],
                'cfg_coef': test_case['cfg_coef'],
                'audio_quality': 0,
                'duration_accuracy': 0,
                'silence_detection': 0,
                'dynamic_range': 0,
                'frequency_balance': 0,
                'overall_score': 0,
                'attempts': 1,
                'passed': False
            })
        
        print()
    
    # Save results to CSV
    csv_path = os.path.join(output_dir, f"quality_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['sample_id', 'filename', 'prompt', 'temperature', 'top_k', 'cfg_coef',
                     'audio_quality', 'duration_accuracy', 'silence_detection', 
                     'dynamic_range', 'frequency_balance', 'overall_score', 'attempts', 'passed']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    
    # Print summary report
    print("=" * 80)
    print("SCORING REPORT SUMMARY")
    print("=" * 80)
    print()
    
    successful = [r for r in results if r['filename'] != 'FAILED']
    passed = [r for r in successful if r['passed']]
    
    if successful:
        avg_score = np.mean([r['overall_score'] for r in successful])
        avg_attempts = np.mean([r['attempts'] for r in successful])
        
        print(f"Total Samples: {len(test_cases)}")
        print(f"Successful Generations: {len(successful)}")
        print(f"Passed Quality Threshold: {len(passed)} ({len(passed)/len(successful)*100:.1f}%)")
        print(f"Average Score: {avg_score:.1f}/100")
        print(f"Average Attempts: {avg_attempts:.1f}")
        print()
        
        print("Score Breakdown (Average):")
        print(f"  Audio Quality:      {np.mean([r['audio_quality'] for r in successful]):.1f}/25")
        print(f"  Duration Accuracy:  {np.mean([r['duration_accuracy'] for r in successful]):.1f}/15")
        print(f"  Silence Detection:  {np.mean([r['silence_detection'] for r in successful]):.1f}/20")
        print(f"  Dynamic Range:      {np.mean([r['dynamic_range'] for r in successful]):.1f}/20")
        print(f"  Frequency Balance:  {np.mean([r['frequency_balance'] for r in successful]):.1f}/20")
        print()
        
        print(f"Top 5 Scores:")
        top_5 = sorted(successful, key=lambda x: x['overall_score'], reverse=True)[:5]
        for i, r in enumerate(top_5, 1):
            print(f"  {i}. {r['overall_score']:.1f}/100 - {r['prompt'][:60]}")
        print()
        
        print(f"Bottom 5 Scores:")
        bottom_5 = sorted(successful, key=lambda x: x['overall_score'])[:5]
        for i, r in enumerate(bottom_5, 1):
            print(f"  {i}. {r['overall_score']:.1f}/100 - {r['prompt'][:60]}")
    
    print()
    print("=" * 80)
    print("QUALITY THRESHOLD CONFIGURATION")
    print("=" * 80)
    print()
    print(f"Minimum Passing Score: {scorer.min_score}/100")
    print(f"Maximum Retry Attempts: {scorer.max_retries}")
    print()
    print("Scoring Criteria:")
    print("  • Audio Quality (25 pts): Clipping detection, volume normalization")
    print("  • Duration Accuracy (15 pts): Matches requested duration ±2s")
    print("  • Silence Detection (20 pts): No long silent sections >1s")
    print("  • Dynamic Range (20 pts): Music has variation, not flat")
    print("  • Frequency Balance (20 pts): Balanced bass/mid/high frequencies")
    print()
    print(f"Results saved to: {csv_path}")
    print(f"Audio files saved to: {output_dir}/")
    print()


if __name__ == "__main__":
    run_quality_evaluation()
