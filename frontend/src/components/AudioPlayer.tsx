import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import Tooltip from './Tooltip';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load audio file');
      console.error('Audio loading error for URL:', audioUrl);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        setError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  }, [duration]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  // Memoized time formatting
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const currentTimeFormatted = useMemo(() => formatTime(currentTime), [currentTime, formatTime]);
  const durationFormatted = useMemo(() => formatTime(duration), [duration, formatTime]);
  const progressPercentage = useMemo(() => duration ? (currentTime / duration) * 100 : 0, [currentTime, duration]);

  if (error) {
    return (
      <div className="glass-dark rounded-lg p-4 text-center">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <p className="text-white/60 text-xs">Audio URL: {audioUrl}</p>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-lg p-4 transition-all duration-300 hover:bg-black/60">
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
      
      {/* Main Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <Tooltip content="Restart (0:00)">
          <button
            onClick={restart}
            className="glass-button rounded-full p-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-110"
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Skip back 10s">
          <button
            onClick={skipBackward}
            className="glass-button rounded-full p-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-110"
            disabled={isLoading}
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </Tooltip>
        
        <Tooltip content={isPlaying ? "Pause (Space)" : "Play (Space)"}>
          <button
            onClick={togglePlayPause}
            className="glass-button rounded-full p-3 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-110 focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </Tooltip>
        
        <Tooltip content="Skip forward 10s">
          <button
            onClick={skipForward}
            className="glass-button rounded-full p-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-110"
            disabled={isLoading}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </Tooltip>
        
        <div className="flex-1 flex items-center space-x-2">
          <span className="text-sm text-white/70 min-w-[40px] font-mono">
            {currentTimeFormatted}
          </span>
          
          <div className="flex-1 relative group">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider group-hover:bg-white/30 transition-colors"
              aria-label="Seek audio position"
            />
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg pointer-events-none transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <span className="text-sm text-white/70 min-w-[40px] font-mono">
            {durationFormatted}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tooltip content={isMuted ? "Unmute" : "Mute"}>
            <button
              onClick={toggleMute}
              className="glass-button rounded-full p-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-110"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </Tooltip>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider hover:bg-white/30 transition-colors"
            aria-label="Volume control"
          />
        </div>
      </div>
      
      {/* Enhanced Progress Bar */}
      <div className="relative h-1 bg-white/10 rounded-full overflow-hidden group">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 group-hover:shadow-lg group-hover:shadow-emerald-500/30"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Playback info */}
      <div className="flex justify-between items-center mt-2 text-xs text-white/50">
        <span>Quality: 44.1kHz MP3</span>
        <span>{Math.round(progressPercentage)}% complete</span>
      </div>
    </div>
  );
};

export default AudioPlayer;