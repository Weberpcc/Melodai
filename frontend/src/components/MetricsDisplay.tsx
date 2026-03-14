import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  ThumbsUp, 
  Cpu, 
  Clock,
  RefreshCw,
  Database
} from 'lucide-react';

interface FeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  thumbs_up_ratio: number;
}

interface ModelMetrics {
  currentModel: string | null;
  loadedModels: string[];
  models: Array<{
    id: string;
    name: string;
    params: string;
    speed: string;
    quality: string;
    memoryGB: number;
    estimatedTime: number;
  }>;
}

const MetricsDisplay: React.FC = () => {
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'models'>('feedback');

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Load feedback stats with timeout
      try {
        const controller1 = new AbortController();
        const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
        
        const feedbackResponse = await fetch('http://localhost:5000/api/feedback/stats', {
          signal: controller1.signal,
        });
        
        clearTimeout(timeoutId1);
        
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setFeedbackStats(feedbackData.stats);
        }
      } catch (error) {
        console.error('Failed to load feedback stats:', error);
      }

      // Load model metrics with timeout
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
        
        const modelsResponse = await fetch('http://localhost:5000/api/models', {
          signal: controller2.signal,
        });
        
        clearTimeout(timeoutId2);
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          setModelMetrics(modelsData);
        }
      } catch (error) {
        console.error('Failed to load model metrics:', error);
      }
      
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="ml-2 text-white">Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>System Metrics</span>
        </h3>
        
        <button
          onClick={loadMetrics}
          className="glass-button rounded-lg p-2 text-white/80 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-l-lg transition-colors ${
            activeTab === 'feedback'
              ? 'glass-button text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm">User Feedback</span>
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-r-lg transition-colors ${
            activeTab === 'models'
              ? 'glass-button text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span className="text-sm">Model Status</span>
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && feedbackStats && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{feedbackStats.total_feedback}</div>
              <div className="text-xs text-white/60">Total Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {feedbackStats.average_rating.toFixed(1)}
              </div>
              <div className="text-xs text-white/60">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {(feedbackStats.thumbs_up_ratio * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-white/60">Thumbs Up</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Object.keys(feedbackStats.category_distribution).length}
              </div>
              <div className="text-xs text-white/60">Categories</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Rating Distribution</span>
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = feedbackStats.rating_distribution[rating.toString()] || 0;
                const percentage = feedbackStats.total_feedback > 0 
                  ? (count / feedbackStats.total_feedback) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-12">
                      <span className="text-sm text-white/70">{rating}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4" />
              <span>Feedback Categories</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(feedbackStats.category_distribution).map(([category, count]) => {
                const percentage = feedbackStats.total_feedback > 0 
                  ? (count / feedbackStats.total_feedback) * 100 
                  : 0;
                
                return (
                  <div key={category} className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-white/70 truncate">
                      {formatCategory(category)}
                    </div>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && modelMetrics && (
        <div className="space-y-6">
          {/* Model Status */}
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Model Status</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-dark rounded-lg p-3">
                <div className="text-sm text-white/60">Current Model</div>
                <div className="text-white font-medium">
                  {modelMetrics.currentModel || 'None loaded'}
                </div>
              </div>
              <div className="glass-dark rounded-lg p-3">
                <div className="text-sm text-white/60">Loaded Models</div>
                <div className="text-white font-medium">
                  {modelMetrics.loadedModels.length} / {modelMetrics.models.length}
                </div>
              </div>
            </div>
          </div>

          {/* Model Comparison */}
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Model Comparison</span>
            </h4>
            <div className="space-y-3">
              {modelMetrics.models.map((model) => (
                <div key={model.id} className="glass-dark rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white">{model.name}</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      modelMetrics.loadedModels.includes(model.id)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {modelMetrics.loadedModels.includes(model.id) ? 'Loaded' : 'Available'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-white/50">Params:</span>
                      <div className="text-white/80">{model.params}</div>
                    </div>
                    <div>
                      <span className="text-white/50">Speed:</span>
                      <div className="text-white/80">{model.speed}</div>
                    </div>
                    <div>
                      <span className="text-white/50">Quality:</span>
                      <div className="text-white/80">{model.quality}</div>
                    </div>
                    <div>
                      <span className="text-white/50">Memory:</span>
                      <div className="text-white/80">{model.memoryGB}GB</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-white/60">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>~{model.estimatedTime}s for 30s audio</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data States */}
      {activeTab === 'feedback' && (!feedbackStats || feedbackStats.total_feedback === 0) && (
        <div className="text-center py-8">
          <Database className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <p className="text-white/60">No feedback data available yet</p>
          <p className="text-white/40 text-sm">Generate some music and collect feedback to see metrics</p>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;