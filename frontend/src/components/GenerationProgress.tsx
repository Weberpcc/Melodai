import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Zap, Music } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  currentStage?: string;
  progress?: number; // 0-100 percentage
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isGenerating,
  currentStage = 'processing',
  progress
}) => {
  const [estimatedProgress, setEstimatedProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const stages = [
    { id: 'processing', label: 'Processing Input', icon: Clock, description: 'Analyzing your request with AI', duration: 5 },
    { id: 'enhancing', label: 'Enhancing Prompt', icon: Zap, description: 'Optimizing prompt for best results', duration: 10 },
    { id: 'generating', label: 'Generating Music', icon: Music, description: 'Creating your unique audio', duration: 45 },
    { id: 'complete', label: 'Complete', icon: CheckCircle, description: 'Your music is ready!', duration: 0 }
  ];

  // Auto-increment progress estimation when no real progress is provided
  useEffect(() => {
    if (!isGenerating) {
      setEstimatedProgress(0);
      setTimeElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      if (progress === undefined) {
        // Estimate progress based on current stage and time elapsed
        const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
        const totalDuration = stages.slice(0, -1).reduce((sum, stage) => sum + stage.duration, 0);
        const completedDuration = stages.slice(0, currentStageIndex).reduce((sum, stage) => sum + stage.duration, 0);
        const currentStageDuration = stages[currentStageIndex]?.duration || 0;
        
        // Estimate progress within current stage (slower approach to avoid overshooting)
        const stageProgress = Math.min(timeElapsed / currentStageDuration, 1) * 0.8; // Cap at 80% to avoid completion before actual finish
        const overallProgress = ((completedDuration + (stageProgress * currentStageDuration)) / totalDuration) * 100;
        
        setEstimatedProgress(Math.min(overallProgress, 95)); // Never show 100% until actually complete
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, currentStage, progress, timeElapsed]);

  if (!isGenerating) return null;

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  const displayProgress = progress !== undefined ? progress : estimatedProgress;

  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-300"></div>
          <span>Generating Your Music...</span>
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">{Math.round(displayProgress)}%</div>
          <div className="text-xs text-white/60">{timeElapsed}s elapsed</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/60 mt-1">
          <span>0%</span>
          <span className="text-emerald-400 font-medium">{Math.round(displayProgress)}% Complete</span>
          <span>100%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {stages.slice(0, -1).map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          
          return (
            <div
              key={stage.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : isComplete 
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`flex-shrink-0 ${
                isActive 
                  ? 'text-emerald-300 animate-pulse' 
                  : isComplete 
                    ? 'text-green-400'
                    : 'text-white/40'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  isActive 
                    ? 'text-emerald-200' 
                    : isComplete 
                      ? 'text-green-300'
                      : 'text-white/60'
                }`}>
                  {stage.label}
                </div>
                <div className={`text-sm ${
                  isActive 
                    ? 'text-emerald-300/80' 
                    : isComplete 
                      ? 'text-green-400/80'
                      : 'text-white/40'
                }`}>
                  {stage.description}
                </div>
              </div>
              
              {isComplete && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              
              {isActive && (
                <div className="text-emerald-400 text-sm font-medium">
                  {Math.round(displayProgress)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm text-white/60">
          Estimated time remaining: {Math.max(0, 60 - timeElapsed)}s
        </div>
      </div>
    </div>
  );
};

export default GenerationProgress;