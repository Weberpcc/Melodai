import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { 
  Download, 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  RefreshCw,
  Clock,
  Music,
  Settings,
  BarChart3,
  Share2,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { GenerationResult, GenerationSettings, UserFeedback } from '../types';
import AudioPlayer from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';
import Tooltip from './Tooltip';
import ContextualHelp from './ContextualHelp';

// Lazy load heavy components
const WaveformVisualization = lazy(() => import('./WaveformVisualization'));
const VariationGenerator = lazy(() => import('./VariationGenerator'));
const MusicExtender = lazy(() => import('./MusicExtender'));
const QualityDisplay = lazy(() => import('./QualityDisplay'));
const AudioEffectsPanel = lazy(() => import('./AudioEffectsPanel'));

interface OutputSectionProps {
  result: GenerationResult | null;
  isGenerating: boolean;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  settings: GenerationSettings;
  onFeedbackSubmit: (feedback: Omit<UserFeedback, 'id' | 'timestamp'>) => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({
  result,
  isGenerating,
  onToggleFavorite,
  isFavorite,
  settings,
  onFeedbackSubmit
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [showVariations, setShowVariations] = useState(false);
  const [showExtender, setShowExtender] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [enhancedAudioUrl, setEnhancedAudioUrl] = useState<string>('');

  // Memoized calculations
  const generationTimeFormatted = useMemo(() => {
    if (!result?.metadata?.generationTime) return '0s';
    return `${result.metadata.generationTime.toFixed(1)}s`;
  }, [result?.metadata?.generationTime]);

  const qualityScoreFormatted = useMemo(() => {
    if (!result?.qualityScores?.overallScore) return 'N/A';
    return `${result.qualityScores.overallScore.toFixed(1)}/100`;
  }, [result?.qualityScores?.overallScore]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = result.audioUrl;
    link.download = `melodai-${new Date(result.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  const handleCopyPrompt = useCallback(async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }, [result]);

  const handleShare = useCallback(async () => {
    if (!result) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MelodAI Generated Music',
          text: `Check out this AI-generated music: "${result.prompt}"`,
          url: result.audioUrl
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(result.audioUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  }, [result]);

  if (isGenerating) {
    return (
      <div className="glass rounded-xl p-8 animate-pulse">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Generating Your Music" />
          <p className="text-white/70 mb-6 mt-4">This may take a few moments...</p>
          
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex items-center justify-center space-x-2 transition-opacity duration-500">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Processing your prompt with AI</span>
            </div>
            <div className="flex items-center justify-center space-x-2 transition-opacity duration-500" style={{ animationDelay: '0.5s' }}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span>Generating high-quality audio</span>
            </div>
            <div className="flex items-center justify-center space-x-2 transition-opacity duration-500" style={{ animationDelay: '1s' }}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span>Finalizing and optimizing your track</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/50">
            Estimated time: {Math.round(settings.duration * 1.5)}s
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="glass rounded-xl p-6 space-y-6 transition-all duration-300 hover:bg-black/45">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Music className="w-5 h-5 text-emerald-300" />
            <span>Generated Music</span>
          </h3>
          <div className="flex items-center space-x-2 text-sm text-white/60">
            <span>•</span>
            <span>Quality: {qualityScoreFormatted}</span>
            <span>•</span>
            <span>Time: {generationTimeFormatted}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ContextualHelp section="output" />
          
          <Tooltip content={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            <button
              onClick={() => onToggleFavorite(result.id)}
              className={`glass-button rounded-lg p-2 transition-all duration-300 transform hover:scale-110 ${
                isFavorite 
                  ? 'text-red-400 hover:text-red-300 bg-red-500/20' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip content="Share this track">
            <button
              onClick={handleShare}
              className="glass-button rounded-lg p-2 text-white/60 hover:text-white/80 transition-all duration-300 transform hover:scale-110"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </Tooltip>
          
          <Tooltip content="Download MP3 (Ctrl+D)">
            <button
              onClick={handleDownload}
              data-download-button
              className="glass-button rounded-lg px-4 py-2 text-white/80 hover:text-white transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer audioUrl={enhancedAudioUrl || result.audioUrl} />

      {/* Waveform Visualization */}
      {showWaveform && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Waveform Visualization</span>
            </h4>
            <Tooltip content="Hide waveform">
              <button
                onClick={() => setShowWaveform(false)}
                className="text-white/60 hover:text-white/80 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading waveform..." />}>
            <WaveformVisualization audioUrl={result.audioUrl} />
          </Suspense>
        </div>
      )}

      {!showWaveform && (
        <Tooltip content="Show audio waveform visualization">
          <button
            onClick={() => setShowWaveform(true)}
            className="w-full glass-button rounded-lg py-3 text-white/60 hover:text-white/80 transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-white/10"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Show Waveform</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </Tooltip>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Tooltip content={copySuccess ? "Copied!" : "Copy prompt to clipboard"}>
          <button
            onClick={handleCopyPrompt}
            className={`glass-button rounded-lg px-3 py-2 text-sm transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
              copySuccess ? 'bg-green-500/20 text-green-300' : 'text-white/80 hover:text-white'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>{copySuccess ? 'Copied!' : 'Copy Prompt'}</span>
          </button>
        </Tooltip>
        
        <Tooltip content="Generate variations of this track">
          <button
            onClick={() => setShowVariations(!showVariations)}
            className={`glass-button rounded-lg px-3 py-2 text-sm transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
              showVariations ? 'bg-white/25 text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${showVariations ? 'animate-spin' : ''}`} />
            <span>{showVariations ? 'Hide' : 'Show'} Variations</span>
          </button>
        </Tooltip>

        <Tooltip content="Extend this track to a longer duration">
          <button
            onClick={() => setShowExtender(!showExtender)}
            className={`glass-button rounded-lg px-3 py-2 text-sm transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
              showExtender ? 'bg-white/25 text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{showExtender ? 'Hide' : 'Show'} Extender</span>
          </button>
        </Tooltip>

        <Tooltip content="Apply audio effects and enhancements">
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`glass-button rounded-lg px-3 py-2 text-sm transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
              showEffects ? 'bg-white/25 text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{showEffects ? 'Hide' : 'Show'} Effects</span>
          </button>
        </Tooltip>

        <Tooltip content="Open in external player">
          <button
            onClick={() => window.open(result.audioUrl, '_blank')}
            className="glass-button rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open</span>
          </button>
        </Tooltip>
      </div>

      {/* Variation Generator */}
      {showVariations && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading variation generator..." />}>
            <VariationGenerator
              prompt={result.prompt}
              mood={result.mood || ''}
              tags={result.tags || []}
              settings={settings}
            />
          </Suspense>
        </div>
      )}

      {/* Music Extender */}
      {showExtender && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading music extender..." />}>
            <MusicExtender
              audioFilename={result.audioUrl.split('/').pop() || ''}
              prompt={result.enhancedPrompt}
              currentDuration={result.metadata.duration}
              settings={settings}
            />
          </Suspense>
        </div>
      )}

      {/* Audio Effects Panel */}
      {showEffects && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading audio effects..." />}>
            <AudioEffectsPanel
              audioFilename={result.audioUrl.split('/').pop() || ''}
              onEffectApplied={(enhancedUrl) => setEnhancedAudioUrl(enhancedUrl)}
            />
          </Suspense>
        </div>
      )}

      {/* Quality Display & Feedback */}
      <Suspense fallback={<LoadingSpinner size="sm" text="Loading quality analysis..." />}>
        <QualityDisplay
          qualityScores={result.qualityScores}
          userFeedback={result.userFeedback}
          onFeedbackSubmit={onFeedbackSubmit}
          generationId={result.id}
        />
      </Suspense>

      {/* Generation Details */}
      <div>
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex items-center justify-between w-full text-left text-white/80 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium">Generation Details</span>
          {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {detailsOpen && (
          <div className="mt-4 space-y-4 pl-4 border-l border-white/20">
            {/* Original Prompt */}
            <div>
              <h5 className="text-sm font-medium text-white/80 mb-1">Original Prompt</h5>
              <p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">
                "{result.prompt}"
              </p>
            </div>

            {/* Enhanced Prompt */}
            {result.enhancedPrompt !== result.prompt && (
              <div>
                <h5 className="text-sm font-medium text-white/80 mb-1">Enhanced Prompt</h5>
                <p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">
                  "{result.enhancedPrompt}"
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{result.metadata.duration}s</div>
                <div className="text-xs text-white/60">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{result.metadata.sampleRate}Hz</div>
                <div className="text-xs text-white/60">Sample Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{result.metadata.model}</div>
                <div className="text-xs text-white/60">Model</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{result.metadata.generationTime}s</div>
                <div className="text-xs text-white/60">Generation Time</div>
              </div>
            </div>

            {/* Settings Used */}
            <div>
              <h5 className="text-sm font-medium text-white/80 mb-2 flex items-center space-x-1">
                <Settings className="w-4 h-4" />
                <span>Settings Used</span>
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Creativity:</span>
                  <span className="text-white/80">{Math.round(result.settings.creativity * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Top-K:</span>
                  <span className="text-white/80">{result.settings.topK}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Top-P:</span>
                  <span className="text-white/80">{result.settings.topP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">CFG Scale:</span>
                  <span className="text-white/80">{result.settings.cfgScale}</span>
                </div>
              </div>
            </div>

            {/* Tags and Mood */}
            {(result.mood || result.tags?.length) && (
              <div>
                <h5 className="text-sm font-medium text-white/80 mb-2">Tags & Mood</h5>
                <div className="flex flex-wrap gap-2">
                  {result.mood && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                      {result.mood}
                    </span>
                  )}
                  {result.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center space-x-2 text-xs text-white/60">
              <Clock className="w-3 h-3" />
              <span>Generated on {new Date(result.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputSection;