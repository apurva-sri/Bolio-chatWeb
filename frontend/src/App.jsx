import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import CallOverlay from './components/chat/CallOverlay';
import { Sun, Moon } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('chatTheme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chatTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <Router>
            <div className="app-container">
              <CallOverlay />
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                style={{
                  position: 'fixed', top: '16px', right: '16px', zIndex: 1000,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '10px', borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/chat" element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } />
              </Routes>
            </div>
          </Router>
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
