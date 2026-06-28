import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  stayLoggedIn: z.boolean(),
});

export const completeProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  rollNumber: z
    .string()
    .min(2, "Roll number is required")
    .max(30, "Roll number too long"),
  pubgId: z.string().min(1, "PUBG ID is required").max(50),
  pubgName: z.string().min(1, "PUBG name is required").max(50),
  gender: z.enum(["male", "female", "other"]),
  semester: z.number().int().min(1).max(12),
  degreeProgramme: z.string().min(1, "Degree programme is required"),
  photo: z.string().optional(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
