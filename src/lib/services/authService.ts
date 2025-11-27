
import Cookies from 'js-cookie';
import type { User, Session, AuthResponse, ProfileResponse } from '@/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Auth Service with Bearer Token Authentication
 * 
 * This service stores both user data and session token in cookies.
 * The session token is sent as a Bearer token in the Authorization header.
 */
export const authService = {
  /**
   * Set user data in cookies
   */
  setUserData(user: User) {
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: 7, // 7 days
    };

    Cookies.set('user_data', JSON.stringify(user), cookieOptions);
  },

  /**
   * Get user data from cookies
   */
  getUserData(): User | null {
    try {
      const userData = Cookies.get('user_data');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Set session token in cookies
   */
  setSessionToken(token: string) {
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: 7, // 7 days
    };

    Cookies.set('session_token', token, cookieOptions);
  },

  /**
   * Get session token from cookies
   */
  getSessionToken(): string | null {
    return Cookies.get('session_token') || null;
  },

  /**
   * Clear all auth-related cookies
   */
  clearAuthCookies() {
    Cookies.remove('user_data', { path: '/' });
    Cookies.remove('session_token', { path: '/' });
  },

  /**
   * Get authorization headers with Bearer token
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getSessionToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: allows cookies to be set
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Giriş işlemi başarısız oldu');
      }

      // Store user data and session token
      if (result.user) {
        this.setUserData(result.user);
      }
      if (result.session) {
        this.setSessionToken(result.session);
      }

      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign up user
   */
  async signUp(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Kayıt işlemi başarısız oldu');
      }

      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/signout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearAuthCookies();
    }
  },

  /**
   * Get current user profile and session
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        // Session is invalid or expired
        this.clearAuthCookies();
        throw new Error('Session expired or invalid');
      }

      const result = await response.json();

      // Update local user data cache
      if (result.user) {
        this.setUserData(result.user);
      }

      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    name?: string;
    image?: string;
  }): Promise<{ success: boolean; user: User }> {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Profil güncellenemedi');
      }

      if (result.user) {
        this.setUserData(result.user);
      }

      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    revokeOtherSessions = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Şifre değiştirilemedi');
      }

      return result;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  /**
   * Forgot password - Send reset email
   */
  async forgotPassword(
    email: string,
    redirectUrl?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, redirectUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'İşlem başarısız oldu');
      }

      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Şifre sıfırlanamadı');
      }

      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Doğrulama başarısız oldu');
      }

      return result;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'E-posta gönderilemedi');
      }

      return result;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<{
    success: boolean;
    sessions: Array<Session & { isCurrent: boolean }>;
  }> {
    try {
      const response = await fetch(`${API_URL}/auth/sessions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Oturumlar alınamadı');
      }

      return result;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Oturum sonlandırılamadı');
      }

      return result;
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  },

  /**
   * Revoke all other sessions (keep current)
   */
  async revokeAllSessions(): Promise<{
    success: boolean;
    message: string;
    revokedCount: number;
  }> {
    try {
      const response = await fetch(`${API_URL}/auth/sessions`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Oturumlar sonlandırılamadı');
      }

      return result;
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated (has valid session)
   */
  isAuthenticated(): boolean {
    const userData = this.getUserData();
    const token = this.getSessionToken();
    return userData !== null && token !== null;
  },

  /**
   * Check authentication status and verify with backend
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      this.clearAuthCookies();
      return false;
    }
  },
};
