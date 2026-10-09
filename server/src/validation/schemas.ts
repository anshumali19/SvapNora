import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  subject: z.string().trim().min(3, "Please add a subject").max(160),
  category: z.enum(["GENERAL", "TECHNICAL", "PARTNERSHIP", "COLLABORATION"]).default("GENERAL"),
  message: z.string().trim().min(20, "Please provide a little more detail").max(5000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please agree to the privacy notice" }),
  }),
  company: z.string().max(0).optional().or(z.literal("")),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(400),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const contactStatusSchema = z.object({ status: z.enum(["NEW", "READ", "ARCHIVED"]) });

export const idParamSchema = z.object({ id: z.string().min(1).max(60) });

export const featureSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(80),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(1000),
  status: z.enum(["IMPLEMENTED", "IN_PROGRESS", "PLANNED", "RESEARCH"]),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isPublished: z.coerce.boolean().default(false),
});

export const milestoneSchema = z.object({
  phase: z.string().trim().min(1, "Phase is required").max(80),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(1000),
  status: z.enum(["IMPLEMENTED", "IN_PROGRESS", "PLANNED", "RESEARCH"]),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isPublished: z.coerce.boolean().default(false),
});

export const roadmapSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(80),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(1000),
  status: z.enum(["IMPLEMENTED", "IN_PROGRESS", "PLANNED", "RESEARCH"]),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isPublished: z.coerce.boolean().default(false),
});

export const paymentStatusEnum = z.enum(["PENDING", "SUCCESSFUL", "FAILED", "CANCELLED", "PARTIALLY_REFUNDED", "REFUNDED"]);

export const paymentSchema = z.object({
  providerTxnId: z.string().min(1, "Provider transaction id is required").max(200),
  customerName: z.string().trim().max(160).nullable().optional(),
  customerEmail: z.string().trim().email().max(200).nullable().optional(),
  orderRef: z.string().trim().max(160).nullable().optional(),
  amountMinor: z.coerce.number().int().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency code must be 3 letters"),
  method: z.string().trim().max(60).nullable().optional(),
  status: paymentStatusEnum.default("PENDING"),
  notes: z.string().trim().max(1000).nullable().optional(),
  createdAt: z.coerce.date().optional(),
});

export const paymentUpdateSchema = paymentSchema.partial();

export const paymentVerifySchema = z.object({
  id: z.string().min(1).max(60),
  amountMinor: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const refundSchema = z.object({
  amountMinor: z.coerce.number().int().positive("Refund amount must be positive"),
  reason: z.string().trim().max(500).nullable().optional(),
});

export const adminCreateSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  password: z.string().min(10, "Use at least 10 characters").max(400),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
});

// --- End-user accounts -------------------------------------------------------
const password = z.string().min(10, "Use at least 10 characters").max(400);
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  company: z.string().trim().max(160).optional(),
  password,
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree to the privacy notice" }) }),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export const forgotPasswordSchema = z.object({ email: z.string().trim().email().max(200) });
export const resetPasswordSchema = z.object({ token: z.string().min(10).max(400), password });
export const verifyEmailSchema = z.object({ token: z.string().min(10).max(400) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(400), newPassword: password });
export const profileUpdateSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), company: z.string().trim().max(160).nullable().optional() });

// --- Admin: client accounts & portal projects --------------------------------
export const clientCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).nullable().optional(),
  password: password.optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  sendInvite: z.coerce.boolean().default(true),
});
export const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  company: z.string().trim().max(160).nullable().optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});
export const projectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"]).default("PLANNED"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  dueDate: z.coerce.date().nullable().optional(),
});
export const projectUpdateSchema = projectSchema.partial();
