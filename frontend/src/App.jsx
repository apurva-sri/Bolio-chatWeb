import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import { Sun, Moon } from 'lucide-react';
import './index.css';

function App() {
  // Check local storage for theme, default to dark
  const [theme, setTheme] = useState(localStorage.getItem('chatTheme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chatTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <div className="app-container">
        {/* Theme Toggle Button at top right */}
        <button 
          onClick={toggleTheme} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div style={{padding: '50px', textAlign: 'center'}}>Login Page (To be implemented next)</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
