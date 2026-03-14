import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectionStatus {
  health: 'success' | 'error' | 'loading';
  models: 'success' | 'error' | 'loading';
  feedback: 'success' | 'error' | 'loading';
  healthMessage?: string;
  modelsMessage?: string;
  feedbackMessage?: string;
}

const NetworkDebug: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    health: 'loading',
    models: 'loading',
    feedback: 'loading'
  });
  const [isVisible, setIsVisible] = useState(false);

  const testConnections = async () => {
    setStatus({
      health: 'loading',
      models: 'loading',
      feedback: 'loading'
    });

    // Test health endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/health', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          health: 'success',
          healthMessage: `Connected - ${data.status}`
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          health: 'error',
          healthMessage: `HTTP ${response.status}`
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        health: 'error',
        healthMessage: error instanceof Error ? error.message : 'Connection failed'
      }));
    }

    // Test models endpoint
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/models', {
        signal: controller2.signal
      });
      
      clearTimeout(timeoutId2);
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          models: 'success',
          modelsMessage: `${data.models?.length || 0} models available`
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          models: 'error',
          modelsMessage: `HTTP ${response.status}`
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        models: 'error',
        modelsMessage: error instanceof Error ? error.message : 'Connection failed'
      }));
    }

    // Test feedback endpoint
    try {
      const controller3 = new AbortController();
      const timeoutId3 = setTimeout(() => controller3.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/feedback/stats', {
        signal: controller3.signal
      });
      
      clearTimeout(timeoutId3);
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          feedback: 'success',
          feedbackMessage: `${data.stats?.total_feedback || 0} feedback entries`
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          feedback: 'error',
          feedbackMessage: `HTTP ${response.status}`
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        feedback: 'error',
        feedbackMessage: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  };

  useEffect(() => {
    testConnections();
  }, []);

  const getStatusIcon = (state: 'success' | 'error' | 'loading') => {
    switch (state) {
      case 'success':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (state: 'success' | 'error' | 'loading') => {
    switch (state) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'loading':
        return 'text-yellow-400';
    }
  };

  const hasErrors = status.health === 'error' || status.models === 'error' || status.feedback === 'error';

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed bottom-4 right-4 z-50 glass-button rounded-full p-3 transition-colors ${
          hasErrors ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
        }`}
        title="Network Debug"
      >
        {hasErrors ? <AlertCircle className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 w-80 glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Network Status</h3>
            <button
              onClick={testConnections}
              className="glass-button rounded p-1 text-white/80 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Health Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.health)}
                <span className="text-sm text-white/80">Backend Health</span>
              </div>
              <span className={`text-xs ${getStatusColor(status.health)}`}>
                {status.healthMessage || 'Testing...'}
              </span>
            </div>

            {/* Models Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.models)}
                <span className="text-sm text-white/80">Models API</span>
              </div>
              <span className={`text-xs ${getStatusColor(status.models)}`}>
                {status.modelsMessage || 'Testing...'}
              </span>
            </div>

            {/* Feedback Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.feedback)}
                <span className="text-sm text-white/80">Feedback API</span>
              </div>
              <span className={`text-xs ${getStatusColor(status.feedback)}`}>
                {status.feedbackMessage || 'Testing...'}
              </span>
            </div>
          </div>

          {hasErrors && (
            <div className="mt-4 p-2 bg-red-500/20 rounded text-xs text-red-300">
              <strong>Troubleshooting:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Check if backend server is running on port 5000</li>
                <li>• Verify CORS settings</li>
                <li>• Check browser console for detailed errors</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NetworkDebug;