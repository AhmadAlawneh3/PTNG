
import { z } from "zod";
import type { UserRole } from "@/types/user";

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  employee_id: z.string().min(1, { message: "Employee ID must be at least 1 characters." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." })
    .optional()
    .or(z.literal('')), // Allow empty password for existing users
  role: z.enum(["Tester", "Manager", "Admin"]) as z.ZodType<UserRole>,
});

export type UserFormSchema = z.infer<typeof userSchema>;
