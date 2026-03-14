import React, { useState } from 'react';
import { 
  BookOpen, 
  Zap, 
  Dumbbell, 
  Moon, 
  Coffee, 
  Car, 
  Gamepad2, 
  Heart,
  Briefcase,
  Home,
  Plane,
  Camera,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ContextTag } from '../types';

interface ContextTagsProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

const contextTags: ContextTag[] = [
  { id: 'study', label: 'Study', icon: 'BookOpen' },
  { id: 'party', label: 'Party', icon: 'Zap' },
  { id: 'exercise', label: 'Exercise', icon: 'Dumbbell' },
  { id: 'sleep', label: 'Sleep', icon: 'Moon' },
  { id: 'work', label: 'Work', icon: 'Briefcase' },
  { id: 'driving', label: 'Driving', icon: 'Car' },
  { id: 'gaming', label: 'Gaming', icon: 'Gamepad2' },
  { id: 'meditation', label: 'Meditation', icon: 'Heart' },
  { id: 'morning', label: 'Morning', icon: 'Coffee' },
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'travel', label: 'Travel', icon: 'Plane' },
  { id: 'creative', label: 'Creative', icon: 'Camera' }
];

const iconComponents = {
  BookOpen,
  Zap,
  Dumbbell,
  Moon,
  Coffee,
  Car,
  Gamepad2,
  Heart,
  Briefcase,
  Home,
  Plane,
  Camera,
  ChevronLeft,
  ChevronRight
};

const TAGS_PER_PAGE = 6;

const ContextTags: React.FC<ContextTagsProps> = ({
  selectedTags,
  onTagsChange,
  disabled = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(contextTags.length / TAGS_PER_PAGE);
  const startIndex = currentPage * TAGS_PER_PAGE;
  const visibleTags = contextTags.slice(startIndex, startIndex + TAGS_PER_PAGE);

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Context Tags</h3>
          <p className="text-xs text-white/60 mt-1">Select usage situations</p>
        </div>
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
      
      <div className="grid grid-cols-3 gap-3">
        {visibleTags.map((tag) => {
          const IconComponent = iconComponents[tag.icon as keyof typeof iconComponents];
          const isSelected = selectedTags.includes(tag.id);
          
          return (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              disabled={disabled}
              className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center space-y-2 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 border-2'
                  : 'glass-button text-white/80 hover:text-white border-white/20 hover:border-white/40'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs font-medium">{tag.label}</span>
            </button>
          );
        })}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-white/70">
            Selected: {selectedTags.map(id => contextTags.find(tag => tag.id === id)?.label).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextTags;