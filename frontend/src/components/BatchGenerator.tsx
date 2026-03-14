import React, { useState } from 'react';
import { Layers, Loader2, CheckCircle, XCircle, Download } from 'lucide-react';
import { GenerationSettings } from '../types';
import AudioPlayer from './AudioPlayer';

interface BatchPrompt {
  prompt: string;
  mood?: string;
  tags?: string[];
}

interface BatchResult {
  status: string;
  audioUrl?: string;
  prompt: string;
  enhancedPrompt?: string;
  error?: string;
}

interface BatchGeneratorProps {
  settings: GenerationSettings;
  onBatchComplete?: (results: BatchResult[]) => void;
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  settings,
  onBatchComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptsText, setPromptsText] = useState('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState('');
  const [totalTime, setTotalTime] = useState(0);

  const parsePrompts = (text: string): BatchPrompt[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({ prompt: line }));
  };

  const handleBatchGenerate = async () => {
    const prompts = parsePrompts(promptsText);
    
    if (prompts.length === 0) {
      setError('Please enter at least one prompt (one per line)');
      return;
    }

    if (prompts.length > 10) {
      setError('Maximum 10 prompts allowed per batch');
      return;
    }

    const invalidPrompts = prompts.filter(p => p.prompt.length < 10);
    if (invalidPrompts.length > 0) {
      setError('All prompts must be at least 10 characters long');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResults([]);

    try {
      console.log('📦 Starting batch generation...');
      
      const response = await fetch('http://localhost:5000/api/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts,
          settings
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch generation failed');
      }

      const data = await response.json();
      console.log('✅ Batch generation complete:', data);
      
      const batchResults = data.results.map((r: any) => ({
        status: r.status,
        audioUrl: r.audioUrl ? `http://localhost:5000${r.audioUrl}` : undefined,
        prompt: r.prompt,
        enhancedPrompt: r.enhancedPrompt,
        error: r.error
      }));

      setResults(batchResults);
      setTotalTime(data.totalTime);
      
      if (onBatchComplete) {
        onBatchComplete(batchResults);
      }
    } catch (error) {
      console.error('❌ Batch generation failed:', error);
      setError(`Failed to generate batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>Batch Generation</span>
        </h3>
      </div>

      {/* Help Note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <strong>💡 How to use:</strong> Enter multiple prompts (one per line) and click "Generate All" to create multiple tracks at once. Each track will be generated sequentially with your current settings.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-white/70 mb-2 block">
            Enter prompts (one per line, max 10):
          </label>
          <textarea
            value={promptsText}
            onChange={(e) => {
              setPromptsText(e.target.value);
              setError('');
            }}
            placeholder="A relaxing piano melody&#10;Upbeat electronic dance music&#10;Sad violin solo&#10;..."
            className="w-full h-32 glass-input rounded-lg px-4 py-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isGenerating}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-white/60">
              {parsePrompts(promptsText).length} prompts
            </div>
          </div>
        </div>

        <button
          onClick={handleBatchGenerate}
          disabled={isGenerating || promptsText.trim().length === 0}
          className="w-full glass-button rounded-lg px-4 py-3 text-white hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Batch...</span>
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              <span>Generate All ({parsePrompts(promptsText).length})</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>{successCount} Success</span>
              </span>
              {failCount > 0 && (
                <span className="text-red-400 flex items-center space-x-1">
                  <XCircle className="w-4 h-4" />
                  <span>{failCount} Failed</span>
                </span>
              )}
            </div>
            <span className="text-white/60">
              Total: {totalTime.toFixed(1)}s
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`glass rounded-lg p-4 space-y-3 ${
                  result.status === 'success' ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      {result.prompt.length > 60 ? `${result.prompt.slice(0, 60)}...` : result.prompt}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-400 mt-1">{result.error}</p>
                    )}
                  </div>
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                </div>

                {result.audioUrl && (
                  <AudioPlayer audioUrl={result.audioUrl} />
                )}
              </div>
            ))}
          </div>

          {successCount > 0 && (
            <button
              onClick={() => {
                // Download all successful results
                results
                  .filter(r => r.status === 'success' && r.audioUrl)
                  .forEach((r, i) => {
                    setTimeout(() => {
                      const a = document.createElement('a');
                      a.href = r.audioUrl!;
                      a.download = `batch_${i + 1}.mp3`;
                      a.click();
                    }, i * 500);
                  });
              }}
              className="w-full glass-button rounded-lg px-4 py-2 text-white text-sm hover:bg-white/25 transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download All ({successCount})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchGenerator;
