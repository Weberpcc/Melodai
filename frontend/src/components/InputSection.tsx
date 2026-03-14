import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Sparkles, Clock, History, Zap, Layers } from 'lucide-react';
import { GenerationSettings, GenerationResult, ExamplePrompt } from '../types';
import MoodSelector from './MoodSelector';
import ContextTags from './ContextTags';
import ExamplePrompts from './ExamplePrompts';
import GenerationProgress from './GenerationProgress';
import BatchGenerator from './BatchGenerator';
import Tooltip from './Tooltip';
import ContextualHelp from './ContextualHelp';
import { useWebSocket } from '../hooks/useWebSocket';

interface InputSectionProps {
  settings: GenerationSettings;
  onGenerate: (result: GenerationResult) => void;
  isGenerating: boolean;
  onSetGenerating: (generating: boolean) => void;
  history: GenerationResult[];
}

const InputSection: React.FC<InputSectionProps> = ({
  settings,
  onGenerate,
  isGenerating,
  onSetGenerating,
  history
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [generationStage, setGenerationStage] = useState<string>('processing');
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);

  // WebSocket for real-time progress
  const { 
    socket,
    isConnected, 
    startGeneration, 
    progress, 
    error: wsError, 
    isGenerating: wsGenerating,
    generationResult
  } = useWebSocket();

  // Handle WebSocket generation completion
  useEffect(() => {
    if (!generationResult) return;

    console.log('✅ Processing WebSocket generation result:', generationResult);
    
    const result: GenerationResult = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: prompt.trim(),
      enhancedPrompt: generationResult.enhancedPrompt || prompt.trim(),
      audioUrl: `http://localhost:5000${generationResult.audioUrl}`,
      settings,
      metadata: {
        duration: settings.duration,
        sampleRate: 44100,
        model: settings.model,
        generationTime: generationResult.generationTime || 0
      },
      mood: selectedMood,
      tags: selectedTags,
      qualityScores: generationResult.qualityScores
    };

    onGenerate(result);
  }, [generationResult, prompt, selectedMood, selectedTags, settings, onGenerate]);

  // Memoized recent prompts to prevent unnecessary re-renders
  const recentPrompts = useMemo(() => history.slice(0, 5), [history]);

  // Memoized validation
  const isValidPrompt = useMemo(() => {
    return prompt.trim().length >= 10 && prompt.length <= 500;
  }, [prompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Handle WebSocket generation completion
  useEffect(() => {
    if (wsError) {
      setError(wsError);
      onSetGenerating(false);
    }
  }, [wsError, onSetGenerating]);

  // Update generation stage from WebSocket progress
  useEffect(() => {
    if (progress) {
      setGenerationStage(progress.stage);
    }
  }, [progress]);

  // Sync WebSocket generating state
  useEffect(() => {
    onSetGenerating(wsGenerating);
  }, [wsGenerating, onSetGenerating]);

  const handleGenerate = useCallback(async () => {
    if (!isValidPrompt) {
      if (!prompt.trim()) {
        setError('Please enter a description for your music');
      } else if (prompt.length < 10) {
        setError('Please provide a more detailed description (at least 10 characters)');
      } else if (prompt.length > 500) {
        setError('Description is too long (maximum 500 characters)');
      }
      return;
    }

    setError('');
    setGenerationStage('processing');

    console.log('🎵 Starting music generation...');
    console.log('📝 Prompt:', prompt.trim());
    console.log('😊 Mood:', selectedMood);
    console.log('🏷️ Tags:', selectedTags);
    console.log('⚙️ Settings:', settings);

    // Use WebSocket if connected, otherwise fall back to HTTP
    if (isConnected) {
      console.log('🔌 Using WebSocket for real-time progress');
      startGeneration({
        prompt: prompt.trim(),
        mood: selectedMood,
        tags: selectedTags,
        settings
      });
    } else {
      console.log('📡 Using HTTP fallback');
      // Fallback to HTTP API
      onSetGenerating(true);
      
      try {
        // Simulate stage progression for better UX
        setTimeout(() => setGenerationStage('enhancing'), 2000);
        setTimeout(() => setGenerationStage('generating'), 5000);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
        
        const response = await fetch('http://localhost:5000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            mood: selectedMood,
            tags: selectedTags,
            settings
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = 'Generation failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Generation successful:', data);
        
        const result: GenerationResult = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          prompt: prompt.trim(),
          enhancedPrompt: data.enhancedPrompt || prompt.trim(),
          audioUrl: `http://localhost:5000${data.audioUrl}`,
          settings,
          metadata: {
            duration: settings.duration,
            sampleRate: 44100,
            model: settings.model,
            generationTime: data.generationTime || 0
          },
          mood: selectedMood,
          tags: selectedTags,
          qualityScores: data.qualityScores
        };

        console.log('🎶 Final result:', result);
        onGenerate(result);
      } catch (error) {
        console.error('❌ Generation failed:', error);
        setError(`Failed to generate music: ${error instanceof Error ? error.message : 'Unknown error'}`);
        onSetGenerating(false);
      }
    }
  }, [prompt, selectedMood, selectedTags, settings, isValidPrompt, onGenerate, onSetGenerating, isConnected, startGeneration]);

  const handleExampleClick = useCallback((example: ExamplePrompt) => {
    setPrompt(example.text);
    setSelectedMood(example.mood);
    setError('');
    // Focus textarea after setting example
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleRecentPromptClick = useCallback((recentPrompt: string) => {
    setPrompt(recentPrompt);
    setError('');
    // Focus textarea after setting prompt
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Generation Progress */}
      <GenerationProgress 
        isGenerating={isGenerating}
        currentStage={generationStage}
        progress={progress?.progress}
      />

      {/* Row 1: Prompt Input (Full Width) */}
      <div className="glass rounded-xl p-6 transition-all duration-300 hover:bg-black/45">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>{isBatchMode ? 'Batch Generation' : 'Describe Your Music'}</span>
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                isBatchMode 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'glass-button text-white/70 hover:text-white'
              }`}
              disabled={isGenerating}
            >
              <Layers className="w-4 h-4" />
              <span>{isBatchMode ? 'Single Mode' : 'Batch Mode'}</span>
            </button>
            <ContextualHelp section="input" />
          </div>
        </div>
        
        
        {isBatchMode ? (
          <BatchGenerator
            settings={settings}
            onBatchComplete={(results) => {
              console.log('Batch complete:', results);
              // Convert batch results to individual GenerationResults
              results.forEach((result, index) => {
                if (result.status === 'success' && result.audioUrl) {
                  const generationResult: GenerationResult = {
                    id: `batch_${Date.now()}_${index}`,
                    timestamp: Date.now(),
                    prompt: result.prompt,
                    enhancedPrompt: result.enhancedPrompt || result.prompt,
                    audioUrl: result.audioUrl,
                    settings,
                    metadata: {
                      duration: settings.duration,
                      sampleRate: 44100,
                      model: settings.model,
                      generationTime: 0
                    },
                    mood: selectedMood,
                    tags: selectedTags
                  };
                  onGenerate(generationResult);
                }
              });
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onFocus={() => setIsPromptFocused(true)}
                onBlur={() => setIsPromptFocused(false)}
                placeholder="Describe the music you want to create... (e.g., 'A relaxing piano melody with soft strings, perfect for studying')"
                className={`w-full min-h-[8rem] max-h-48 glass-input rounded-lg px-4 py-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 transition-all duration-300 ${
                  isPromptFocused ? 'focus:ring-cyan-500 bg-black/50' : 'focus:ring-cyan-500'
                } ${
                  error ? 'ring-2 ring-red-400' : ''
                }`}
                disabled={isGenerating}
                style={{ minHeight: '8rem' }}
              />
              
              {/* Character count indicator */}
              <div className={`absolute bottom-2 right-2 text-xs transition-colors duration-200 ${
                prompt.length > 450 ? 'text-yellow-400' : 
                prompt.length > 500 ? 'text-red-400' : 'text-white/40'
              }`}>
                {prompt.length}/500
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Validation indicators */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    prompt.length >= 10 ? 'bg-green-400' : 'bg-gray-500'
                  }`} />
                  <span className="text-white/60">Min length</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    prompt.length <= 500 ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white/60">Max length</span>
                </div>
              </div>
              
              {/* Generate Button - moved here */}
              <Tooltip content={`Generate music (Ctrl+Enter) - Estimated time: ${Math.round(settings.duration * 1.5)}s`}>
                <button
                  ref={generateButtonRef}
                  onClick={handleGenerate}
                  disabled={isGenerating || !isValidPrompt}
                  data-generate-button
                  className={`glass-button rounded-lg px-6 py-2 text-white font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isGenerating || !isValidPrompt 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-cyan-500/20'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate</span>
                      <Clock className="w-3 h-3 text-white/80" />
                      <span className="text-xs text-white/80">{settings.duration}s</span>
                    </>
                  )}
                </button>
              </Tooltip>
              
              {error && (
                <div className="text-xs text-red-400 animate-pulse">
                  {error}
                </div>
              )}
            </div>

            {/* Recent Prompts */}
            {recentPrompts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center space-x-1">
                  <History className="w-4 h-4" />
                  <span>Recent Prompts</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentPrompts.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentPromptClick(item.prompt)}
                      className="text-xs glass-button rounded-full px-3 py-1 text-white/80 hover:text-white transition-colors"
                      disabled={isGenerating}
                    >
                      {item.prompt.length > 40 ? `${item.prompt.slice(0, 40)}...` : item.prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Mood, Example Prompts, and Context Tags - Only show in single mode */}
      {!isBatchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Selector */}
          <MoodSelector
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
            disabled={isGenerating}
          />

          {/* Example Prompts */}
          <ExamplePrompts
            onExampleClick={handleExampleClick}
            disabled={isGenerating}
          />

          {/* Context Tags */}
          <ContextTags
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            disabled={isGenerating}
          />
        </div>
      )}
    </div>
  );
};

export default InputSection;