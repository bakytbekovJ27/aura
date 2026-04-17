import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, login as apiLogin, clearTokens, isLoggedIn } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await api.get('/profile/');
      setUser(p.user);
      setProfile(p);
    } catch {
      clearTokens();
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      loadProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const login = async (username, password) => {
    await apiLogin(username, password);
    await loadProfile();
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => loadProfile();

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
