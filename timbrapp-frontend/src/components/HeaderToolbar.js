// HeaderToolbar.js
import React from 'react';

export default function HeaderToolbar({ user, onLogout }) {
  return (
    <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
      <h1>Ciao {user.name}, oggi è {user.today}</h1>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}
