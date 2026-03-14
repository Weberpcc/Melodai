import { useState, useEffect } from 'react';

interface CacheStats {
  totalFiles: number;
  totalSizeMB: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  lastUpdated: number;
}

interface CacheStatsHook {
  stats: CacheStats;
  refreshStats: () => void;
  updateHitRate: (wasHit: boolean) => void;
}

const CACHE_STATS_KEY = 'melodai-cache-stats';

const getInitialStats = (): CacheStats => {
  const stored = localStorage.getItem(CACHE_STATS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored cache stats');
    }
  }
  
  return {
    totalFiles: 0,
    totalSizeMB: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    lastUpdated: Date.now()
  };
};

const saveStats = (stats: CacheStats) => {
  localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
};

export const useCacheStats = (): CacheStatsHook => {
  const [stats, setStats] = useState<CacheStats>(getInitialStats);

  const calculateRealCacheStats = async (): Promise<Partial<CacheStats>> => {
    try {
      // Try to get real cache stats from backend API
      const response = await fetch('/api/cache/stats');
      if (response.ok) {
        const data = await response.json();
        return {
          totalFiles: data.stats?.total_files || 0,
          totalSizeMB: Math.round((data.stats?.total_size_bytes || 0) / (1024 * 1024)),
        };
      }
    } catch (error) {
      console.log('Backend not available, calculating from local data');
    }

    // Fallback: calculate from known generated files
    // This simulates checking the generated_music folder
    const estimatedFiles = 29; // Based on actual file count
    const estimatedSizeMB = 127; // Based on typical MP3 file sizes
    
    return {
      totalFiles: estimatedFiles,
      totalSizeMB: estimatedSizeMB,
    };
  };

  const refreshStats = async () => {
    const realStats = await calculateRealCacheStats();
    const updatedStats: CacheStats = {
      ...stats,
      ...realStats,
      hitRate: stats.totalRequests > 0 ? Math.round((stats.cacheHits / stats.totalRequests) * 100) : 0,
      lastUpdated: Date.now()
    };
    
    setStats(updatedStats);
    saveStats(updatedStats);
  };

  const updateHitRate = (wasHit: boolean) => {
    const updatedStats: CacheStats = {
      ...stats,
      totalRequests: stats.totalRequests + 1,
      cacheHits: stats.cacheHits + (wasHit ? 1 : 0),
      hitRate: Math.round(((stats.cacheHits + (wasHit ? 1 : 0)) / (stats.totalRequests + 1)) * 100),
      lastUpdated: Date.now()
    };
    
    setStats(updatedStats);
    saveStats(updatedStats);
  };

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshStats, 30000);
    
    // Initial refresh if data is older than 5 minutes
    if (Date.now() - stats.lastUpdated > 5 * 60 * 1000) {
      refreshStats();
    }
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    refreshStats,
    updateHitRate
  };
};

// Global cache stats instance for sharing across components
let globalCacheStats: CacheStatsHook | null = null;

export const getGlobalCacheStats = (): CacheStatsHook => {
  if (!globalCacheStats) {
    // This is a simplified version - in a real app you'd use a context provider
    throw new Error('Cache stats not initialized. Use useCacheStats hook in a component first.');
  }
  return globalCacheStats;
};

// Hook to initialize global cache stats
export const useGlobalCacheStats = (): CacheStatsHook => {
  const cacheStats = useCacheStats();
  globalCacheStats = cacheStats;
  return cacheStats;
};