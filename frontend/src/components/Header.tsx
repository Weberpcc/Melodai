import React from 'react';
import { BarChart3, Music, Settings } from 'lucide-react';

interface HeaderProps {
  currentView?: 'main' | 'dashboard' | 'settings';
  onViewChange?: (view: 'main' | 'dashboard' | 'settings') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView = 'main', onViewChange }) => {
  return (
    <header className="glass border-b border-white/10 p-4 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 
              className="text-6xl text-white" 
              style={{ 
                fontFamily: "'Kaushan Script', cursive",
                textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
              }}
            >
              MelodAI
            </h1>
            
            {onViewChange && (
              <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('main')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'main'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Create</span>
                </button>
                <button
                  onClick={() => onViewChange('dashboard')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => onViewChange('settings')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'settings'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-white/80 font-light">
              {currentView === 'main' ? 'Create beautiful music with AI' : 
               currentView === 'dashboard' ? 'Your music creation insights' : 
               'Customize your experience'}
            </p>
            <p className="text-xs text-white/60 font-light">
              {currentView === 'main' ? 'Describe your vision, let AI compose' : 
               currentView === 'dashboard' ? 'Statistics, gallery, and settings' :
               'Audio preferences and model settings'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;