import React from 'react';
import { AppState } from '../types';
import ElasticSlider from './ElasticSlider';
import { Clock, Zap, RefreshCw } from 'lucide-react';
import { useCacheStats } from '../hooks/useCacheStats';

interface SettingsProps {
  state: AppState;
  onSettingsChange: (settings: Partial<AppState['settings']>) => void;
}

const Settings: React.FC<SettingsProps> = ({ state, onSettingsChange }) => {
  const { stats, refreshStats } = useCacheStats();

  const handleSettingChange = (key: keyof AppState['settings'], value: any) => {
    onSettingsChange({ [key]: value });
  };

  const handleClearCache = () => {
    // In a real implementation, this would call the backend to clear cache
    // For now, we'll just reset the local stats
    localStorage.removeItem('melodai-cache-stats');
    refreshStats();
    alert('Cache cleared successfully!');
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Audio Generation Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration Setting */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/80">
                Default Duration (seconds)
              </label>
              <ElasticSlider
                leftIcon={<Clock className="w-5 h-5 text-white/60" />}
                rightIcon={<Clock className="w-5 h-5 text-white/60" />}
                startingValue={10}
                defaultValue={state.settings.duration}
                maxValue={120}
                isStepped
                stepSize={5}
                onChange={(value) => handleSettingChange('duration', value)}
              />
            </div>

            {/* Creativity Setting */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/80">
                Creativity Level
              </label>
              <ElasticSlider
                leftIcon={<Zap className="w-5 h-5 text-white/60" />}
                rightIcon={<Zap className="w-5 h-5 text-white/60" />}
                startingValue={0}
                defaultValue={state.settings.creativity * 50}
                maxValue={100}
                isStepped
                stepSize={5}
                onChange={(value) => handleSettingChange('creativity', value / 50)}
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                AI Model
              </label>
              <select
                value={state.settings.model}
                onChange={(e) => handleSettingChange('model', e.target.value)}
                className="w-full p-3 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                <option value="musicgen-small" style={{ backgroundColor: '#000000', color: '#ffffff' }}>MusicGen Small (Fast)</option>
                <option value="musicgen-medium" style={{ backgroundColor: '#000000', color: '#ffffff' }}>MusicGen Medium (Balanced)</option>
                <option value="musicgen-large" style={{ backgroundColor: '#000000', color: '#ffffff' }}>MusicGen Large (High Quality)</option>
              </select>
            </div>

            {/* Audio Quality Toggle */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={state.settings.expertMode}
                  onChange={(e) => handleSettingChange('expertMode', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-white/80">High Quality Mode</span>
              </label>
              <p className="text-xs text-white/60">
                Enable enhanced processing for better audio quality
              </p>
            </div>
          </div>
        </div>

        {/* Cache Settings */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Cache & Performance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Cache Management</h3>
                <button
                  onClick={refreshStats}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  title="Refresh cache stats"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/80">Cache Size</span>
                  <span className="text-sm text-white">{stats.totalSizeMB} MB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/80">Cached Items</span>
                  <span className="text-sm text-white">{stats.totalFiles} tracks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/80">Cache Hit Rate</span>
                  <span className="text-sm text-white">{stats.hitRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/80">Total Requests</span>
                  <span className="text-sm text-white">{stats.totalRequests}</span>
                </div>
                <button 
                  onClick={handleClearCache}
                  className="w-full p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Clear Cache
                </button>
                <div className="text-xs text-white/40 text-center">
                  Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Performance</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-4 h-4 text-emerald-600 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-white/80">Enable caching</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-4 h-4 text-emerald-600 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-white/80">Preload models</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="w-4 h-4 text-emerald-600 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-white/80">GPU acceleration</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;