import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Tell us your name"),
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
