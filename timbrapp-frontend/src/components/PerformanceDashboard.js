// components/PerformanceDashboard.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  TouchApp as InteractionIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

const PerformanceDashboard = ({ open, onClose }) => {
  const {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    getAggregatedStats,
    generatePerformanceReport,
    getPerformanceScore
  } = usePerformanceMonitor();

  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [score, setScore] = useState(0);

  // Aggiorna le statistiche ogni 2 secondi
  useEffect(() => {
    if (open && isMonitoring) {
      const interval = setInterval(() => {
        setStats(getAggregatedStats());
        setScore(getPerformanceScore());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [open, isMonitoring, getAggregatedStats, getPerformanceScore]);

  // Inizia il monitoraggio quando si apre il dashboard
  useEffect(() => {
    if (open && !isMonitoring) {
      startMonitoring();
    }
  }, [open, isMonitoring, startMonitoring]);

  const handleDownloadReport = () => {
    const report = generatePerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getWebVitalStatus = (metric, value) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 },
      fid: { good: 100, poor: 300 }
    };

    const threshold = thresholds[metric];
    if (!threshold || value === null) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'needs-improvement': return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'poor': return <WarningIcon sx={{ color: 'error.main' }} />;
      default: return <WarningIcon sx={{ color: 'text.disabled' }} />;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const WebVitalsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Core Web Vitals</Typography>
      </Grid>
      
      {stats?.webVitals && Object.entries(stats.webVitals).map(([key, value]) => {
        const labels = {
          fcp: 'First Contentful Paint',
          lcp: 'Largest Contentful Paint',
          cls: 'Cumulative Layout Shift',
          fid: 'First Input Delay'
        };
        
        const units = {
          fcp: 'ms',
          lcp: 'ms',
          cls: '',
          fid: 'ms'
        };

        const status = getWebVitalStatus(key, value);
        
        return (
          <Grid item xs={12} sm={6} key={key}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {labels[key]}
                    </Typography>
                    <Typography variant="h5">
                      {value !== null ? `${value}${units[key]}` : 'N/A'}
                    </Typography>
                  </Box>
                  {getStatusIcon(status)}
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={status.replace('-', ' ')} 
                    size="small" 
                    color={status === 'good' ? 'success' : status === 'needs-improvement' ? 'warning' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const RenderingTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Statistiche Rendering" />
          <CardContent>
            {stats?.rendering && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Tempo medio rendering</Typography>
                  <Typography variant="h6">{stats.rendering.average}ms</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Rendering lenti (&gt;16ms)</Typography>
                  <Typography variant="h6">{stats.rendering.slowCount}/{stats.rendering.totalMeasured}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.rendering.totalMeasured > 0 ? (stats.rendering.slowCount / stats.rendering.totalMeasured) * 100 : 0}
                  color={stats.rendering.slowCount > stats.rendering.totalMeasured * 0.2 ? 'error' : 'success'}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Rendering Recenti" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Componente</TableCell>
                    <TableCell align="right">Tempo (ms)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.renderTimes.slice(-10).map((render, index) => (
                    <TableRow key={index}>
                      <TableCell>{render.component}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {render.time.toFixed(2)}
                          {render.time > 16 && <WarningIcon sx={{ ml: 1, fontSize: 16, color: 'warning.main' }} />}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const NetworkTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Performance di Rete" />
          <CardContent>
            {stats?.network && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Tempo medio richieste</Typography>
                  <Typography variant="h6">{stats.network.average}ms</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Tasso di fallimento</Typography>
                  <Typography variant="h6">{stats.network.failureRate.toFixed(1)}%</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Richieste totali</Typography>
                  <Typography variant="h6">{stats.network.totalRequests}</Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Richieste Recenti" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell align="right">Durata (ms)</TableCell>
                    <TableCell align="center">Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.networkRequests.slice(-10).map((request, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Tooltip title={request.url}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {request.url.split('/').pop() || 'API Call'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">{request.duration.toFixed(0)}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small"
                          label={request.success ? 'OK' : 'Error'}
                          color={request.success ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const MemoryTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardHeader title="Utilizzo Memoria" />
          <CardContent>
            {metrics.memoryUsage && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Memoria utilizzata</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.memoryUsage.percentage}
                    color={metrics.memoryUsage.percentage > 80 ? 'error' : metrics.memoryUsage.percentage > 60 ? 'warning' : 'success'}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB ({metrics.memoryUsage.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6">{metrics.memoryUsage.used}MB</Typography>
                      <Typography variant="caption" color="text.secondary">Utilizzata</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6">{metrics.memoryUsage.total}MB</Typography>
                      <Typography variant="caption" color="text.secondary">Totale</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6">{metrics.memoryUsage.limit}MB</Typography>
                      <Typography variant="caption" color="text.secondary">Limite</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardHeader title="Interazioni Utente" />
          <CardContent>
            {stats?.interaction && (
              <>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{stats.interaction.average.toFixed(0)}ms</Typography>
                  <Typography variant="caption" color="text.secondary">Tempo medio risposta</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{stats.interaction.totalMeasured}</Typography>
                  <Typography variant="caption" color="text.secondary">Interazioni misurate</Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeedIcon sx={{ mr: 1 }} />
            Performance Dashboard
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Card variant="outlined" sx={{ px: 2, py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Score:</Typography>
                <Chip 
                  label={score}
                  color={getScoreColor(score)}
                  size="small"
                />
              </Box>
            </Card>
            <Tooltip title="Aggiorna">
              <IconButton size="small" onClick={() => {
                setStats(getAggregatedStats());
                setScore(getPerformanceScore());
              }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Scarica Report">
              <IconButton size="small" onClick={handleDownloadReport}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<SpeedIcon />} label="Web Vitals" iconPosition="start" />
            <Tab icon={<TrendingUpIcon />} label="Rendering" iconPosition="start" />
            <Tab icon={<NetworkIcon />} label="Network" iconPosition="start" />
            <Tab icon={<MemoryIcon />} label="Memoria" iconPosition="start" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && <WebVitalsTab />}
        {activeTab === 1 && <RenderingTab />}
        {activeTab === 2 && <NetworkTab />}
        {activeTab === 3 && <MemoryTab />}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={resetMetrics} color="warning">
          Reset Metriche
        </Button>
        <Button onClick={isMonitoring ? stopMonitoring : startMonitoring} color="primary">
          {isMonitoring ? 'Ferma Monitoraggio' : 'Avvia Monitoraggio'}
        </Button>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PerformanceDashboard;
