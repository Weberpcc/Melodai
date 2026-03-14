import React from 'react';
import { Settings, Info } from 'lucide-react';
import { GenerationSettings } from '../types';

interface AdvancedParametersProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
  disabled?: boolean;
}

const AdvancedParameters: React.FC<AdvancedParametersProps> = ({
  settings,
  onSettingsChange,
  disabled = false
}) => {
  const [showInfo, setShowInfo] = React.useState<string | null>(null);

  const parameterInfo = {
    topK: 'Top-K sampling: Limits the model to the K most likely tokens. Lower values (50-150) = more focused, Higher values (250-500) = more diverse.',
    topP: 'Top-P (nucleus) sampling: Considers tokens with cumulative probability up to P. 0 = disabled, 0.9 = balanced, 0.95 = more diverse.',
    cfgScale: 'Classifier-Free Guidance: Controls how closely the model follows the prompt. Lower (1-3) = more creative, Higher (5-10) = stricter adherence.',
    creativity: 'Temperature: Controls randomness. Lower (0.5-0.8) = more predictable, Higher (1.2-2.0) = more experimental.'
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-orange-400" />
          <span>Advanced Parameters</span>
        </h3>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <span className="text-sm text-white/70">Expert Mode</span>
          <input
            type="checkbox"
            checked={settings.expertMode}
            onChange={(e) => onSettingsChange({ expertMode: e.target.checked })}
            className="w-4 h-4 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-2"
            disabled={disabled}
          />
        </label>
      </div>

      {settings.expertMode && (
        <div className="space-y-4 pt-2">
          {/* Temperature / Creativity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70 flex items-center space-x-1">
                <span>Temperature (Creativity)</span>
                <button
                  onMouseEnter={() => setShowInfo('creativity')}
                  onMouseLeave={() => setShowInfo(null)}
                  className="text-white/40 hover:text-white/60"
                >
                  <Info className="w-3 h-3" />
                </button>
              </label>
              <span className="text-white font-medium text-sm">
                {settings.creativity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={settings.creativity}
              onChange={(e) => onSettingsChange({ creativity: Number(e.target.value) })}
              className="w-full slider"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Conservative (0.5)</span>
              <span>Experimental (2.0)</span>
            </div>
            {showInfo === 'creativity' && (
              <div className="text-xs text-white/70 bg-black/30 rounded p-2">
                {parameterInfo.creativity}
              </div>
            )}
          </div>

          {/* CFG Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70 flex items-center space-x-1">
                <span>CFG Scale</span>
                <button
                  onMouseEnter={() => setShowInfo('cfgScale')}
                  onMouseLeave={() => setShowInfo(null)}
                  className="text-white/40 hover:text-white/60"
                >
                  <Info className="w-3 h-3" />
                </button>
              </label>
              <span className="text-white font-medium text-sm">
                {settings.cfgScale.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={settings.cfgScale}
              onChange={(e) => onSettingsChange({ cfgScale: Number(e.target.value) })}
              className="w-full slider"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Creative (1.0)</span>
              <span>Strict (10.0)</span>
            </div>
            {showInfo === 'cfgScale' && (
              <div className="text-xs text-white/70 bg-black/30 rounded p-2">
                {parameterInfo.cfgScale}
              </div>
            )}
          </div>

          {/* Top-K */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70 flex items-center space-x-1">
                <span>Top-K</span>
                <button
                  onMouseEnter={() => setShowInfo('topK')}
                  onMouseLeave={() => setShowInfo(null)}
                  className="text-white/40 hover:text-white/60"
                >
                  <Info className="w-3 h-3" />
                </button>
              </label>
              <span className="text-white font-medium text-sm">
                {settings.topK}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={50}
              value={settings.topK}
              onChange={(e) => onSettingsChange({ topK: Number(e.target.value) })}
              className="w-full slider"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Focused (50)</span>
              <span>Diverse (500)</span>
            </div>
            {showInfo === 'topK' && (
              <div className="text-xs text-white/70 bg-black/30 rounded p-2">
                {parameterInfo.topK}
              </div>
            )}
          </div>

          {/* Top-P */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70 flex items-center space-x-1">
                <span>Top-P (Nucleus)</span>
                <button
                  onMouseEnter={() => setShowInfo('topP')}
                  onMouseLeave={() => setShowInfo(null)}
                  className="text-white/40 hover:text-white/60"
                >
                  <Info className="w-3 h-3" />
                </button>
              </label>
              <span className="text-white font-medium text-sm">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1.0}
              step={0.05}
              value={settings.topP}
              onChange={(e) => onSettingsChange({ topP: Number(e.target.value) })}
              className="w-full slider"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Disabled (0.0)</span>
              <span>Max Diversity (1.0)</span>
            </div>
            {showInfo === 'topP' && (
              <div className="text-xs text-white/70 bg-black/30 rounded p-2">
                {parameterInfo.topP}
              </div>
            )}
          </div>
        </div>
      )}

      {!settings.expertMode && (
        <p className="text-sm text-white/60 text-center py-4">
          Enable Expert Mode to access advanced generation parameters
        </p>
      )}
    </div>
  );
};

export default AdvancedParameters;
