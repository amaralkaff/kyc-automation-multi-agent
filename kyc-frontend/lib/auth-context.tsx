"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Role, AuthenticationResponse } from "./api";

interface UserInfo {
  userId: number;
  username: string;
  role: Role;
}

interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: AuthenticationResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Check for token and user in localStorage on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated and trying to access protected route
      if (!token && !isPublicRoute) {
        router.push("/login");
      }
      // Redirect to dashboard if authenticated and trying to access auth pages
      if (token && isPublicRoute) {
        router.push("/");
      }
    }
  }, [token, isLoading, isPublicRoute, router]);

  const login = (response: AuthenticationResponse) => {
    const userInfo: UserInfo = {
      userId: response.userId,
      username: response.username,
      role: response.role,
    };
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setToken(response.token);
    setUser(userInfo);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
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
