import React, { useState } from 'react';
import { Shuffle, Loader2, ThumbsUp } from 'lucide-react';
import { GenerationSettings } from '../types';
import AudioPlayer from './AudioPlayer';

interface Variation {
  audioUrl: string;
  variationNumber: number;
  parameters: any;
  metadata: any;
}

interface VariationGeneratorProps {
  prompt: string;
  mood: string;
  tags: string[];
  settings: GenerationSettings;
  onVariationGenerated?: (variations: Variation[]) => void;
}

const VariationGenerator: React.FC<VariationGeneratorProps> = ({
  prompt,
  mood,
  tags,
  settings,
  onVariationGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [numVariations, setNumVariations] = useState(3);
  const [votes, setVotes] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState('');

  const handleGenerateVariations = async () => {
    if (!prompt || prompt.length < 10) {
      setError('Please provide a valid prompt first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setVariations([]);
    setVotes({});

    try {
      console.log('🎨 Generating variations...');
      
      const response = await fetch('http://localhost:5000/api/generate-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mood,
          tags,
          settings,
          numVariations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Variation generation failed');
      }

      const data = await response.json();
      console.log('✅ Variations generated:', data);
      
      const generatedVariations = data.variations.map((v: any) => ({
        audioUrl: `http://localhost:5000${v.audioUrl}`,
        variationNumber: v.variationNumber,
        parameters: v.parameters,
        metadata: v.metadata
      }));

      setVariations(generatedVariations);
      
      if (onVariationGenerated) {
        onVariationGenerated(generatedVariations);
      }
    } catch (error) {
      console.error('❌ Variation generation failed:', error);
      setError(`Failed to generate variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVote = (index: number) => {
    setVotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Shuffle className="w-5 h-5 text-emerald-300" />
          <span>Generate Variations</span>
        </h3>
        
        <div className="flex items-center space-x-3">
          <select
            value={numVariations}
            onChange={(e) => setNumVariations(Number(e.target.value))}
            className="glass-input rounded-lg px-3 py-1 text-sm text-white"
            disabled={isGenerating}
          >
            <option value={2}>2 Variations</option>
            <option value={3}>3 Variations</option>
            <option value={4}>4 Variations</option>
            <option value={5}>5 Variations</option>
          </select>

          <button
            onClick={handleGenerateVariations}
            disabled={isGenerating || !prompt}
            className="glass-button rounded-lg px-4 py-2 text-white text-sm hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" />
                <span>Generate {numVariations} Variations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {variations.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-white/70">
            Compare variations and vote for your favorite:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variations.map((variation, index) => (
              <div
                key={index}
                className={`glass rounded-lg p-4 space-y-3 transition-all ${
                  votes[index] ? 'ring-2 ring-emerald-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">
                    Variation {variation.variationNumber}
                  </span>
                  <button
                    onClick={() => handleVote(index)}
                    className={`p-1 rounded transition-colors ${
                      votes[index]
                        ? 'text-emerald-400 bg-emerald-400/20'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>

                <AudioPlayer audioUrl={variation.audioUrl} />

                <div className="text-xs text-white/60 space-y-1 pt-2">
                  <div>Temp: {variation.parameters.temperature.toFixed(2)}</div>
                  <div>CFG: {variation.parameters.cfg_coef.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {Object.values(votes).some(v => v) && (
            <div className="text-sm text-emerald-300 bg-emerald-500/10 rounded-lg p-3">
              ✨ You voted for variation(s): {Object.entries(votes)
                .filter(([_, voted]) => voted)
                .map(([index]) => Number(index) + 1)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariationGenerator;
