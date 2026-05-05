import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('userInfo');
      if (!savedUser || savedUser === "undefined") return;
      
      const user = JSON.parse(savedUser);
      
      if (user) {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('setup', user);
        newSocket.on('get-online-users', (users) => {
          setOnlineUsers(users);
        });

        newSocket.on('connected', () => console.log('[Socket] Connected to backend'));

        return () => newSocket.close();
      }
    } catch (err) {
      console.error("Socket initialization failed", err);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
