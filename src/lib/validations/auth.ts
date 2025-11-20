import { z } from "zod";

// schema matching your backend DTO
export const signUpSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(100, "Şifre en fazla 100 karakter olmalıdır")
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        "Şifre en az bir büyük harf, bir küçük harf ve bir rakam/özel karakter içermelidir"
      ),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, "İsim en az 2 karakter olmalıdır")
      .max(100, "İsim en fazla 100 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi gereklidir")
    .email("Geçerli bir e-posta adresi giriniz"),
});

export const resetPasswordSchema = z.object({
    newPassword: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(100, "Şifre en fazla 100 karakter olabilir")
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        "Şifre en az bir büyük harf, bir küçük harf ve bir rakam/özel karakter içermelidir"
      ),
    confirmPassword: z.string().min(1, "Şifre tekrarı gereklidir"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
