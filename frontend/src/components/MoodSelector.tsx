import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MoodOption } from '../types';

interface MoodSelectorProps {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
  disabled?: boolean;
}

const moods: MoodOption[] = [
  { id: 'happy', label: 'Happy', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', description: 'Upbeat and joyful' },
  { id: 'sad', label: 'Sad', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', description: 'Melancholic and emotional' },
  { id: 'energetic', label: 'Energetic', color: 'bg-red-500/20 text-red-300 border-red-500/30', description: 'High energy and dynamic' },
  { id: 'calm', label: 'Calm', color: 'bg-green-500/20 text-green-300 border-green-500/30', description: 'Peaceful and relaxing' },
  { id: 'mysterious', label: 'Mysterious', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30', description: 'Dark and intriguing' },
  { id: 'romantic', label: 'Romantic', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', description: 'Love and passion' },
  { id: 'epic', label: 'Epic', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', description: 'Grand and cinematic' },
  { id: 'nostalgic', label: 'Nostalgic', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', description: 'Wistful and reminiscent' }
];

const MOODS_PER_PAGE = 4;

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodChange,
  disabled = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(moods.length / MOODS_PER_PAGE);
  const startIndex = currentPage * MOODS_PER_PAGE;
  const visibleMoods = moods.slice(startIndex, startIndex + MOODS_PER_PAGE);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Select Mood</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || disabled}
            className="glass-button rounded-full p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/60">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1 || disabled}
            className="glass-button rounded-full p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {visibleMoods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodChange(selectedMood === mood.id ? '' : mood.id)}
            disabled={disabled}
            className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMood === mood.id
                ? `${mood.color} border-2`
                : 'glass-button text-white/80 hover:text-white border-white/20 hover:border-white/40'
            }`}
          >
            <div className="text-sm font-medium">{mood.label}</div>
            <div className="text-xs opacity-80 mt-1">{mood.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;