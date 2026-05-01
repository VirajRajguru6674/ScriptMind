import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  plan?: string;
  avatar_url?: string;
  org_id?: number | null;
  billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  githubLogin: (code: string, redirectUri?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:3001/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    // Store token and user data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Store token and user data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const googleLogin = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Google login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const githubLogin = async (code: string, redirectUri?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "GitHub login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, githubLogin, logout, updateUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

