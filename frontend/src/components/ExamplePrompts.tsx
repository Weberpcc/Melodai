import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { ExamplePrompt } from '../types';

interface ExamplePromptsProps {
  onExampleClick: (example: ExamplePrompt) => void;
  disabled?: boolean;
}

const allExamples: ExamplePrompt[] = [
  { id: '1', text: 'A peaceful piano melody with soft strings, perfect for studying', category: 'Ambient', mood: 'calm' },
  { id: '2', text: 'Upbeat electronic dance music with heavy bass and synthesizers', category: 'Electronic', mood: 'energetic' },
  { id: '3', text: 'Melancholic acoustic guitar with gentle rain sounds in the background', category: 'Acoustic', mood: 'sad' },
  { id: '4', text: 'Epic orchestral soundtrack with powerful brass and dramatic percussion', category: 'Orchestral', mood: 'epic' },
  { id: '5', text: 'Smooth jazz with saxophone and soft drums for a romantic evening', category: 'Jazz', mood: 'romantic' },
  { id: '6', text: 'Energetic rock anthem with electric guitars and driving drums', category: 'Rock', mood: 'energetic' },
  { id: '7', text: 'Mysterious ambient soundscape with ethereal pads and distant echoes', category: 'Ambient', mood: 'mysterious' },
  { id: '8', text: 'Happy folk tune with acoustic guitar, banjo, and harmonica', category: 'Folk', mood: 'happy' },
  { id: '9', text: 'Nostalgic synthwave track with retro synthesizers and drum machines', category: 'Synthwave', mood: 'nostalgic' },
  { id: '10', text: 'Calming nature sounds with gentle flute and soft chimes', category: 'Nature', mood: 'calm' },
  { id: '11', text: 'Intense metal track with heavy guitars and aggressive drums', category: 'Metal', mood: 'energetic' },
  { id: '12', text: 'Dreamy lo-fi hip hop with vinyl crackle and mellow beats', category: 'Lo-fi', mood: 'calm' },
  { id: '13', text: 'Classical baroque piece with harpsichord and string quartet', category: 'Classical', mood: 'nostalgic' },
  { id: '14', text: 'Tropical house music with steel drums and ocean waves', category: 'Tropical', mood: 'happy' },
  { id: '15', text: 'Dark cinematic score with ominous strings and haunting choir', category: 'Cinematic', mood: 'mysterious' },
  { id: '16', text: 'Cheerful children\'s song with xylophone and playful melodies', category: 'Children', mood: 'happy' },
  { id: '17', text: 'Meditative tibetan singing bowls with soft ambient drones', category: 'Meditation', mood: 'calm' },
  { id: '18', text: 'Funky disco track with slap bass and groovy rhythm guitar', category: 'Disco', mood: 'energetic' },
  { id: '19', text: 'Emotional ballad with piano and strings building to climax', category: 'Ballad', mood: 'sad' },
  { id: '20', text: 'Adventurous video game music with chiptune elements', category: 'Chiptune', mood: 'energetic' },
  { id: '21', text: 'Relaxing spa music with water sounds and gentle harp', category: 'Spa', mood: 'calm' },
  { id: '22', text: 'Dramatic tango with accordion and passionate violin', category: 'Tango', mood: 'romantic' },
  { id: '23', text: 'Mystical Celtic music with flute, harp, and bodhrán drum', category: 'Celtic', mood: 'mysterious' },
  { id: '24', text: 'Uplifting gospel choir with organ and hand claps', category: 'Gospel', mood: 'happy' },
  { id: '25', text: 'Ambient space music with cosmic sounds and ethereal textures', category: 'Space', mood: 'mysterious' }
];

const EXAMPLES_PER_PAGE = 2;

const ExamplePrompts: React.FC<ExamplePromptsProps> = ({
  onExampleClick,
  disabled = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(allExamples.length / EXAMPLES_PER_PAGE);
  const startIndex = currentPage * EXAMPLES_PER_PAGE;
  const visibleExamples = allExamples.slice(startIndex, startIndex + EXAMPLES_PER_PAGE);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-300" />
          <span>Examples</span>
        </h3>
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
      
      <div className="space-y-3">
        {visibleExamples.map((example) => (
          <button
            key={example.id}
            onClick={() => onExampleClick(example)}
            disabled={disabled}
            className="w-full glass-button rounded-lg p-3 text-left hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-sm text-white/90 mb-2">
              "{example.text}"
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded">
                {example.category}
              </span>
              <span className="text-xs text-white/60 capitalize">
                {example.mood}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExamplePrompts;