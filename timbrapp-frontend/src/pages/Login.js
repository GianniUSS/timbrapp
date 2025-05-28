// src/pages/Login.js
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Effetto per il debug del componente
  useEffect(() => {
    console.log('Login component mounted');
    return () => console.log('Login component unmounted');
  }, []);

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      console.log('Tentativo di login con:', { email });
      // Utilizziamo il percorso relativo corretto con il baseURL
      const res = await api.post('/api/auth/login', { email, password })
      console.log('🔐 LOGIN response:', res.data)

      // salva token
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role || 'user');

      // redirect in base al ruolo
      if (user.role === 'admin') {
        window.location.href = '/admin/notifications';
      } else if (user.role === 'web') {
        window.location.href = '/eventi-dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('❌ LOGIN error:', err)
      // mostra errore in pagina
      setError(err.response?.data?.error || 'Errore di rete, riprova')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 400,
      margin: '80px auto',
      padding: 20,
      border: '1px solid #ddd',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center' }}>Accedi a TimbrApp</h2>
      
      {/* Mostra versione per debug */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginBottom: '15px' }}>
        Versione applicazione: {process.env.REACT_APP_VERSION || '1.0.0'} (HTTP)
      </div>
      
      {error && (
        <div style={{
          background: '#ffe6e6',
          color: '#a00',
          padding: '8px 12px',
          borderRadius: 4,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              marginTop: 4,
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              marginTop: 4,
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 0',
            background: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}
