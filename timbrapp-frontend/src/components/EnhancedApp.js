// components/EnhancedApp.js
// Componente wrapper che integra tutte le ottimizzazioni implementate
import React, { useState, useEffect } from 'react';
import { Box, Fab, Dialog } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import PerformanceDashboard from './PerformanceDashboard';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { usePWA } from '../hooks/usePWA';
import { useTimbrAppPrefetch } from '../hooks/useTimbrAppPrefetch';

/**
 * Enhanced App Wrapper che integra:
 * - Performance monitoring
 * - PWA features
 * - Intelligent prefetching
 * - Cache management
 */
function EnhancedApp({ children }) {
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  
  // Hook per performance monitoring
  const { 
    performanceScore, 
    stats,
    webVitals,
    startRenderMeasure,
    endRenderMeasure 
  } = usePerformanceMonitor();
  
  // Hook per PWA features
  const {
    isInstalled,
    canInstall,
    isOnline,
    installApp,
    cacheStats,
    clearCache,
    serviceWorkerStatus
  } = usePWA();
  // Hook per prefetching intelligente
  const {
    prefetchDashboardData,
    isPrefetching,
    cacheSize
  } = useTimbrAppPrefetch();
  
  // Avvia prefetching all'inizializzazione
  useEffect(() => {
    if (isOnline && !isPrefetching) {
      prefetchDashboardData();
    }
  }, [isOnline, isPrefetching, prefetchDashboardData]);
  
  // Performance measurement per l'app principale
  useEffect(() => {
    startRenderMeasure('EnhancedApp');
    return () => endRenderMeasure('EnhancedApp');
  }, [startRenderMeasure, endRenderMeasure]);
  
  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Enhanced App Status:', {
        performanceScore,
        isInstalled,
        isOnline,
        serviceWorkerStatus,
        cacheSize: `${cacheSize}MB`,
        isPrefetching
      });
    }
  }, [performanceScore, isInstalled, isOnline, serviceWorkerStatus, cacheSize, isPrefetching]);
  
  return (
    <>
      {children}
      
      {/* Performance Dashboard FAB - Solo in development */}
      {process.env.NODE_ENV === 'development' && (
        <Fab
          color="secondary"
          aria-label="performance"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300
          }}
          onClick={() => setShowPerformanceDashboard(true)}
        >
          <SpeedIcon />
        </Fab>
      )}
      
      {/* Performance Dashboard Dialog */}
      <Dialog
        open={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
        maxWidth="lg"
        fullWidth
      >
        <PerformanceDashboard 
          onClose={() => setShowPerformanceDashboard(false)}
        />
      </Dialog>
      
      {/* Indicatori di stato per debug */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
            fontSize: 12,
            zIndex: 1200,
            fontFamily: 'monospace'
          }}
        >
          <div>Score: {performanceScore}/100</div>
          <div>Cache: {cacheSize}MB</div>
          <div>Online: {isOnline ? '🟢' : '🔴'}</div>
          <div>PWA: {isInstalled ? '📱' : '🌐'}</div>
          {isPrefetching && <div>🔄 Prefetching...</div>}
        </Box>
      )}
    </>
  );
}

export default EnhancedApp;
