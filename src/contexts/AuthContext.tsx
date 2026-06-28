import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Usuario } from '../types';
import { supabase } from '../supabaseClient';
import { repo } from '../repository';

interface AuthContextType {
  currentUser: Usuario | null;
  login: (username: string, senhaMock: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authUserId: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();
      
      if (error || !data) {
        console.error('Erro ao buscar perfil do usuário no Supabase:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Falha ao obter perfil:', e);
      return null;
    }
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    repo.clearCache();
    setCurrentUser(null);
  }, []);

  const login = async (username: string, senhaMock: string): Promise<{ success: boolean; message: string }> => {
    try {
      const email = `${username.trim().toLowerCase()}@laranjeiras.com`;

      // Tenta login com o Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senhaMock,
      });

      if (error) {
        return { success: false, message: `Erro ao fazer login: ${error.message}` };
      }

      if (data?.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          if (!profile.ativo) {
            await logout();
            return { success: false, message: 'Esta conta de usuário está inativa.' };
          }
          setCurrentUser(profile);
          return { success: true, message: 'Login realizado com sucesso.' };
        } else {
          // Fallback: vincula o perfil existente ao ID do Auth se ainda não estiver associado
          const { data: userProfile, error: profileErr } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username.trim().toLowerCase())
            .single();

          if (!profileErr && userProfile) {
            const updatedProfile = { ...userProfile, auth_user_id: data.user.id };
            await supabase.from('usuarios').upsert(updatedProfile);
            setCurrentUser(updatedProfile);
            return { success: true, message: 'Login realizado e conta vinculada com sucesso.' };
          }
        }
      }
      return { success: false, message: 'Usuário não cadastrado no banco do aplicativo.' };
    } catch (e: any) {
      return { success: false, message: `Erro inesperado: ${e.message || e}` };
    }
  };

  // Monitorar alterações do estado de autenticação do Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setCurrentUser(profile);
      } else {
        repo.clearCache();
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Monitor de inatividade
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
      resetTimer();

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
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser, isLoading }}>
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

