import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Usuario } from '../types';

interface AuthContextType {
  currentUser: Usuario | null;
  login: (user: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('@chocadeiras:user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('@chocadeiras:user');
  }, []);

  const login = (user: Usuario) => {
    setCurrentUser(user);
    localStorage.setItem('@chocadeiras:user', JSON.stringify(user));
  };

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (currentUser) {
        inactivityTimer = setTimeout(() => {
          logout();
        }, INACTIVITY_TIMEOUT);
      }
    };

    if (currentUser) {
      // Inicia o timer
      resetTimer();

      // Monitorar eventos do usuário para resetar o tempo
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      
      const handleActivity = () => {
        resetTimer();
      };

      events.forEach(event => document.addEventListener(event, handleActivity));

      return () => {
        clearTimeout(inactivityTimer);
        events.forEach(event => document.removeEventListener(event, handleActivity));
      };
    }
  }, [currentUser, logout]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
