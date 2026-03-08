import { z } from 'zod';

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(4),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(6),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  phone:     z.string().optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;
