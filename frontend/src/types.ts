export interface GenerationSettings {
  duration: number;
  creativity: number;
  model: string;
  topK: number;
  topP: number;
  cfgScale: number;
  expertMode: boolean;
}

export interface QualityScores {
  audioQuality: number;
  durationAccuracy: number;
  silenceDetection: number;
  dynamicRange: number;
  frequencyBalance: number;
  overallScore: number;
}

export interface UserFeedback {
  id: string;
  generationId: string;
  rating: number; // 1-5 stars
  thumbsUp: boolean | null;
  category: 'perfect' | 'doesnt_match_mood' | 'poor_quality' | 'too_repetitive' | 'other';
  comment?: string;
  timestamp: number;
}

export interface GenerationResult {
  id: string;
  timestamp: number;
  prompt: string;
  enhancedPrompt: string;
  audioUrl: string;
  settings: GenerationSettings;
  metadata: {
    duration: number;
    sampleRate: number;
    model: string;
    generationTime: number;
  };
  mood?: string;
  tags?: string[];
  qualityScores?: QualityScores;
  userFeedback?: UserFeedback;
}

export interface AppState {
  history: GenerationResult[];
  favorites: string[];
  currentOutput: GenerationResult | null;
  isGenerating: boolean;
  settings: GenerationSettings;
  feedbackHistory: UserFeedback[];
}

export interface MoodOption {
  id: string;
  label: string;
  color: string;
  description: string;
}

export interface ContextTag {
  id: string;
  label: string;
  icon: string;
}

export interface ExamplePrompt {
  id: string;
  text: string;
  category: string;
  mood: string;
}

export interface AudioEffect {
  eq?: {
    low: number;
    mid: number;
    high: number;
  };
  compression?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  reverb?: {
    room_size: number;
    damping: number;
    wet_level: number;
  };
  limiter?: {
    threshold: number;
    release: number;
  };
  stereo_width?: number;
}

export interface AudioPreset {
  name: string;
  description: string;
  effects: AudioEffect;
}

export interface AudioAnalysis {
  duration: number;
  sample_rate: number;
  channels: number;
  spectogram: {
    data: number[][];
    frequencies: number[];
    times: number[];
  };
  dominant_frequencies: Array<{
    frequency: number;
    magnitude: number;
  }>;
  tempo: number;
  beats: number[];
  key: string;
  key_confidence: number;
  rms_mean: number;
  rms_std: number;
  zero_crossing_rate: number;
  spectral_centroid_mean: number;
  spectral_rolloff_mean: number;
}

export interface AudioComparison {
  rms_change_db: number;
  peak_change_db: number;
  spectral_difference: number;
  dynamic_range_original: number;
  dynamic_range_processed: number;
}

export interface ExportSettings {
  formats: string[];
  quality: {
    bitrate?: string;
    sample_rate?: number;
    metadata?: {
      title?: string;
      artist?: string;
      album?: string;
      genre?: string;
    };
  };
}