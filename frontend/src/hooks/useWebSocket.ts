import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  timeElapsed: number;
  estimatedRemaining: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  startGeneration: (data: any) => void;
  progress: ProgressUpdate | null;
  error: string | null;
  isGenerating: boolean;
  generationResult: any | null;
}

export const useWebSocket = (serverUrl: string = 'http://localhost:5000'): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
      setIsGenerating(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔌 WebSocket connection error:', err);
      setError('Failed to connect to server');
      setIsConnected(false);
    });

    // Generation event handlers
    newSocket.on('generation_progress', (data: ProgressUpdate) => {
      console.log('📊 Progress update:', data);
      setProgress(data);
    });

    newSocket.on('generation_complete', (data) => {
      console.log('✅ Generation complete:', data);
      setIsGenerating(false);
      setProgress(null);
      setGenerationResult(data);
    });

    newSocket.on('generation_error', (data) => {
      console.error('❌ Generation error:', data);
      setError(data.error || 'Generation failed');
      setIsGenerating(false);
      setProgress(null);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  const startGeneration = (data: any) => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }

    console.log('🚀 Starting WebSocket generation:', data);
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setGenerationResult(null);
    
    socket.emit('start_generation', data);
  };

  return {
    socket,
    isConnected,
    startGeneration,
    progress,
    error,
    isGenerating,
    generationResult
  };
};