import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
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

const AUTH_PROFILE_CACHE_KEY = 'laranjeiras_auth_profile';

const getCachedProfile = (authUserId: string): Usuario | null => {
  try {
    const cached = window.localStorage.getItem(AUTH_PROFILE_CACHE_KEY);
    if (!cached) return null;

    const profile = JSON.parse(cached) as Usuario;
    return profile.auth_user_id === authUserId ? profile : null;
  } catch (e) {
    console.warn('Falha ao recuperar perfil autenticado do cache:', e);
    return null;
  }
};

const saveCachedProfile = (profile: Usuario): void => {
  try {
    window.localStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Falha ao salvar perfil autenticado no cache:', e);
  }
};

const clearCachedProfile = (): void => {
  try {
    window.localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
  } catch (e) {
    // ignore
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserRef = useRef<Usuario | null>(null);

  const updateCurrentUser = useCallback((profile: Usuario | null) => {
    currentUserRef.current = profile;
    setCurrentUser(profile);

    if (profile) {
      saveCachedProfile(profile);
    }
  }, []);

  const fetchUserProfile = async (authUserId: string): Promise<Usuario | null> => {
    const queryPromise = (async () => {
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
    })();

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('Busca de perfil do usuário no Supabase expirou.');
        resolve(null);
      }, 4000);
    });

    return Promise.race([queryPromise, timeoutPromise]);
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    repo.clearCache();
    clearCachedProfile();
    updateCurrentUser(null);
  }, [updateCurrentUser]);

  const loadAuthenticatedProfile = useCallback(async (authUserId: string): Promise<Usuario | null> => {
    const cachedProfile = getCachedProfile(authUserId);
    const activeProfile = currentUserRef.current?.auth_user_id === authUserId ? currentUserRef.current : null;
    const fallbackProfile = activeProfile || cachedProfile;

    if (fallbackProfile && !currentUserRef.current) {
      updateCurrentUser(fallbackProfile);
    }

    const profile = await fetchUserProfile(authUserId);
    if (profile) {
      updateCurrentUser(profile);
      return profile;
    }

    if (fallbackProfile) {
      console.warn('Mantendo sessao ativa com perfil em cache apos falha temporaria ao buscar perfil.');
      updateCurrentUser(fallbackProfile);
      return fallbackProfile;
    }

    return null;
  }, [updateCurrentUser]);

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
          updateCurrentUser(profile);
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
            updateCurrentUser(updatedProfile);
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
    let active = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      const timer = setTimeout(() => {
        if (active) {
          console.warn('Inicialização da sessão no Supabase expirou. Forçando liberação da tela.');
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          if (session?.user) {
            await loadAuthenticatedProfile(session.user.id);
          } else {
            repo.clearCache();
            clearCachedProfile();
            updateCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
      } finally {
        clearTimeout(timer);
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      
      // Ignora INITIAL_SESSION se já correu para evitar corrida simultânea com getSession inicial
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        setIsLoading(true);
        const refreshTimer = setTimeout(() => {
          if (active) setIsLoading(false);
        }, 5000);

        try {
          if (session?.user) {
            await loadAuthenticatedProfile(session.user.id);
          } else {
            repo.clearCache();
            clearCachedProfile();
            updateCurrentUser(null);
          }
        } catch (err) {
          console.error('Erro ao processar alteração de autenticação:', err);
        } finally {
          clearTimeout(refreshTimer);
          if (active) {
            setIsLoading(false);
          }
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAuthenticatedProfile, updateCurrentUser]);

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
