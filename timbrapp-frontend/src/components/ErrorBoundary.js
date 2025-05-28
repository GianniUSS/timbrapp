// ErrorBoundary per la dashboard web
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo stato per mostrare la UI di fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puoi registrare l'errore in un servizio di monitoraggio
    console.error('Dashboard error caught:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    } catch (e) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Render della UI di fallback
      return (
        <Box 
          sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: '#f5f6fa',
            p: 3
          }}
        >
          <Box 
            sx={{ 
              maxWidth: 500,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 3,
              p: 4,
              textAlign: 'center'
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Si è verificato un errore
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              C'è stato un problema nel caricamento della dashboard. Riprova o effettua nuovamente il login.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={this.handleRetry}
                sx={{ minWidth: 120 }}
              >
                Riprova
              </Button>
              <Button 
                variant="contained"
                color="primary"
                onClick={this.handleLogout}
                sx={{ minWidth: 120 }}
              >
                Torna al login
              </Button>
            </Box>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 4, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error">Dettagli (solo sviluppo):</Typography>
                <pre style={{ overflow: 'auto', maxHeight: '200px', fontSize: '12px' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
