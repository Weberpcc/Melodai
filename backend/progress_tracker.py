#!/usr/bin/env python3
"""
Progress tracking system for music generation
Provides real-time progress updates via WebSocket
"""

import time
import threading
from typing import Dict, Optional, Callable
from dataclasses import dataclass
from enum import Enum

class GenerationStage(Enum):
    PROCESSING = "processing"
    ENHANCING = "enhancing"
    GENERATING = "generating"
    COMPLETE = "complete"

@dataclass
class ProgressUpdate:
    stage: GenerationStage
    progress: float  # 0-100
    message: str
    time_elapsed: float
    estimated_remaining: float

class ProgressTracker:
    def __init__(self):
        self.active_generations: Dict[str, ProgressUpdate] = {}
        self.callbacks: Dict[str, Callable] = {}
        self.lock = threading.Lock()
    
    def start_generation(self, generation_id: str, callback: Optional[Callable] = None) -> None:
        """Start tracking a new generation"""
        with self.lock:
            self.active_generations[generation_id] = ProgressUpdate(
                stage=GenerationStage.PROCESSING,
                progress=0.0,
                message="Starting generation...",
                time_elapsed=0.0,
                estimated_remaining=60.0
            )
            if callback:
                self.callbacks[generation_id] = callback
    
    def update_progress(self, generation_id: str, stage: GenerationStage, 
                       progress: float, message: str = "") -> None:
        """Update progress for a generation"""
        if generation_id not in self.active_generations:
            return
        
        with self.lock:
            current = self.active_generations[generation_id]
            start_time = time.time() - current.time_elapsed
            time_elapsed = time.time() - start_time
            
            # Estimate remaining time based on stage and progress
            stage_weights = {
                GenerationStage.PROCESSING: 0.1,
                GenerationStage.ENHANCING: 0.15,
                GenerationStage.GENERATING: 0.75
            }
            
            total_progress = 0.0
            for s in GenerationStage:
                if s == GenerationStage.COMPLETE:
                    break
                weight = stage_weights.get(s, 0.0)
                if s.value == stage.value:
                    total_progress += weight * (progress / 100.0)
                elif self._stage_before(s, stage):
                    total_progress += weight
            
            total_progress = min(total_progress * 100, 99.0)  # Never show 100% until complete
            
            estimated_remaining = max(0, (60.0 * (100 - total_progress) / 100)) if total_progress > 0 else 60.0
            
            update = ProgressUpdate(
                stage=stage,
                progress=total_progress,
                message=message or self._get_default_message(stage),
                time_elapsed=time_elapsed,
                estimated_remaining=estimated_remaining
            )
            
            self.active_generations[generation_id] = update
            
            # Call callback if registered
            if generation_id in self.callbacks:
                try:
                    self.callbacks[generation_id](update)
                except Exception as e:
                    print(f"Progress callback error: {e}")
    
    def complete_generation(self, generation_id: str) -> None:
        """Mark generation as complete"""
        if generation_id not in self.active_generations:
            return
        
        with self.lock:
            current = self.active_generations[generation_id]
            update = ProgressUpdate(
                stage=GenerationStage.COMPLETE,
                progress=100.0,
                message="Generation complete!",
                time_elapsed=current.time_elapsed,
                estimated_remaining=0.0
            )
            
            self.active_generations[generation_id] = update
            
            # Call callback one final time
            if generation_id in self.callbacks:
                try:
                    self.callbacks[generation_id](update)
                except Exception as e:
                    print(f"Progress callback error: {e}")
                finally:
                    del self.callbacks[generation_id]
    
    def get_progress(self, generation_id: str) -> Optional[ProgressUpdate]:
        """Get current progress for a generation"""
        with self.lock:
            return self.active_generations.get(generation_id)
    
    def cleanup_generation(self, generation_id: str) -> None:
        """Clean up tracking data for a generation"""
        with self.lock:
            self.active_generations.pop(generation_id, None)
            self.callbacks.pop(generation_id, None)
    
    def _stage_before(self, stage1: GenerationStage, stage2: GenerationStage) -> bool:
        """Check if stage1 comes before stage2"""
        order = [GenerationStage.PROCESSING, GenerationStage.ENHANCING, 
                GenerationStage.GENERATING, GenerationStage.COMPLETE]
        try:
            return order.index(stage1) < order.index(stage2)
        except ValueError:
            return False
    
    def _get_default_message(self, stage: GenerationStage) -> str:
        """Get default message for a stage"""
        messages = {
            GenerationStage.PROCESSING: "Analyzing your request with AI...",
            GenerationStage.ENHANCING: "Optimizing prompt for best results...",
            GenerationStage.GENERATING: "Creating your unique audio...",
            GenerationStage.COMPLETE: "Your music is ready!"
        }
        return messages.get(stage, "Processing...")

# Global progress tracker instance
progress_tracker = ProgressTracker()

def get_progress_tracker() -> ProgressTracker:
    """Get the global progress tracker instance"""
    return progress_tracker