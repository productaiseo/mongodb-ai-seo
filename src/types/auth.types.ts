
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  session?: string | Session;
}

export interface ProfileResponse {
  success: boolean;
  user: User;
  session: Session;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
