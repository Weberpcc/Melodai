"""
Advanced Audio Post-Processing Suite
Provides audio enhancement, effects, format conversion, and analysis tools.
"""

import numpy as np
import librosa
import soundfile as sf
from scipy import signal
from scipy.io import wavfile
import os
import json
import time
from typing import Dict, List, Tuple, Optional, Any
import tempfile
from pathlib import Path
import zipfile
from datetime import datetime

class AudioProcessor:
    """Advanced audio processing with effects, enhancement, and analysis."""
    
    def __init__(self):
        self.sample_rate = 32000  # Default sample rate for MusicGen
        self.supported_formats = ['wav', 'mp3', 'flac', 'ogg']
        self.effect_presets = {
            'studio': {
                'eq': {'low': 0, 'mid': 2, 'high': 1},
                'compression': {'threshold': -12, 'ratio': 3.0, 'attack': 0.003, 'release': 0.1},
                'reverb': {'room_size': 0.3, 'damping': 0.5, 'wet_level': 0.2},
                'limiter': {'threshold': -1.0, 'release': 0.05}
            },
            'concert_hall': {
                'eq': {'low': 1, 'mid': 0, 'high': 2},
                'compression': {'threshold': -18, 'ratio': 2.0, 'attack': 0.01, 'release': 0.2},
                'reverb': {'room_size': 0.8, 'damping': 0.3, 'wet_level': 0.4},
                'limiter': {'threshold': -2.0, 'release': 0.1}
            },
            'bedroom': {
                'eq': {'low': 2, 'mid': 1, 'high': -1},
                'compression': {'threshold': -8, 'ratio': 4.0, 'attack': 0.001, 'release': 0.05},
                'reverb': {'room_size': 0.2, 'damping': 0.7, 'wet_level': 0.1},
                'limiter': {'threshold': -0.5, 'release': 0.03}
            }
        }
    
    def enhance_audio(self, audio_file: str, effects: Dict[str, Any] = None) -> str:
        """
        Apply comprehensive audio enhancement to an audio file.
        
        Args:
            audio_file: Path to input audio file
            effects: Dictionary of effects to apply
            
        Returns:
            Path to enhanced audio file
        """
        # Load audio
        audio, sr = librosa.load(audio_file, sr=self.sample_rate)
        
        # Apply default enhancement if no effects specified
        if effects is None:
            effects = self.effect_presets['studio']
        
        # Apply effects in order
        enhanced_audio = audio.copy()
        
        # 1. Noise reduction
        enhanced_audio = self._noise_reduction(enhanced_audio)
        
        # 2. EQ adjustment
        if 'eq' in effects:
            enhanced_audio = self._apply_eq(enhanced_audio, effects['eq'])
        
        # 3. Compression
        if 'compression' in effects:
            enhanced_audio = self._apply_compression(enhanced_audio, effects['compression'])
        
        # 4. Reverb
        if 'reverb' in effects:
            enhanced_audio = self._apply_reverb(enhanced_audio, effects['reverb'])
        
        # 5. Stereo widening (if stereo)
        if 'stereo_width' in effects and len(enhanced_audio.shape) > 1:
            enhanced_audio = self._apply_stereo_widening(enhanced_audio, effects['stereo_width'])
        
        # 6. Limiter (final stage)
        if 'limiter' in effects:
            enhanced_audio = self._apply_limiter(enhanced_audio, effects['limiter'])
        
        # Save enhanced audio
        output_path = self._get_enhanced_filename(audio_file)
        sf.write(output_path, enhanced_audio, self.sample_rate)
        
        return output_path
    
    def _noise_reduction(self, audio: np.ndarray, noise_factor: float = 0.02) -> np.ndarray:
        """Apply spectral subtraction for noise reduction."""
        # Simple noise gate approach
        rms = np.sqrt(np.mean(audio**2))
        threshold = rms * noise_factor
        
        # Apply soft gating
        mask = np.abs(audio) > threshold
        gated_audio = audio * mask
        
        # Smooth transitions
        return self._smooth_audio(gated_audio, audio, 0.1)
    
    def _apply_eq(self, audio: np.ndarray, eq_settings: Dict[str, float]) -> np.ndarray:
        """Apply 3-band EQ (low, mid, high)."""
        # Define frequency bands
        low_freq = 200
        high_freq = 4000
        
        # Create filters
        nyquist = self.sample_rate / 2
        
        # Low band (below 200Hz)
        low_sos = signal.butter(4, low_freq/nyquist, btype='low', output='sos')
        low_band = signal.sosfilt(low_sos, audio)
        
        # High band (above 4kHz)
        high_sos = signal.butter(4, high_freq/nyquist, btype='high', output='sos')
        high_band = signal.sosfilt(high_sos, audio)
        
        # Mid band (200Hz - 4kHz)
        mid_sos = signal.butter(4, [low_freq/nyquist, high_freq/nyquist], btype='band', output='sos')
        mid_band = signal.sosfilt(mid_sos, audio)
        
        # Apply gains (convert dB to linear)
        low_gain = 10**(eq_settings.get('low', 0) / 20)
        mid_gain = 10**(eq_settings.get('mid', 0) / 20)
        high_gain = 10**(eq_settings.get('high', 0) / 20)
        
        # Combine bands
        eq_audio = (low_band * low_gain + 
                   mid_band * mid_gain + 
                   high_band * high_gain)
        
        return eq_audio
    
    def _apply_compression(self, audio: np.ndarray, comp_settings: Dict[str, float]) -> np.ndarray:
        """Apply dynamic range compression."""
        threshold = comp_settings.get('threshold', -12)  # dB
        ratio = comp_settings.get('ratio', 3.0)
        attack = comp_settings.get('attack', 0.003)  # seconds
        release = comp_settings.get('release', 0.1)  # seconds
        
        # Convert threshold to linear
        threshold_linear = 10**(threshold / 20)
        
        # Calculate envelope
        envelope = np.abs(audio)
        
        # Smooth envelope (attack/release)
        attack_samples = int(attack * self.sample_rate)
        release_samples = int(release * self.sample_rate)
        
        smoothed_envelope = self._envelope_follower(envelope, attack_samples, release_samples)
        
        # Calculate gain reduction
        gain_reduction = np.ones_like(smoothed_envelope)
        over_threshold = smoothed_envelope > threshold_linear
        
        if np.any(over_threshold):
            excess = smoothed_envelope[over_threshold] / threshold_linear
            compressed_excess = np.power(excess, 1/ratio)
            gain_reduction[over_threshold] = compressed_excess * threshold_linear / smoothed_envelope[over_threshold]
        
        return audio * gain_reduction
    
    def _apply_reverb(self, audio: np.ndarray, reverb_settings: Dict[str, float]) -> np.ndarray:
        """Apply algorithmic reverb effect."""
        room_size = reverb_settings.get('room_size', 0.5)
        damping = reverb_settings.get('damping', 0.5)
        wet_level = reverb_settings.get('wet_level', 0.3)
        
        # Create impulse response for reverb
        reverb_length = int(room_size * self.sample_rate * 2)  # Up to 2 seconds
        
        # Generate exponentially decaying noise as impulse response
        t = np.arange(reverb_length) / self.sample_rate
        decay = np.exp(-t * (5 + damping * 10))  # Decay rate based on damping
        
        # Add some randomness for natural sound
        np.random.seed(42)  # Consistent reverb
        impulse = np.random.randn(reverb_length) * decay
        
        # Apply low-pass filter for damping
        if damping > 0:
            cutoff = (1 - damping) * 0.4 + 0.1  # 0.1 to 0.5 normalized frequency
            b, a = signal.butter(2, cutoff, btype='low')
            impulse = signal.filtfilt(b, a, impulse)
        
        # Convolve with audio
        reverb_audio = signal.convolve(audio, impulse, mode='same')
        
        # Mix wet and dry signals
        return audio * (1 - wet_level) + reverb_audio * wet_level
    
    def _apply_stereo_widening(self, audio: np.ndarray, width: float) -> np.ndarray:
        """Apply stereo widening effect (for stereo audio)."""
        if len(audio.shape) == 1:
            return audio  # Mono audio, no widening possible
        
        # Mid-side processing
        mid = (audio[0] + audio[1]) / 2
        side = (audio[0] - audio[1]) / 2
        
        # Widen by increasing side signal
        side_widened = side * (1 + width)
        
        # Convert back to left-right
        left = mid + side_widened
        right = mid - side_widened
        
        return np.array([left, right])
    
    def _apply_limiter(self, audio: np.ndarray, limiter_settings: Dict[str, float]) -> np.ndarray:
        """Apply brick-wall limiter to prevent clipping."""
        threshold = limiter_settings.get('threshold', -1.0)  # dB
        release = limiter_settings.get('release', 0.05)  # seconds
        
        # Convert threshold to linear
        threshold_linear = 10**(threshold / 20)
        
        # Find peaks above threshold
        envelope = np.abs(audio)
        release_samples = int(release * self.sample_rate)
        
        # Calculate gain reduction
        gain_reduction = np.ones_like(envelope)
        
        for i in range(len(envelope)):
            if envelope[i] > threshold_linear:
                # Calculate required gain reduction
                required_reduction = threshold_linear / envelope[i]
                gain_reduction[i] = required_reduction
                
                # Apply release
                for j in range(1, min(release_samples, len(envelope) - i)):
                    release_factor = j / release_samples
                    current_reduction = required_reduction + (1 - required_reduction) * release_factor
                    gain_reduction[i + j] = min(gain_reduction[i + j], current_reduction)
        
        return audio * gain_reduction

    
    def _envelope_follower(self, signal: np.ndarray, attack_samples: int, release_samples: int) -> np.ndarray:
        """Follow the envelope of a signal with attack and release."""
        envelope = np.zeros_like(signal)
        envelope[0] = signal[0]
        
        for i in range(1, len(signal)):
            if signal[i] > envelope[i-1]:
                # Attack
                alpha = 1 - np.exp(-1 / attack_samples)
            else:
                # Release
                alpha = 1 - np.exp(-1 / release_samples)
            
            envelope[i] = alpha * signal[i] + (1 - alpha) * envelope[i-1]
        
        return envelope
    
    def _smooth_audio(self, processed: np.ndarray, original: np.ndarray, blend: float) -> np.ndarray:
        """Smooth transitions between processed and original audio."""
        return processed * (1 - blend) + original * blend
    
    def _get_enhanced_filename(self, original_path: str) -> str:
        """Generate filename for enhanced audio."""
        path = Path(original_path)
        timestamp = int(time.time() * 1000)
        return str(path.parent / f"{path.stem}_enhanced_{timestamp}{path.suffix}")
    
    def apply_preset(self, audio_file: str, preset_name: str) -> str:
        """Apply a preset effect configuration."""
        if preset_name not in self.effect_presets:
            raise ValueError(f"Unknown preset: {preset_name}. Available: {list(self.effect_presets.keys())}")
        
        return self.enhance_audio(audio_file, self.effect_presets[preset_name])
    
    def convert_format(self, audio_file: str, output_format: str, 
                      quality_settings: Dict[str, Any] = None) -> str:
        """
        Convert audio to different format with quality settings.
        
        Args:
            audio_file: Input audio file path
            output_format: Target format (mp3, wav, flac, ogg)
            quality_settings: Dict with bitrate, sample_rate, metadata
            
        Returns:
            Path to converted file
        """
        if output_format not in self.supported_formats:
            raise ValueError(f"Unsupported format: {output_format}")
        
        # Load audio
        audio, sr = librosa.load(audio_file, sr=None)
        
        # Apply quality settings
        if quality_settings:
            target_sr = quality_settings.get('sample_rate', sr)
            if target_sr != sr:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
                sr = target_sr
        
        # Generate output path
        path = Path(audio_file)
        output_path = str(path.parent / f"{path.stem}.{output_format}")
        
        # Save with format-specific settings
        if output_format == 'wav':
            sf.write(output_path, audio, sr, subtype='PCM_16')
        elif output_format == 'flac':
            sf.write(output_path, audio, sr, format='FLAC')
        elif output_format == 'ogg':
            sf.write(output_path, audio, sr, format='OGG')
        elif output_format == 'mp3':
            # For MP3, we need to use a temporary WAV and convert
            temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            sf.write(temp_wav.name, audio, sr)
            temp_wav.close()
            
            # Use pydub for MP3 conversion
            try:
                from pydub import AudioSegment
                bitrate = quality_settings.get('bitrate', '192k') if quality_settings else '192k'
                sound = AudioSegment.from_wav(temp_wav.name)
                sound.export(output_path, format='mp3', bitrate=bitrate)
            except ImportError:
                # Fallback to WAV if pydub not available
                output_path = str(path.parent / f"{path.stem}.wav")
                sf.write(output_path, audio, sr)
            finally:
                os.unlink(temp_wav.name)
        
        # Add metadata if provided
        if quality_settings and 'metadata' in quality_settings:
            self._embed_metadata(output_path, quality_settings['metadata'])
        
        return output_path
    
    def _embed_metadata(self, audio_file: str, metadata: Dict[str, str]):
        """Embed metadata into audio file."""
        try:
            import mutagen
            from mutagen.easyid3 import EasyID3
            from mutagen.flac import FLAC
            from mutagen.oggvorbis import OggVorbis
            
            ext = Path(audio_file).suffix.lower()
            
            if ext == '.mp3':
                audio = EasyID3(audio_file)
            elif ext == '.flac':
                audio = FLAC(audio_file)
            elif ext == '.ogg':
                audio = OggVorbis(audio_file)
            else:
                return  # WAV doesn't support easy metadata
            
            # Set metadata fields
            for key, value in metadata.items():
                audio[key] = value
            
            audio.save()
        except ImportError:
            pass  # Metadata library not available
    
    def analyze_audio(self, audio_file: str) -> Dict[str, Any]:
        """
        Perform comprehensive audio analysis.
        
        Returns:
            Dictionary with analysis results including:
            - spectogram data
            - frequency analysis
            - beat detection
            - key detection
            - tempo
            - duration
        """
        # Load audio
        audio, sr = librosa.load(audio_file, sr=self.sample_rate)
        
        analysis = {}
        
        # Basic info
        analysis['duration'] = len(audio) / sr
        analysis['sample_rate'] = sr
        analysis['channels'] = 1 if len(audio.shape) == 1 else audio.shape[0]
        
        # Spectogram
        D = librosa.stft(audio)
        S_db = librosa.amplitude_to_db(np.abs(D), ref=np.max)
        analysis['spectogram'] = {
            'data': S_db.tolist()[:100],  # Limit size for JSON
            'frequencies': librosa.fft_frequencies(sr=sr).tolist()[:100],
            'times': librosa.frames_to_time(np.arange(S_db.shape[1]), sr=sr).tolist()[:100]
        }
        
        # Frequency analysis
        fft = np.fft.fft(audio)
        freqs = np.fft.fftfreq(len(fft), 1/sr)
        magnitude = np.abs(fft)
        
        # Get dominant frequencies
        positive_freqs = freqs[:len(freqs)//2]
        positive_magnitude = magnitude[:len(magnitude)//2]
        top_indices = np.argsort(positive_magnitude)[-10:][::-1]
        
        analysis['dominant_frequencies'] = [
            {'frequency': float(positive_freqs[i]), 'magnitude': float(positive_magnitude[i])}
            for i in top_indices
        ]
        
        # Beat detection
        tempo, beats = librosa.beat.beat_track(y=audio, sr=sr)
        analysis['tempo'] = float(tempo)
        analysis['beats'] = librosa.frames_to_time(beats, sr=sr).tolist()
        
        # Key detection (using chroma features)
        chroma = librosa.feature.chroma_cqt(y=audio, sr=sr)
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_strengths = np.mean(chroma, axis=1)
        detected_key_idx = np.argmax(key_strengths)
        analysis['key'] = key_names[detected_key_idx]
        analysis['key_confidence'] = float(key_strengths[detected_key_idx] / np.sum(key_strengths))
        
        # RMS energy
        rms = librosa.feature.rms(y=audio)[0]
        analysis['rms_mean'] = float(np.mean(rms))
        analysis['rms_std'] = float(np.std(rms))
        
        # Zero crossing rate (indicates noisiness)
        zcr = librosa.feature.zero_crossing_rate(audio)[0]
        analysis['zero_crossing_rate'] = float(np.mean(zcr))
        
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        analysis['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
        
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        analysis['spectral_rolloff_mean'] = float(np.mean(spectral_rolloff))
        
        return analysis
    
    def batch_export(self, audio_files: List[str], output_formats: List[str],
                    effects: Dict[str, Any] = None, 
                    quality_settings: Dict[str, Any] = None) -> str:
        """
        Batch export multiple audio files with effects and format conversion.
        
        Args:
            audio_files: List of input audio file paths
            output_formats: List of formats to export to
            effects: Effects to apply to all files
            quality_settings: Quality settings for export
            
        Returns:
            Path to ZIP file containing all exported files
        """
        # Create temporary directory for processed files
        temp_dir = tempfile.mkdtemp()
        processed_files = []
        
        for audio_file in audio_files:
            print(f"📦 Processing file: {audio_file}")
            base_name = Path(audio_file).stem
            
            # Check if input file exists and has content
            if not os.path.exists(audio_file):
                print(f"❌ Input file not found: {audio_file}")
                continue
                
            file_size = os.path.getsize(audio_file)
            print(f"📊 Input file size: {file_size} bytes")
            if file_size == 0:
                print(f"⚠️  Skipping empty input file: {audio_file}")
                continue
            
            # Apply effects if specified
            if effects:
                print(f"🎨 Applying effects to: {audio_file}")
                processed_file = self.enhance_audio(audio_file, effects)
            else:
                processed_file = audio_file
            
            # Convert to each format
            for fmt in output_formats:
                try:
                    print(f"🔄 Converting to {fmt}: {processed_file}")
                    output_file = self.convert_format(
                        processed_file, 
                        fmt, 
                        quality_settings
                    )
                    
                    # Check if conversion was successful
                    if os.path.exists(output_file):
                        output_size = os.path.getsize(output_file)
                        print(f"✅ Converted file size: {output_size} bytes")
                        
                        if output_size > 0:
                            # Move to temp directory with descriptive name
                            final_name = f"{base_name}.{fmt}"
                            final_path = os.path.join(temp_dir, final_name)
                            os.rename(output_file, final_path)
                            processed_files.append(final_path)
                            print(f"✅ Added to export: {final_name}")
                        else:
                            print(f"⚠️  Converted file is empty: {output_file}")
                            if os.path.exists(output_file):
                                os.unlink(output_file)
                    else:
                        print(f"❌ Conversion failed, output file not created: {output_file}")
                        
                except Exception as e:
                    print(f"❌ Error processing {audio_file} to {fmt}: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Clean up enhanced file if it was created
            if effects and processed_file != audio_file and os.path.exists(processed_file):
                os.unlink(processed_file)
        
        # Create ZIP file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_path = os.path.join(Path(audio_files[0]).parent, f"batch_export_{timestamp}.zip")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in processed_files:
                zipf.write(file, os.path.basename(file))
        
        # Clean up temp directory
        for file in processed_files:
            if os.path.exists(file):
                os.unlink(file)
        os.rmdir(temp_dir)
        
        return zip_path
    
    def compare_audio(self, original_file: str, processed_file: str) -> Dict[str, Any]:
        """
        A/B comparison between original and processed audio.
        
        Returns:
            Dictionary with comparison metrics
        """
        # Load both files
        original, sr1 = librosa.load(original_file, sr=self.sample_rate)
        processed, sr2 = librosa.load(processed_file, sr=self.sample_rate)
        
        # Ensure same length
        min_len = min(len(original), len(processed))
        original = original[:min_len]
        processed = processed[:min_len]
        
        comparison = {}
        
        # RMS difference
        rms_original = np.sqrt(np.mean(original**2))
        rms_processed = np.sqrt(np.mean(processed**2))
        comparison['rms_change_db'] = float(20 * np.log10(rms_processed / (rms_original + 1e-10)))
        
        # Peak difference
        peak_original = np.max(np.abs(original))
        peak_processed = np.max(np.abs(processed))
        comparison['peak_change_db'] = float(20 * np.log10(peak_processed / (peak_original + 1e-10)))
        
        # Spectral difference
        D_original = np.abs(librosa.stft(original))
        D_processed = np.abs(librosa.stft(processed))
        spectral_diff = np.mean(np.abs(D_processed - D_original))
        comparison['spectral_difference'] = float(spectral_diff)
        
        # Dynamic range
        dr_original = 20 * np.log10(peak_original / (rms_original + 1e-10))
        dr_processed = 20 * np.log10(peak_processed / (rms_processed + 1e-10))
        comparison['dynamic_range_original'] = float(dr_original)
        comparison['dynamic_range_processed'] = float(dr_processed)
        
        return comparison
    
    def get_effect_presets(self) -> Dict[str, Dict[str, Any]]:
        """Get all available effect presets."""
        return self.effect_presets
    
    def create_custom_preset(self, name: str, effects: Dict[str, Any]):
        """Create a custom effect preset."""
        self.effect_presets[name] = effects
    
    def preview_effect(self, audio_file: str, effect_type: str, 
                      effect_params: Dict[str, Any], duration: float = 5.0) -> str:
        """
        Preview an effect on a short segment of audio.
        
        Args:
            audio_file: Input audio file
            effect_type: Type of effect (eq, compression, reverb, etc.)
            effect_params: Parameters for the effect
            duration: Duration of preview in seconds
            
        Returns:
            Path to preview audio file
        """
        # Load audio
        audio, sr = librosa.load(audio_file, sr=self.sample_rate)
        
        # Extract preview segment (middle of the track)
        preview_samples = int(duration * sr)
        start_sample = max(0, (len(audio) - preview_samples) // 2)
        preview_audio = audio[start_sample:start_sample + preview_samples]
        
        # Apply single effect
        if effect_type == 'eq':
            processed = self._apply_eq(preview_audio, effect_params)
        elif effect_type == 'compression':
            processed = self._apply_compression(preview_audio, effect_params)
        elif effect_type == 'reverb':
            processed = self._apply_reverb(preview_audio, effect_params)
        elif effect_type == 'limiter':
            processed = self._apply_limiter(preview_audio, effect_params)
        else:
            processed = preview_audio
        
        # Save preview
        path = Path(audio_file)
        preview_path = str(path.parent / f"{path.stem}_preview_{effect_type}.wav")
        sf.write(preview_path, processed, sr)
        
        return preview_path
