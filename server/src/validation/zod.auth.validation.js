const { z } = require("zod");


exports.registerSchema = z
  .object({
    userName: z.string().min(4).max(14),
    firstName: z.string().min(4).max(14),
    lastName: z.string().min(4).max(14),
    email: z.string().email(),
    phone: z.string().min(1),
    DOB: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    gender: z.enum(["Male", "Female"]),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(["client", "provider", "admin"]).optional(),
  })
  // Check if password matches confirmPassword
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  // Check that username does not contain spaces
  .refine((data) => !data.userName.includes(" "), {
    message: "Username cannot contain spaces",
    path: ["userName"],
  })
  // Check that user is at least 18 years old
  .refine(
    (data) => {
      const birthDate = new Date(data.DOB);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 18;
    },
    {
      message: "You must be at least 18 years old",
      path: ["DOB"],
    }
  );

exports.loginSchema = z
  .object({
    userName: z
      .string()
      .min(4, { message: "Username should not be less than 4 characters" })
      .max(14, { message: "Username should not be more than 14 characters" })
      .optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().min(1, "Phone is required").optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.userName || data.email || data.phone, {
    message: "You must provide either email, username, or phone",
    path: ["identifier"], // virtual path for cleaner error display
  });
