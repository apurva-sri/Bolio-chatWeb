import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userInfo');
      return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
    } catch (err) {
      return null;
    }
  });

  const login = (userData) => {
    // Extract tokens
    const { accessToken, refreshToken, ...userInfo } = userData;
    
    // Store in localStorage
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Update state
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
