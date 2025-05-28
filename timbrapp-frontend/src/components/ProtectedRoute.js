// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente per proteggere le route che richiedono autenticazione
 */
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Se non c'è un token, reindirizza al login
    return <Navigate to="/login" replace />;
  }
  
  // Se c'è un token, renderizza il componente figlio
  return children;
}

/**
 * Componente per proteggere le route che richiedono autenticazione + ruolo admin
 */
export function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!token) {
    // Se non c'è un token, reindirizza al login
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // Se l'utente non è admin, reindirizza alla dashboard
    return <Navigate to="/" replace />;
  }
  
  // Se l'utente è autenticato e admin, renderizza il componente figlio
  return children;
}