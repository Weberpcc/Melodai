import React from 'react';
import InputSection from './InputSection';
import OutputSection from './OutputSection';
import { GenerationSettings, GenerationResult } from '../types';

interface MainContentProps {
  sidebarOpen: boolean;
  settings: GenerationSettings;
  currentOutput: GenerationResult | null;
  isGenerating: boolean;
  onGenerate: (result: GenerationResult) => void;
  onSetGenerating: (generating: boolean) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  history: GenerationResult[];
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
  onFeedbackSubmit?: (feedback: any) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  sidebarOpen,
  settings,
  currentOutput,
  isGenerating,
  onGenerate,
  onSetGenerating,
  onToggleFavorite,
  isFavorite,
  history,
  onSettingsChange,
  onFeedbackSubmit
}) => {
  return (
    <main className={`flex-1 transition-all duration-300 ${
      sidebarOpen ? 'ml-80' : 'ml-0'
    } p-4`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Input Section */}
        <InputSection
          settings={settings}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          onSetGenerating={onSetGenerating}
          history={history}
        />

        {/* Output Section */}
        {(currentOutput || isGenerating) && (
          <OutputSection
            result={currentOutput}
            isGenerating={isGenerating}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            settings={settings}
            onFeedbackSubmit={onFeedbackSubmit || (() => {})}
          />
        )}
      </div>
    </main>
  );
};

export default MainContent;