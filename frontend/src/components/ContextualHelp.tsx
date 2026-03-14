import React, { useState } from 'react';
import { HelpCircle, X, Lightbulb, Keyboard, Settings, Music } from 'lucide-react';
import Tooltip from './Tooltip';

interface ContextualHelpProps {
  section?: 'input' | 'output' | 'settings' | 'general';
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ section = 'general' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    input: {
      title: 'Music Generation Help',
      icon: Music,
      tips: [
        'Be specific in your descriptions - mention instruments, mood, and style',
        'Use descriptive words like "upbeat", "melancholic", "energetic"',
        'Mention specific genres like "jazz", "electronic", "classical"',
        'Include tempo descriptions like "fast", "slow", "moderate"',
        'Try combining moods and contexts for better results'
      ],
      shortcuts: [
        { key: 'Ctrl+Enter', action: 'Generate music' },
        { key: 'Ctrl+D', action: 'Download current track' }
      ]
    },
    output: {
      title: 'Audio Player Help',
      icon: Music,
      tips: [
        'Click the waveform to jump to specific parts',
        'Use spacebar to play/pause when focused',
        'Right-click to access additional options',
        'The quality scores help you understand generation success',
        'Leave feedback to help improve future generations'
      ],
      shortcuts: [
        { key: 'Space', action: 'Play/Pause audio' },
        { key: 'Left/Right', action: 'Skip 10 seconds' },
        { key: 'Ctrl+D', action: 'Download audio' }
      ]
    },
    settings: {
      title: 'Settings Help',
      icon: Settings,
      tips: [
        'Duration: Longer tracks take more time to generate',
        'Creativity: Higher values create more experimental music',
        'Model: Different models have different strengths',
        'Expert mode: Unlocks advanced parameters',
        'Save your favorite settings as presets'
      ],
      shortcuts: [
        { key: 'Ctrl+,', action: 'Open settings' },
        { key: 'Ctrl+R', action: 'Reset to defaults' }
      ]
    },
    general: {
      title: 'MelodAI Help',
      icon: Lightbulb,
      tips: [
        'Start with simple, clear descriptions',
        'Experiment with different moods and tags',
        'Save your favorites for easy access',
        'Use variations to explore different interpretations',
        'Check the quality scores to understand results'
      ],
      shortcuts: [
        { key: 'Ctrl+Enter', action: 'Generate music' },
        { key: 'Ctrl+D', action: 'Download current track' },
        { key: 'Esc', action: 'Close modals' },
        { key: '?', action: 'Show this help' }
      ]
    }
  };

  const content = helpContent[section];
  const Icon = content.icon;

  return (
    <>
      <Tooltip content="Get help and tips">
        <button
          onClick={() => setIsOpen(true)}
          className="glass-button rounded-full p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" data-modal>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">{content.title}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="glass-button rounded-full p-1 text-white/60 hover:text-white transition-colors"
                data-close
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center space-x-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>Tips</span>
                </h4>
                <ul className="space-y-2">
                  {content.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-white/70 flex items-start space-x-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center space-x-1">
                  <Keyboard className="w-4 h-4" />
                  <span>Keyboard Shortcuts</span>
                </h4>
                <div className="space-y-2">
                  {content.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-white/10 rounded text-white/80 text-xs font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs text-white/60 text-center">
                Press <kbd className="px-1 py-0.5 bg-white/10 rounded">?</kbd> anytime to show help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextualHelp;