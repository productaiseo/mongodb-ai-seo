"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import type {
  User,
  Session,
  AuthContextType,
} from "@/types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and session from backend
  const refreshSession = useCallback(async () => {
    try {
      const data = await authService.getProfile();

      if (data.success && data.user) {
        setUser(data.user);
        setSession(data.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setUser(null);
      setSession(null);
      authService.clearAuthCookies();
    }
  }, []);

  // Initialize: Check if user is already authenticated
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Quick check: Do we have cached user data?
      const cachedUser = authService.getUserData();
      
      if (cachedUser) {
        // We have cached data, use it immediately for fast UI
        setUser(cachedUser);
        
        // Then verify with backend in background
        try {
          await refreshSession();
        } catch (error) {
          // If verification fails, clear state
          setUser(null);
          setSession(null);
        }
      } else {
        // No cached data, check with backend
        try {
          await refreshSession();
        } catch (error) {
          // No valid session
          setUser(null);
          setSession(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [refreshSession]);

  // Sign in function
  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.signIn(email, password);

      if (result.user) {
        setUser(result.user);
        // Fetch full session data
        await refreshSession();
      }
    },
    [refreshSession]
  );

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setSession(null);
      router.push("/auth/signin");
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
