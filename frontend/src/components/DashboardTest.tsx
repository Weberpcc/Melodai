import React from 'react';
import Dashboard from './Dashboard';
import { AppState } from '../types';

// Test component to verify dashboard functionality
const DashboardTest: React.FC = () => {
  const mockState: AppState = {
    history: [
      {
        id: '1',
        timestamp: Date.now() - 86400000, // 1 day ago
        prompt: 'Upbeat electronic music for working out',
        enhancedPrompt: 'Energetic electronic music with driving beats, perfect for high-intensity workouts',
        audioUrl: '/test-audio-1.mp3',
        settings: {
          duration: 30,
          creativity: 1.2,
          model: 'musicgen-medium',
          topK: 250,
          topP: 0.0,
          cfgScale: 3.0,
          expertMode: false
        },
        metadata: {
          duration: 30,
          sampleRate: 44100,
          model: 'musicgen-medium',
          generationTime: 45
        },
        mood: 'energetic',
        tags: ['workout', 'electronic'],
        qualityScores: {
          audioQuality: 85,
          durationAccuracy: 92,
          silenceDetection: 88,
          dynamicRange: 78,
          frequencyBalance: 82,
          overallScore: 85
        }
      },
      {
        id: '2',
        timestamp: Date.now() - 172800000, // 2 days ago
        prompt: 'Relaxing piano melody for studying',
        enhancedPrompt: 'Gentle piano composition with soft harmonies, ideal for focused study sessions',
        audioUrl: '/test-audio-2.mp3',
        settings: {
          duration: 60,
          creativity: 0.8,
          model: 'musicgen-large',
          topK: 200,
          topP: 0.1,
          cfgScale: 2.5,
          expertMode: true
        },
        metadata: {
          duration: 60,
          sampleRate: 44100,
          model: 'musicgen-large',
          generationTime: 78
        },
        mood: 'calm',
        tags: ['study', 'piano'],
        qualityScores: {
          audioQuality: 92,
          durationAccuracy: 95,
          silenceDetection: 90,
          dynamicRange: 88,
          frequencyBalance: 91,
          overallScore: 91
        }
      },
      {
        id: '3',
        timestamp: Date.now() - 259200000, // 3 days ago
        prompt: 'Jazz fusion with saxophone',
        enhancedPrompt: 'Smooth jazz fusion featuring prominent saxophone melodies with complex harmonies',
        audioUrl: '/test-audio-3.mp3',
        settings: {
          duration: 45,
          creativity: 1.5,
          model: 'musicgen-medium',
          topK: 300,
          topP: 0.2,
          cfgScale: 3.5,
          expertMode: true
        },
        metadata: {
          duration: 45,
          sampleRate: 44100,
          model: 'musicgen-medium',
          generationTime: 62
        },
        mood: 'sophisticated',
        tags: ['jazz', 'saxophone'],
        qualityScores: {
          audioQuality: 88,
          durationAccuracy: 89,
          silenceDetection: 85,
          dynamicRange: 92,
          frequencyBalance: 87,
          overallScore: 88
        }
      }
    ],
    favorites: ['1', '3'], // First and third generations are favorites
    currentOutput: null,
    isGenerating: false,
    settings: {
      duration: 30,
      creativity: 1.0,
      model: 'musicgen-medium',
      topK: 250,
      topP: 0.0,
      cfgScale: 3.0,
      expertMode: false
    },
    feedbackHistory: []
  };

  const handleSettingsChange = (settings: Partial<AppState['settings']>) => {
    console.log('Settings changed:', settings);
  };

  const handleToggleFavorite = (id: string) => {
    console.log('Toggle favorite:', id);
  };

  const handleClearHistory = () => {
    console.log('Clear history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard Test</h1>
        <Dashboard
          state={mockState}
          onSettingsChange={handleSettingsChange}
          onToggleFavorite={handleToggleFavorite}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
};

export default DashboardTest;