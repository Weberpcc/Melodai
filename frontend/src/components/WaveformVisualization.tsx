import React, { useEffect, useRef, useState } from 'react';

interface WaveformVisualizationProps {
  audioUrl: string;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({ audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateWaveform = async () => {
      if (!canvasRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Load and decode audio with proper CORS handling
        const response = await fetch(audioUrl, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars in waveform
        const blockSize = Math.floor(channelData.length / samples);

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Calculate waveform data
        const waveformData: number[] = [];
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          waveformData.push(sum / blockSize);
        }

        // Normalize data
        const maxValue = Math.max(...waveformData);
        const normalizedData = waveformData.map(value => value / maxValue);

        // Draw waveform
        const barWidth = rect.width / samples;
        const centerY = rect.height / 2;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); // Purple
        gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)'); // Pink
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)'); // Blue

        ctx.fillStyle = gradient;

        normalizedData.forEach((value, index) => {
          const barHeight = value * (rect.height * 0.8);
          const x = index * barWidth;
          const y = centerY - barHeight / 2;

          // Add some randomness for visual appeal
          const randomFactor = 0.1 + Math.random() * 0.2;
          const adjustedHeight = barHeight * randomFactor;

          ctx.fillRect(x, centerY - adjustedHeight / 2, barWidth - 1, adjustedHeight);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error generating waveform:', err);
        console.error('Audio URL:', audioUrl);
        setError(`Failed to generate waveform: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  if (error) {
    return (
      <div className="glass-dark rounded-lg p-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-lg p-4">
      <div className="relative w-full h-24">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded"
          style={{ opacity: isLoading ? 0.3 : 1 }}
        />
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-white/60">
        <span>0:00</span>
        <span>Waveform Visualization</span>
        <span>Duration</span>
      </div>
    </div>
  );
};

export default WaveformVisualization;