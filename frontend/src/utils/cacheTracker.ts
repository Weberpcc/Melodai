// Utility to track cache hits during music generation
import { getGlobalCacheStats } from '../hooks/useCacheStats';

export interface GenerationRequest {
  prompt: string;
  settings: any;
  timestamp: number;
}

export interface GenerationResult {
  success: boolean;
  fromCache: boolean;
  generationTime: number;
  audioUrl?: string;
}

// Simple cache key generation based on prompt and settings
const generateCacheKey = (request: GenerationRequest): string => {
  const settingsStr = JSON.stringify(request.settings);
  return btoa(`${request.prompt}:${settingsStr}`).replace(/[^a-zA-Z0-9]/g, '');
};

// Simulate cache checking (in real app, this would check backend cache)
const checkCache = (cacheKey: string): boolean => {
  const cachedRequests = JSON.parse(localStorage.getItem('melodai-cached-requests') || '[]');
  return cachedRequests.includes(cacheKey);
};

// Store request in cache simulation
const storeInCache = (cacheKey: string): void => {
  const cachedRequests = JSON.parse(localStorage.getItem('melodai-cached-requests') || '[]');
  if (!cachedRequests.includes(cacheKey)) {
    cachedRequests.push(cacheKey);
    // Keep only last 100 requests to simulate cache eviction
    if (cachedRequests.length > 100) {
      cachedRequests.shift();
    }
    localStorage.setItem('melodai-cached-requests', JSON.stringify(cachedRequests));
  }
};

export const trackGeneration = async (
  request: GenerationRequest,
  generateMusic: () => Promise<any>
): Promise<GenerationResult> => {
  const cacheKey = generateCacheKey(request);
  const isInCache = checkCache(cacheKey);
  
  try {
    // Update cache statistics
    const cacheStats = getGlobalCacheStats();
    cacheStats.updateHitRate(isInCache);
    
    const startTime = Date.now();
    
    if (isInCache) {
      // Simulate faster generation from cache
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      return {
        success: true,
        fromCache: true,
        generationTime: Date.now() - startTime,
        audioUrl: '/audio/sample1.mp3' // Placeholder for cached result
      };
    } else {
      // Actual generation
      const result = await generateMusic();
      
      // Store in cache for future requests
      if (result.success) {
        storeInCache(cacheKey);
      }
      
      return {
        success: result.success,
        fromCache: false,
        generationTime: Date.now() - startTime,
        audioUrl: result.audioUrl
      };
    }
  } catch (error) {
    console.error('Generation tracking error:', error);
    return {
      success: false,
      fromCache: false,
      generationTime: 0
    };
  }
};

// Initialize some cached requests for demo purposes
export const initializeDemoCache = (): void => {
  const existingCache = localStorage.getItem('melodai-cached-requests');
  if (!existingCache) {
    const demoRequests = [
      'upbeat electronic music',
      'peaceful piano melody',
      'ambient soundscape',
      'jazz fusion track',
      'orchestral theme'
    ].map(prompt => generateCacheKey({
      prompt,
      settings: { duration: 30, creativity: 1.0, model: 'musicgen-medium' },
      timestamp: Date.now()
    }));
    
    localStorage.setItem('melodai-cached-requests', JSON.stringify(demoRequests));
  }
};