import React, { useState } from 'react';
import { 
  BarChart3, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  TrendingUp,
  Volume2,
  Clock,
  Music
} from 'lucide-react';
import { QualityScores, UserFeedback } from '../types';

interface QualityDisplayProps {
  qualityScores?: QualityScores;
  userFeedback?: UserFeedback;
  onFeedbackSubmit: (feedback: Omit<UserFeedback, 'id' | 'timestamp'>) => void;
  generationId: string;
}

const QualityDisplay: React.FC<QualityDisplayProps> = ({
  qualityScores,
  userFeedback,
  onFeedbackSubmit,
  generationId
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(userFeedback?.rating || 0);
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(userFeedback?.thumbsUp || null);
  const [category, setCategory] = useState<'perfect' | 'doesnt_match_mood' | 'poor_quality' | 'too_repetitive' | 'other'>(userFeedback?.category || 'perfect');
  const [comment, setComment] = useState(userFeedback?.comment || '');

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const handleFeedbackSubmit = () => {
    if (rating === 0) return;

    onFeedbackSubmit({
      generationId,
      rating,
      thumbsUp,
      category: category as any,
      comment: comment.trim() || undefined
    });

    setShowFeedback(false);
  };

  const qualityMetrics = qualityScores ? [
    {
      name: 'Audio Quality',
      score: qualityScores.audioQuality,
      maxScore: 25,
      icon: Volume2,
      description: 'Checks for clipping and proper volume levels'
    },
    {
      name: 'Duration Accuracy',
      score: qualityScores.durationAccuracy,
      maxScore: 15,
      icon: Clock,
      description: 'Verifies audio matches requested duration'
    },
    {
      name: 'Silence Detection',
      score: qualityScores.silenceDetection,
      maxScore: 20,
      icon: Music,
      description: 'Ensures no long silent sections'
    },
    {
      name: 'Dynamic Range',
      score: qualityScores.dynamicRange,
      maxScore: 20,
      icon: TrendingUp,
      description: 'Measures variation in loudness'
    },
    {
      name: 'Frequency Balance',
      score: qualityScores.frequencyBalance,
      maxScore: 20,
      icon: BarChart3,
      description: 'Checks spectral distribution'
    }
  ] : [];

  return (
    <div className="space-y-4">
      {/* Quality Score Display */}
      {qualityScores && (
        <div className="glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Quality Analysis</span>
            </h4>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(qualityScores.overallScore, 100)}`}>
                {qualityScores.overallScore.toFixed(1)}
              </div>
              <div className="text-sm text-white/60">/ 100</div>
              <div className={`text-xs ${
                qualityScores.overallScore >= 80 ? 'text-green-400' : 
                qualityScores.overallScore >= 65 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {qualityScores.overallScore >= 80 ? 'Excellent' : 
                 qualityScores.overallScore >= 65 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>

          {/* Detailed Quality Breakdown */}
          <div className="space-y-3">
            {qualityMetrics.map((metric) => {
              const percentage = (metric.score / metric.maxScore) * 100;
              const Icon = metric.icon;
              
              return (
                <div key={metric.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/80">{metric.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(metric.score, metric.maxScore)}`}>
                      {metric.score.toFixed(1)}/{metric.maxScore}
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(metric.score, metric.maxScore)}`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  
                  {percentage < 60 && (
                    <p className="text-xs text-white/50 mt-1">{metric.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Feedback Section */}
      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span>Your Feedback</span>
          </h4>
          
          {!showFeedback && !userFeedback && (
            <button
              onClick={() => setShowFeedback(true)}
              className="glass-button rounded-lg px-3 py-1 text-sm text-white/80 hover:text-white transition-colors"
            >
              Rate This
            </button>
          )}
        </div>

        {/* Existing Feedback Display */}
        {userFeedback && !showFeedback && (
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              {/* Star Rating */}
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= userFeedback.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* Thumbs Up/Down */}
              {userFeedback.thumbsUp !== null && (
                <div className="flex items-center space-x-1">
                  {userFeedback.thumbsUp ? (
                    <ThumbsUp className="w-4 h-4 text-green-400 fill-current" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-red-400 fill-current" />
                  )}
                </div>
              )}

              {/* Category */}
              <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded">
                {userFeedback.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>

            {userFeedback.comment && (
              <p className="text-sm text-white/70 bg-white/5 rounded p-2">
                "{userFeedback.comment}"
              </p>
            )}

            <button
              onClick={() => setShowFeedback(true)}
              className="text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              Edit feedback
            </button>
          </div>
        )}

        {/* Feedback Form */}
        {showFeedback && (
          <div className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Rate this generation:</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbs Up/Down */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Quick feedback:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setThumbsUp(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    thumbsUp === true
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/60 hover:text-white/80'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setThumbsUp(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    thumbsUp === false
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/10 text-white/60 hover:text-white/80'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setThumbsUp(null)}
                  className="px-3 py-2 rounded-lg bg-white/10 text-white/60 hover:text-white/80 text-xs transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Feedback Category */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full glass-select rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="perfect">Perfect!</option>
                <option value="doesnt_match_mood">Doesn't match mood</option>
                <option value="poor_quality">Poor audio quality</option>
                <option value="too_repetitive">Too repetitive</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Comment (optional):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full glass-input rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFeedbackSubmit}
                disabled={rating === 0}
                className="glass-button rounded-lg px-4 py-2 text-sm text-white hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityDisplay;