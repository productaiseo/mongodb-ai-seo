const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


export const authApi = {
  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Şifre sıfırlama başarısız oldu');
    }

    return response.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/auth/reset-password?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Şifre sıfırlama başarısız oldu. Link geçerliliğini yitirmiş olabilir.'
      );
    }

    return response.json();
  },
};
