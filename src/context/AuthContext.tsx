import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { API_BASE_URL } from '../utils/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  balance: number;
  phone_number?: string;
  date_of_birth?: string;
  address?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.get<User>('/api/auth/me');
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user profiles:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let socket: WebSocket | null = null;
    let reconnectTimeoutId: any = null;
    let isCleanup = false;

    const connectWS = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = API_BASE_URL.replace(/^https?:\/\//, '') || window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/api/ws?token=${token}`;

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Real-time WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'balance_update' && message.user_id === user.id) {
            setUser((prevUser) => {
              if (prevUser && prevUser.id === message.user_id) {
                return { ...prevUser, balance: message.balance };
              }
              return prevUser;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        console.log('Real-time WebSocket disconnected', event.reason);
        if (!isCleanup) {
          reconnectTimeoutId = setTimeout(connectWS, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
      };
    };

    connectWS();

    return () => {
      isCleanup = true;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
    };
  }, [user?.id]);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    setLoading(true);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    try {
      const data = await api.get<User>('/api/auth/me');
      setUser(data);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
