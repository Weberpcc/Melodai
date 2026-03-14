import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - renderStartTime.current;

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance [${componentName}]:`, {
        renderTime: `${renderTime}ms`,
        renderCount: renderCount.current,
        memoryUsage: (performance as any).memory ? 
          `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 
          'N/A'
      });

      // Warn about slow renders
      if (renderTime > 100) {
        console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
      }
    }

    renderStartTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current
  };
};

export const useMemoryMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && (performance as any).memory) {
      const logMemory = () => {
        const memory = (performance as any).memory;
        console.log('💾 Memory Usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
      };

      const interval = setInterval(logMemory, 30000); // Log every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);
};