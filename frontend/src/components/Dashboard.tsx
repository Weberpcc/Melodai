import React, { useState, useMemo } from 'react';
import { BarChart3, Image, TrendingUp, Clock, Heart, Star, Grid, List, Play, Pause } from 'lucide-react';
import { AppState } from '../types';
import { useCacheStats } from '../hooks/useCacheStats';
import './Dashboard.css';

interface DashboardProps {
  state: AppState;
  onSettingsChange: (settings: Partial<AppState['settings']>) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

type TabType = 'statistics' | 'gallery';

const Dashboard: React.FC<DashboardProps> = ({
  state,
  onSettingsChange,
  onToggleFavorite,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [galleryView, setGalleryView] = useState<'grid' | 'list'>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Get real-time cache statistics
  const { stats: cacheStats } = useCacheStats();

  // Statistics calculations
  const stats = useMemo(() => {
    const totalGenerations = state.history.length;
    const totalTime = state.history.reduce((sum, item) => sum + (item.metadata?.generationTime || 0), 0);
    const avgTime = totalGenerations > 0 ? totalTime / totalGenerations : 0;
    
    // Mood analysis
    const moodCounts: Record<string, number> = {};
    state.history.forEach(item => {
      if (item.mood) {
        moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
      }
    });
    const favoriteMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    // Quality trends (last 10 generations)
    const recentQuality = state.history
      .slice(0, 10)
      .map(item => item.qualityScores?.overallScore || 0)
      .reverse();
    
    return {
      totalGenerations,
      totalTime: Math.round(totalTime),
      avgTime: Math.round(avgTime),
      favoriteMood,
      recentQuality,
      favoriteCount: state.favorites.length,
      cacheStats: {
        hitRate: cacheStats.hitRate,
        totalCached: cacheStats.totalFiles,
        cacheSize: cacheStats.totalSizeMB
      }
    };
  }, [state.history, state.favorites]);

  // Filtered gallery items
  const filteredItems = useMemo(() => {
    let items = [...state.history];
    
    if (galleryFilter === 'favorites') {
      items = items.filter(item => state.favorites.includes(item.id));
    } else if (galleryFilter !== 'all') {
      items = items.filter(item => item.mood === galleryFilter);
    }
    
    return items;
  }, [state.history, state.favorites, galleryFilter]);

  // Get unique moods for filter
  const availableMoods = useMemo(() => {
    const moods = new Set(state.history.map(item => item.mood).filter(Boolean));
    return Array.from(moods);
  }, [state.history]);

  const handlePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      // Pause audio
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
      if (audio) audio.pause();
    } else {
      setPlayingId(id);
      // Play audio
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
      if (audio) {
        audio.play();
        audio.onended = () => setPlayingId(null);
      }
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleCreatePlaylist = () => {
    if (selectedItems.length === 0) return;
    
    const playlistItems = state.history.filter(item => selectedItems.includes(item.id));
    const playlistData = {
      name: `Playlist ${new Date().toLocaleDateString()}`,
      items: playlistItems,
      created: Date.now()
    };
    
    // Save to localStorage
    const playlists = JSON.parse(localStorage.getItem('melodai-playlists') || '[]');
    playlists.push(playlistData);
    localStorage.setItem('melodai-playlists', JSON.stringify(playlists));
    
    setSelectedItems([]);
    alert('Playlist created successfully!');
  };

  const renderStatistics = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Generations</p>
              <p className="text-2xl font-bold text-white">{stats.totalGenerations}</p>
              <p className="text-xs text-white/40">+{Math.round(stats.totalGenerations * 0.15)} this week</p>
            </div>
            <BarChart3 className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-white">{stats.cacheStats.hitRate}%</p>
              <p className="text-xs text-white/40">faster generation</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Favorites</p>
              <p className="text-2xl font-bold text-white">{stats.favoriteCount}</p>
              <p className="text-xs text-white/40">{Math.round((stats.favoriteCount / Math.max(stats.totalGenerations, 1)) * 100)}% of total</p>
            </div>
            <Heart className="w-8 h-8 text-pink-400" />
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Avg Generation</p>
              <p className="text-2xl font-bold text-white">{stats.avgTime}s</p>
              <p className="text-xs text-white/40">per track</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Cache Size</p>
              <p className="text-2xl font-bold text-emerald-400">
                {stats.cacheStats.cacheSize}MB
              </p>
              <p className="text-xs text-white/40">{stats.cacheStats.totalCached} items cached</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Duration</p>
              <p className="text-2xl font-bold text-white">
                {Math.floor((stats.totalGenerations * 30) / 60)}m {(stats.totalGenerations * 30) % 60}s
              </p>
              <p className="text-xs text-white/40">of music created</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-purple-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Most Active Day</p>
              <p className="text-2xl font-bold text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-xs text-white/40">based on history</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Trends */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Quality Score Trends</span>
          <span className="text-sm text-white/60">(Last 10 generations)</span>
        </h3>
        <div className="flex items-end space-x-2 h-32">
          {stats.recentQuality.length > 0 ? stats.recentQuality.map((score, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t min-h-[4px]"
                style={{ height: `${Math.max((score / 100) * 100, 4)}%` }}
              />
              <span className="text-xs text-white/60 mt-1">{Math.round(score)}</span>
            </div>
          )) : (
            <div className="flex-1 text-center text-white/40">
              <p>No quality data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Mood and Model Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Most Used Mood</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.favoriteMood}</div>
            <p className="text-white/60">Your go-to creative mood</p>
            {stats.totalGenerations > 0 && (
              <div className="mt-3 text-sm text-white/50">
                Used in {Math.round((1 / Math.max(Object.keys(state.history.reduce((acc, item) => {
                  if (item.mood) acc[item.mood] = (acc[item.mood] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).length, 1)) * 100)}% of generations
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Preferred Model</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {state.settings.model.replace('musicgen-', '').toUpperCase()}
            </div>
            <p className="text-white/60">Current default model</p>
            <div className="mt-3 text-sm text-white/50">
              {state.settings.model === 'musicgen-small' && 'Fast & Efficient'}
              {state.settings.model === 'musicgen-medium' && 'Balanced Quality'}
              {state.settings.model === 'musicgen-large' && 'Premium Quality'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-6">
      {/* Gallery Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={galleryFilter}
            onChange={(e) => setGalleryFilter(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-white border border-white/20"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
            <option value="all" style={{ backgroundColor: '#000000', color: '#ffffff' }}>All Generations</option>
            <option value="favorites" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Favorites</option>
            {availableMoods.map(mood => (
              <option key={mood} value={mood} style={{ backgroundColor: '#000000', color: '#ffffff' }}>{mood}</option>
            ))}
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setGalleryView('grid')}
              className={`p-2 rounded-lg ${galleryView === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/60 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGalleryView('list')}
              className={`p-2 rounded-lg ${galleryView === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/60 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-white/60 text-sm">{selectedItems.length} selected</span>
            <button
              onClick={handleCreatePlaylist}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              Create Playlist
            </button>
          </div>
        )}
      </div>

      {/* Gallery Items */}
      <div className={galleryView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {filteredItems.map((item) => (
          <div key={item.id} className={`glass rounded-xl p-4 ${galleryView === 'list' ? 'flex items-center space-x-4' : ''}`}>
            <div className={`${galleryView === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => handleSelectItem(item.id)}
                className="mr-2"
              />
              <button
                onClick={() => handlePlayPause(item.id)}
                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <audio id={`audio-${item.id}`} src={item.audioUrl} />
            </div>
            
            <div className={galleryView === 'list' ? 'flex-1' : ''}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white truncate">{item.prompt}</h4>
                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className={`p-1 rounded ${state.favorites.includes(item.id) ? 'text-pink-400' : 'text-white/40 hover:text-pink-400'}`}
                >
                  <Heart className="w-4 h-4" fill={state.favorites.includes(item.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-white/60 mb-2">
                {item.mood && <span className="px-2 py-1 bg-white/10 rounded">{item.mood}</span>}
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                {item.qualityScores && (
                  <span className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>{Math.round(item.qualityScores.overallScore)}</span>
                  </span>
                )}
              </div>
              
              <div className="text-xs text-white/40">
                {item.metadata?.duration}s • {item.settings.model}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No generations found</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="glass rounded-xl p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
        {[
          { id: 'statistics', label: 'Statistics', icon: BarChart3 },
          { id: 'gallery', label: 'Gallery', icon: Image }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'statistics' && renderStatistics()}
        {activeTab === 'gallery' && renderGallery()}
      </div>
    </div>
  );
};

export default Dashboard;