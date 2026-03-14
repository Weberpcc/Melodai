import React, { useState, useEffect, useCallback, useMemo } from "react";
import FloatingLines from "./components/FloatingLines";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import NetworkDebug from "./components/NetworkDebug";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import LandingPage from "./components/LandingPage";
import { GenerationResult, AppState } from "./types";
import { useGlobalCacheStats } from "./hooks/useCacheStats";
import { initializeDemoCache } from "./utils/cacheTracker";
import "./utils/resetLanding"; // For dev tools access
import "./theme.css";

function App() {
  // Initialize global cache stats
  useGlobalCacheStats();
  
  const [state, setState] = useState<AppState>({
    history: [],
    favorites: [],
    currentOutput: null,
    isGenerating: false,
    settings: {
      duration: 30,
      creativity: 1.0,
      model: "musicgen-medium",
      topK: 250,
      topP: 0.0,
      cfgScale: 3.0,
      expertMode: false,
    },
    feedbackHistory: [],
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'dashboard' | 'settings'>('main');
  const [showLanding, setShowLanding] = useState(true);

  // Memoized state selectors for performance
  const memoizedHistory = useMemo(() => state.history, [state.history]);
  const memoizedFavorites = useMemo(() => state.favorites, [state.favorites]);
  const memoizedSettings = useMemo(() => state.settings, [state.settings]);

  // Load state from localStorage on mount with error handling
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const savedState = localStorage.getItem("melodai-state");
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Validate the parsed state structure
          if (parsed && typeof parsed === 'object') {
            setState((prev) => ({ 
              ...prev, 
              ...parsed, 
              isGenerating: false // Always reset generating state on load
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load saved state:", error);
        // Clear corrupted data
        localStorage.removeItem("melodai-state");
      }
    };

    // Check if user has visited before
    // const hasVisited = localStorage.getItem('melodai-visited');
    // For development: always show landing page
    // Uncomment the next 3 lines to restore normal behavior
    // if (hasVisited) {
    //   setShowLanding(false);
    // }

    // Load theme
    const savedTheme = localStorage.getItem('melodai-theme') || 'emerald';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Initialize demo cache for realistic cache hit rates
    initializeDemoCache();

    loadSavedState();
  }, []);

  // Debounced save to localStorage to reduce writes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      try {
        const stateToSave = {
          history: state.history.slice(0, 50), // Limit history size
          favorites: state.favorites.slice(0, 100), // Limit favorites
          settings: state.settings,
          feedbackHistory: state.feedbackHistory.slice(0, 100), // Limit feedback history
        };
        localStorage.setItem("melodai-state", JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state:", error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(saveTimeout);
  }, [state.history, state.favorites, state.settings, state.feedbackHistory]);

  const updateSettings = useCallback(
    (newSettings: Partial<typeof state.settings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    []
  );

  const addToHistory = useCallback((result: GenerationResult) => {
    setState((prev) => ({
      ...prev,
      history: [result, ...prev.history.slice(0, 49)], // Keep last 50
      currentOutput: result,
      isGenerating: false,
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((prev) => {
      const isFavorite = prev.favorites.includes(id);
      const newFavorites = isFavorite
        ? prev.favorites.filter((fav) => fav !== id)
        : [...prev.favorites, id];

      return { ...prev, favorites: newFavorites };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
      favorites: [],
      currentOutput: null,
    }));
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating: generating }));
  }, []);

  const handleFeedbackSubmit = useCallback(async (feedback: any) => {
    try {
      // Submit feedback to backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        
        // Update local state efficiently
        setState((prev) => ({
          ...prev,
          feedbackHistory: [result.feedback, ...prev.feedbackHistory.slice(0, 99)], // Limit size
          // Update the current output with feedback
          currentOutput: prev.currentOutput?.id === feedback.generationId 
            ? { ...prev.currentOutput, userFeedback: result.feedback } as GenerationResult
            : prev.currentOutput,
          // Update history item with feedback
          history: prev.history.map(item => 
            item.id === feedback.generationId 
              ? { ...item, userFeedback: result.feedback } as GenerationResult
              : item
          )
        }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Feedback submission timed out');
      } else {
        console.error('Failed to submit feedback:', error);
      }
    }
  }, []); // Remove state dependency to prevent unnecessary re-renders

  const handleGetStarted = useCallback(() => {
    localStorage.setItem('melodai-visited', 'true');
    setShowLanding(false);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Main App - Always rendered to prevent black flash */}
      <div className={`main-app ${showLanding ? 'hidden' : ''}`}>
        {/* Floating Lines Background - Memoized for performance */}
        <div className="fixed inset-0 z-0">
          <FloatingLines
            enabledWaves={['middle']}
            lineCount={[8]}
            lineDistance={[18]}
            bendRadius={3.5}
            bendStrength={-1.5}
            interactive={true}
            parallax={true}
          />
        </div>

        {/* Main App Content */}
        <div className="relative z-10 min-h-screen">
          <Header 
            currentView={currentView}
            onViewChange={setCurrentView}
          />

          <div className="flex">
            {/* Sidebar - Only visible in create page */}
            {currentView === 'main' && (
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                settings={memoizedSettings}
                onSettingsChange={updateSettings}
                history={memoizedHistory}
                favorites={memoizedFavorites}
                onToggleFavorite={toggleFavorite}
                onClearHistory={clearHistory}
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            )}

            {/* Main Content, Dashboard, or Settings */}
            {currentView === 'main' ? (
              <MainContent
                sidebarOpen={sidebarOpen}
                settings={memoizedSettings}
                currentOutput={state.currentOutput}
                isGenerating={state.isGenerating}
                onGenerate={addToHistory}
                onSetGenerating={setGenerating}
                onToggleFavorite={toggleFavorite}
                isFavorite={
                  state.currentOutput
                    ? memoizedFavorites.includes(state.currentOutput.id)
                    : false
                }
                history={memoizedHistory}
                onSettingsChange={updateSettings}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
            ) : currentView === 'dashboard' ? (
              <div className="flex-1 p-6">
                <Dashboard
                  state={state}
                  onSettingsChange={updateSettings}
                  onToggleFavorite={toggleFavorite}
                  onClearHistory={clearHistory}
                />
              </div>
            ) : (
              <Settings
                state={state}
                onSettingsChange={updateSettings}
              />
            )}
          </div>

          {/* Keyboard Shortcuts Handler */}
          <KeyboardShortcuts
            onGenerate={() => {
              // Trigger generation if conditions are met
              const generateButton = document.querySelector('[data-generate-button]') as HTMLButtonElement;
              if (generateButton && !generateButton.disabled) {
                generateButton.click();
              }
            }}
            onDownload={() => {
              // Trigger download if available
              const downloadButton = document.querySelector('[data-download-button]') as HTMLButtonElement;
              if (downloadButton) {
                downloadButton.click();
              }
            }}
            isGenerating={state.isGenerating}
          />

          {/* Network Debug Component */}
          <NetworkDebug />
        </div>
      </div>

      {/* Landing Page - Overlay on top */}
      {showLanding && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
    </div>
  );
}

export default App;
