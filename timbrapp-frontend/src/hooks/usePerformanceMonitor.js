// hooks/usePerformanceMonitor.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook per il monitoraggio avanzato delle performance dell'applicazione
 * Raccoglie metriche su rendering, network, memoria e user experience
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: null,              // First Contentful Paint
    lcp: null,              // Largest Contentful Paint
    cls: null,              // Cumulative Layout Shift
    fid: null,              // First Input Delay
    ttfb: null,             // Time to First Byte
    renderTimes: [],        // Tempi di rendering dei componenti
    memoryUsage: null,      // Utilizzo memoria
    networkRequests: [],    // Performance delle richieste di rete
    userInteractions: []    // Metriche di interazione utente
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const renderStartTime = useRef(null);
  const observerRef = useRef(null);

  // Inizializza il Performance Observer per Web Vitals
  useEffect(() => {
    if (!isMonitoring) return;

    // Observer per First Contentful Paint e Largest Contentful Paint
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      });
    });

    // Observer per Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
    });

    // Observer per Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      setMetrics(prev => ({ ...prev, cls: clsValue }));
    });

    // Observer per First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
      });
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      observerRef.current = [paintObserver, lcpObserver, clsObserver, fidObserver];
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.forEach(observer => observer.disconnect());
      }
    };
  }, [isMonitoring]);

  // Monitora l'utilizzo della memoria
  useEffect(() => {
    if (!isMonitoring || !('memory' in performance)) return;

    const updateMemoryUsage = () => {
      const memory = performance.memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        }
      }));
    };

    const interval = setInterval(updateMemoryUsage, 5000); // Ogni 5 secondi
    updateMemoryUsage(); // Chiamata immediata

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Funzione per iniziare il monitoraggio di un render
  const startRenderMeasure = useCallback((componentName) => {
    renderStartTime.current = performance.now();
    return componentName;
  }, []);

  // Funzione per concludere il monitoraggio di un render
  const endRenderMeasure = useCallback((componentName) => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTimes: [
          ...prev.renderTimes.slice(-19), // Mantieni solo gli ultimi 20
          {
            component: componentName,
            time: renderTime,
            timestamp: Date.now()
          }
        ]
      }));
      renderStartTime.current = null;
    }
  }, []);

  // Monitora le performance delle richieste di rete
  const measureNetworkRequest = useCallback((url, method = 'GET') => {
    const startTime = performance.now();
    
    return {
      end: (success = true, responseSize = 0) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        setMetrics(prev => ({
          ...prev,
          networkRequests: [
            ...prev.networkRequests.slice(-49), // Mantieni solo le ultime 50
            {
              url: url.split('?')[0], // Rimuovi query params per privacy
              method,
              duration,
              success,
              responseSize,
              timestamp: Date.now()
            }
          ]
        }));
      }
    };
  }, []);

  // Monitora le interazioni dell'utente
  const measureUserInteraction = useCallback((interactionType, elementId = null) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        setMetrics(prev => ({
          ...prev,
          userInteractions: [
            ...prev.userInteractions.slice(-29), // Mantieni solo le ultime 30
            {
              type: interactionType,
              elementId,
              duration,
              timestamp: Date.now()
            }
          ]
        }));
      }
    };
  }, []);

  // Calcola statistiche aggregate
  const getAggregatedStats = useCallback(() => {
    const { renderTimes, networkRequests, userInteractions } = metrics;
    
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, render) => sum + render.time, 0) / renderTimes.length 
      : 0;
    
    const slowRenders = renderTimes.filter(render => render.time > 16).length;
    
    const avgNetworkTime = networkRequests.length > 0
      ? networkRequests.reduce((sum, req) => sum + req.duration, 0) / networkRequests.length
      : 0;
    
    const failedRequests = networkRequests.filter(req => !req.success).length;
    
    const avgInteractionTime = userInteractions.length > 0
      ? userInteractions.reduce((sum, interaction) => sum + interaction.duration, 0) / userInteractions.length
      : 0;

    return {
      rendering: {
        average: Math.round(avgRenderTime * 100) / 100,
        slowCount: slowRenders,
        totalMeasured: renderTimes.length
      },
      network: {
        average: Math.round(avgNetworkTime * 100) / 100,
        failureRate: networkRequests.length > 0 ? (failedRequests / networkRequests.length) * 100 : 0,
        totalRequests: networkRequests.length
      },
      interaction: {
        average: Math.round(avgInteractionTime * 100) / 100,
        totalMeasured: userInteractions.length
      },
      webVitals: {
        fcp: metrics.fcp ? Math.round(metrics.fcp) : null,
        lcp: metrics.lcp ? Math.round(metrics.lcp) : null,
        cls: metrics.cls ? Math.round(metrics.cls * 1000) / 1000 : null,
        fid: metrics.fid ? Math.round(metrics.fid * 100) / 100 : null
      }
    };
  }, [metrics]);

  // Genera report delle performance
  const generatePerformanceReport = useCallback(() => {
    const stats = getAggregatedStats();
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
      memoryUsage: metrics.memoryUsage,
      aggregatedStats: stats,
      rawMetrics: {
        renderTimes: metrics.renderTimes.slice(-10), // Ultimi 10 render
        networkRequests: metrics.networkRequests.slice(-10), // Ultime 10 richieste
        userInteractions: metrics.userInteractions.slice(-10) // Ultime 10 interazioni
      }
    };
    
    return report;
  }, [metrics, getAggregatedStats]);

  // Funzione per valutare la performance complessiva
  const getPerformanceScore = useCallback(() => {
    const stats = getAggregatedStats();
    let score = 100;
    
    // Penalità per Web Vitals poor
    if (stats.webVitals.fcp && stats.webVitals.fcp > 3000) score -= 20;
    if (stats.webVitals.lcp && stats.webVitals.lcp > 4000) score -= 20;
    if (stats.webVitals.cls && stats.webVitals.cls > 0.25) score -= 15;
    if (stats.webVitals.fid && stats.webVitals.fid > 300) score -= 15;
    
    // Penalità per rendering lento
    if (stats.rendering.average > 16) score -= 10;
    if (stats.rendering.slowCount > stats.rendering.totalMeasured * 0.2) score -= 10;
    
    // Penalità per network performance poor
    if (stats.network.average > 2000) score -= 10;
    if (stats.network.failureRate > 5) score -= 10;
    
    // Penalità per interazioni lente
    if (stats.interaction.average > 100) score -= 5;
    
    // Penalità per utilizzo memoria alto
    if (metrics.memoryUsage && metrics.memoryUsage.percentage > 80) score -= 10;
    
    return Math.max(0, score);
  }, [metrics, getAggregatedStats]);

  // Avvia/ferma il monitoraggio
  const startMonitoring = useCallback(() => setIsMonitoring(true), []);
  const stopMonitoring = useCallback(() => setIsMonitoring(false), []);
  
  // Reset delle metriche
  const resetMetrics = useCallback(() => {
    setMetrics({
      fcp: null,
      lcp: null,
      cls: null,
      fid: null,
      ttfb: null,
      renderTimes: [],
      memoryUsage: null,
      networkRequests: [],
      userInteractions: []
    });
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    startRenderMeasure,
    endRenderMeasure,
    measureNetworkRequest,
    measureUserInteraction,
    getAggregatedStats,
    generatePerformanceReport,
    getPerformanceScore
  };
};

/**
 * Higher-Order Component per misurare automaticamente i render
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const { startRenderMeasure, endRenderMeasure } = usePerformanceMonitor();
    
    useEffect(() => {
      startRenderMeasure(componentName);
      return () => endRenderMeasure(componentName);
    });
    
    return <WrappedComponent {...props} />;
  };
};

export default usePerformanceMonitor;
