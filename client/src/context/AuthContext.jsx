import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, setAuthFromRefresh, setOnUnauthorized } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateAuth = useCallback((data) => {
    if (data?.user) setUser(data.user);
    if (data?.accessToken) {
      setAccessTokenState(data.accessToken);
      setAccessToken(data.accessToken);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    setAccessToken(null);
    api.post('/auth/logout').catch(() => {});
  }, []);

  useEffect(() => {
    setAuthFromRefresh(updateAuth);
    setOnUnauthorized(() => {
      setUser(null);
      setAccessTokenState(null);
      setAccessToken(null);
      window.location.href = '/login';
    });
    return () => {
      setAuthFromRefresh(null);
      setOnUnauthorized(null);
    };
  }, [updateAuth]);

  useEffect(() => {
    api
      .post('/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        if (res.data?.user && res.data?.accessToken) {
          updateAuth(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    updateAuth(data);
    return data;
  }, [updateAuth]);

  const register = useCallback(async (email, password, fullName) => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      fullName,
    });
    updateAuth(data);
    return data;
  }, [updateAuth]);

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
