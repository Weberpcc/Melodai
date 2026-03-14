import React, { useState } from 'react';
import { ArrowRight, Loader2, Clock } from 'lucide-react';
import { GenerationSettings } from '../types';
import AudioPlayer from './AudioPlayer';

interface MusicExtenderProps {
  audioFilename: string;
  prompt: string;
  currentDuration: number;
  settings: GenerationSettings;
  onExtended?: (newAudioUrl: string, finalDuration: number) => void;
}

const MusicExtender: React.FC<MusicExtenderProps> = ({
  audioFilename,
  prompt,
  currentDuration,
  settings,
  onExtended
}) => {
  const [isExtending, setIsExtending] = useState(false);
  const [targetDuration, setTargetDuration] = useState(60);
  const [extendedAudioUrl, setExtendedAudioUrl] = useState<string | null>(null);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleExtend = async () => {
    if (!audioFilename) {
      setError('No audio file to extend');
      return;
    }

    if (targetDuration <= currentDuration) {
      setError(`Target duration must be greater than current duration (${currentDuration}s)`);
      return;
    }

    setIsExtending(true);
    setError('');
    setExtendedAudioUrl(null);

    try {
      console.log('🔄 Extending music...');
      
      const response = await fetch('http://localhost:5000/api/extend-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioFilename,
          prompt,
          targetDuration,
          settings
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Extension failed');
      }

      const data = await response.json();
      console.log('✅ Music extended:', data);
      
      if (data.status === 'success') {
        const newUrl = `http://localhost:5000${data.audioUrl}`;
        setExtendedAudioUrl(newUrl);
        setFinalDuration(data.finalDuration);
        
        if (onExtended) {
          onExtended(newUrl, data.finalDuration);
        }
      } else if (data.status === 'no_extension_needed') {
        setError(data.message);
      }
    } catch (error) {
      console.error('❌ Extension failed:', error);
      setError(`Failed to extend music: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
        <ArrowRight className="w-5 h-5 text-blue-300" />
        <span>Extend Music Duration</span>
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Current Duration:</span>
          <span className="text-white font-medium">{currentDuration}s</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70 flex items-center justify-between">
            <span>Target Duration:</span>
            <span className="text-white font-medium">{targetDuration}s</span>
          </label>
          <input
            type="range"
            min={currentDuration + 10}
            max={120}
            step={10}
            value={targetDuration}
            onChange={(e) => setTargetDuration(Number(e.target.value))}
            className="w-full"
            disabled={isExtending}
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>{currentDuration + 10}s</span>
            <span>120s</span>
          </div>
        </div>

        <button
          onClick={handleExtend}
          disabled={isExtending || targetDuration <= currentDuration}
          className="w-full glass-button rounded-lg px-4 py-3 text-white hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isExtending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extending Music...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Extend to {targetDuration}s</span>
              <Clock className="w-4 h-4 text-white/60" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {extendedAudioUrl && finalDuration && (
        <div className="space-y-3">
          <div className="text-sm text-green-400 bg-green-500/10 rounded-lg p-3">
            ✅ Music extended successfully to {finalDuration.toFixed(1)}s!
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-white/70 mb-2">Extended Version:</p>
            <AudioPlayer audioUrl={extendedAudioUrl} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicExtender;
