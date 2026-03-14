import React, { useState, useCallback, memo, useEffect } from "react";
import {
  Settings,
  History,
  Heart,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Brain,
  Trash2,
  Filter,
  Save,
  RotateCcw,
  Info,
  Cpu,
  Timer
} from "lucide-react";
import { GenerationSettings, GenerationResult } from "../types";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  params: string;
  speed: string;
  quality: string;
  memoryGB: number;
  maxDuration: number;
  estimatedTime: number;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  settings: Partial<GenerationSettings>;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
  history: GenerationResult[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
  currentView?: 'main' | 'dashboard';
  onViewChange?: (view: 'main' | 'dashboard') => void;
}

const Sidebar: React.FC<SidebarProps> = memo(
  ({
    isOpen,
    onToggle,
    settings,
    onSettingsChange,
    history,
    favorites,
    onToggleFavorite,
    onClearHistory,
  }) => {
    const [activeTab, setActiveTab] = useState<"settings" | "history">(
      "settings"
    );
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
    const [showModelInfo, setShowModelInfo] = useState(false);
    const [presets] = useState<Preset[]>([
      {
        id: 'quick',
        name: 'Quick Draft',
        description: 'Fast generation for quick ideas',
        settings: {
          model: 'musicgen-small',
          duration: 15,
          creativity: 1.0,
          topK: 250,
          topP: 0.0,
          cfgScale: 3.0
        }
      },
      {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced quality and speed',
        settings: {
          model: 'musicgen-medium',
          duration: 30,
          creativity: 1.0,
          topK: 250,
          topP: 0.0,
          cfgScale: 3.0
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Best quality for final tracks',
        settings: {
          model: 'musicgen-large',
          duration: 60,
          creativity: 0.9,
          topK: 200,
          topP: 0.0,
          cfgScale: 3.5
        }
      }
    ]);
    const [customPresets, setCustomPresets] = useState<Preset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    const handleDurationChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ duration: parseInt(e.target.value) });
      },
      [onSettingsChange]
    );

    const handleCreativityChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ creativity: parseFloat(e.target.value) });
      },
      [onSettingsChange]
    );

    const handleModelChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modelId = e.target.value;
        onSettingsChange({ model: modelId });
        const model = models.find(m => m.id === modelId);
        setSelectedModel(model || null);
      },
      [onSettingsChange, models]
    );

    // Load models on component mount
    useEffect(() => {
      const loadModels = async (retryCount = 0) => {
        try {
          console.log(`Loading models from API... (attempt ${retryCount + 1})`);
          
          // Add timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch('http://localhost:5000/api/models', {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Models loaded successfully:', data.models);
          setModels(data.models || []);
          
          // Set selected model based on current settings
          const currentModel = data.models?.find((m: ModelInfo) => m.id === settings.model);
          setSelectedModel(currentModel || null);
          console.log('Selected model:', currentModel);
          
        } catch (error) {
          console.error(`Failed to load models (attempt ${retryCount + 1}):`, error);
          
          // Retry up to 3 times with increasing delay
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 2000; // 2s, 4s delays
            console.log(`Retrying in ${delay}ms...`);
            setTimeout(() => loadModels(retryCount + 1), delay);
          } else {
            console.error('Max retries reached. Using fallback models.');
            // Fallback to default models if API fails
            setModels([
              {
                id: 'musicgen-small',
                name: 'MusicGen Small (Fast)',
                description: 'Fastest generation with good quality',
                params: '300M',
                speed: 'Fast',
                quality: 'Good',
                memoryGB: 2,
                maxDuration: 120,
                estimatedTime: 30
              },
              {
                id: 'musicgen-medium',
                name: 'MusicGen Medium (Balanced)',
                description: 'Balanced speed and quality',
                params: '1.5B',
                speed: 'Balanced',
                quality: 'Better',
                memoryGB: 6,
                maxDuration: 90,
                estimatedTime: 45
              },
              {
                id: 'musicgen-large',
                name: 'MusicGen Large (Quality)',
                description: 'Best quality, slower generation',
                params: '3.3B',
                speed: 'Slow',
                quality: 'Best',
                memoryGB: 12,
                maxDuration: 60,
                estimatedTime: 90
              }
            ]);
          }
        }
      };
      
      loadModels();
    }, [settings.model]);

    const handlePresetSelect = useCallback((preset: Preset) => {
      onSettingsChange(preset.settings);
      const model = models.find(m => m.id === preset.settings.model);
      setSelectedModel(model || null);
    }, [onSettingsChange, models]);

    const handleSavePreset = useCallback(() => {
      if (!presetName.trim()) return;
      
      const newPreset: Preset = {
        id: `custom_${Date.now()}`,
        name: presetName.trim(),
        description: 'Custom preset',
        settings: { ...settings }
      };
      
      setCustomPresets(prev => [...prev, newPreset]);
      setPresetName('');
      setShowSavePreset(false);
      
      // Save to localStorage
      const allCustomPresets = [...customPresets, newPreset];
      localStorage.setItem('melodai_custom_presets', JSON.stringify(allCustomPresets));
    }, [presetName, settings, customPresets]);

    const handleDeletePreset = useCallback((presetId: string) => {
      setCustomPresets(prev => prev.filter(p => p.id !== presetId));
      
      // Update localStorage
      const updatedPresets = customPresets.filter(p => p.id !== presetId);
      localStorage.setItem('melodai_custom_presets', JSON.stringify(updatedPresets));
    }, [customPresets]);

    const resetToDefaults = useCallback(() => {
      onSettingsChange({
        duration: 30,
        creativity: 1.0,
        model: 'musicgen-medium',
        topK: 250,
        topP: 0.0,
        cfgScale: 3.0,
        expertMode: false
      });
    }, [onSettingsChange]);

    const getEstimatedTime = useCallback(() => {
      if (!selectedModel) return null;
      
      // Rough estimation based on model and duration
      const baseTime = selectedModel.estimatedTime || 30;
      const durationMultiplier = settings.duration / 30;
      return Math.round(baseTime * durationMultiplier);
    }, [selectedModel, settings.duration]);

    // Load custom presets from localStorage on mount
    useEffect(() => {
      const saved = localStorage.getItem('melodai_custom_presets');
      if (saved) {
        try {
          setCustomPresets(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load custom presets:', error);
        }
      }
    }, []);

    const filteredHistory = showFavoritesOnly
      ? history.filter((item) => favorites.includes(item.id))
      : history;

    return (
      <>
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-20 glass-button rounded-full p-3 text-white hover:text-emerald-300 transition-colors duration-200 hover:scale-105"
          style={{ transform: 'translateY(-50%)' }}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full z-10 transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="w-80 h-full glass border-r border-white/10 p-4 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Tab Navigation */}
              <div className="flex mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-l-lg transition-colors ${
                    activeTab === "settings"
                      ? "glass-button text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-r-lg transition-colors ${
                    activeTab === "history"
                      ? "glass-button text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="text-sm">History</span>
                </button>
              </div>

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {/* Preset Configurations */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-white mb-2">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-emerald-400" />
                        <span>Presets</span>
                      </div>
                      <button
                        onClick={() => setShowSavePreset(!showSavePreset)}
                        className="text-xs text-white/60 hover:text-white/80 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    </label>
                    
                    {/* Built-in Presets */}
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset)}
                          className="glass-button rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                        >
                          <div className="font-medium text-white text-sm">{preset.name}</div>
                          <div className="text-xs text-white/60">{preset.description}</div>
                          <div className="text-xs text-white/50 mt-1">
                            {preset.settings.model?.replace('musicgen-', '')} • {preset.settings.duration}s
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Presets */}
                    {customPresets.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-white/60 font-medium">Custom Presets</div>
                        {customPresets.map((preset) => (
                          <div key={preset.id} className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePresetSelect(preset)}
                              className="flex-1 glass-button rounded-lg p-2 text-left hover:bg-white/10 transition-colors"
                            >
                              <div className="text-sm text-white">{preset.name}</div>
                              <div className="text-xs text-white/50">
                                {preset.settings.model?.replace('musicgen-', '')} • {preset.settings.duration}s
                              </div>
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save Preset Form */}
                    {showSavePreset && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <input
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Preset name..."
                          className="w-full glass-input rounded px-2 py-1 text-sm text-white mb-2"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSavePreset}
                            disabled={!presetName.trim()}
                            className="flex-1 glass-button rounded px-3 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowSavePreset(false)}
                            className="px-3 py-1 text-xs text-white/60 hover:text-white/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-white mb-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-pink-400" />
                        <span>Model Quality</span>
                      </div>
                      <button
                        onClick={() => setShowModelInfo(!showModelInfo)}
                        className="text-xs text-white/60 hover:text-white/80 transition-colors"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </label>
                    
                    <select
                      value={settings.model}
                      onChange={handleModelChange}
                      className="w-full glass-select rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>

                    {/* Model Information */}
                    {showModelInfo && selectedModel && (
                      <div className="mt-2 p-3 bg-white/5 rounded-lg text-xs">
                        <div className="grid grid-cols-2 gap-2 text-white/70">
                          <div>
                            <span className="text-white/50">Parameters:</span>
                            <div className="font-medium">{selectedModel.params}</div>
                          </div>
                          <div>
                            <span className="text-white/50">Speed:</span>
                            <div className="font-medium">{selectedModel.speed}</div>
                          </div>
                          <div>
                            <span className="text-white/50">Quality:</span>
                            <div className="font-medium">{selectedModel.quality}</div>
                          </div>
                          <div>
                            <span className="text-white/50">Memory:</span>
                            <div className="font-medium">~{selectedModel.memoryGB}GB</div>
                          </div>
                        </div>
                        <div className="mt-2 text-white/60">
                          {selectedModel.description}
                        </div>
                        {getEstimatedTime() && (
                          <div className="mt-2 flex items-center space-x-1 text-white/60">
                            <Timer className="w-3 h-3" />
                            <span>Est. time: ~{getEstimatedTime()}s</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Duration Control */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-white mb-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Duration: {settings.duration}s</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max={selectedModel?.maxDuration || 120}
                      value={settings.duration}
                      onChange={handleDurationChange}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>10s</span>
                      <span>{selectedModel?.maxDuration || 120}s</span>
                    </div>
                  </div>

                  {/* Temperature Control */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-white mb-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span>
                        Temperature: {settings.creativity.toFixed(1)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={settings.creativity}
                      onChange={handleCreativityChange}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>0.5 (Conservative)</span>
                      <span>2.0 (Creative)</span>
                    </div>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <div className="pt-4 border-t border-white/10">
                    <label className="flex items-center justify-between text-sm font-medium text-white mb-3">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>Advanced Parameters</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.expertMode}
                        onChange={(e) => onSettingsChange({ expertMode: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                    
                    {settings.expertMode && (
                      <div className="space-y-4 p-3 bg-white/5 rounded-lg">
                        {/* Top-K */}
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">
                            Top-K: {settings.topK}
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={settings.topK}
                            onChange={(e) => onSettingsChange({ topK: parseInt(e.target.value) })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-white/50 mt-1">
                            <span>50 (Focused)</span>
                            <span>500 (Diverse)</span>
                          </div>
                        </div>

                        {/* Top-P */}
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">
                            Top-P: {settings.topP.toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={settings.topP}
                            onChange={(e) => onSettingsChange({ topP: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-white/50 mt-1">
                            <span>0.0 (Disabled)</span>
                            <span>1.0 (Max)</span>
                          </div>
                        </div>

                        {/* CFG Scale */}
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">
                            CFG Scale: {settings.cfgScale.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="1.0"
                            max="10.0"
                            step="0.5"
                            value={settings.cfgScale}
                            onChange={(e) => onSettingsChange({ cfgScale: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-white/50 mt-1">
                            <span>1.0 (Loose)</span>
                            <span>10.0 (Strict)</span>
                          </div>
                        </div>

                        <div className="text-xs text-white/50 bg-white/5 rounded p-2">
                          <strong>Tips:</strong><br/>
                          • Higher Top-K = more variety<br/>
                          • Top-P controls nucleus sampling<br/>
                          • Higher CFG = closer to prompt
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={resetToDefaults}
                      className="w-full flex items-center justify-center space-x-2 glass-button rounded-lg py-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* History Controls */}
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          showFavoritesOnly
                            ? "glass-button text-white"
                            : "text-white/60 hover:text-white/80"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Favorites</span>
                      </button>
                    </div>

                    <button
                      onClick={onClearHistory}
                      className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* History List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center text-white/60 py-8">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {showFavoritesOnly
                            ? "No favorites yet"
                            : "No history yet"}
                        </p>
                      </div>
                    ) : (
                      filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="glass-dark rounded-lg p-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-white/90 line-clamp-2 flex-1">
                              {item.prompt}
                            </p>
                            <button
                              onClick={() => onToggleFavorite(item.id)}
                              className={`ml-2 p-1 rounded transition-colors ${
                                favorites.includes(item.id)
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-white/40 hover:text-white/60"
                              }`}
                            >
                              <Heart
                                className={`w-3 h-3 ${
                                  favorites.includes(item.id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            <span>{item.settings.duration}s</span>
                          </div>

                          {item.mood && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                                {item.mood}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
);

export default Sidebar;
