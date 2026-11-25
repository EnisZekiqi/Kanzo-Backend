import * as z from "zod";
import { passwordSchema } from "./loginSchema";

export const createCompanySchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(150, "Name must be 150 characters or less"),
    
  slug: z.string()
    .min(1, "Slug is required")
    .max(150, "Slug must be 150 characters or less")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
    
  domain: z.string()
    .max(255, "Domain must be 255 characters or less"),
    
  description: z.string()
    .optional(),
    
  logoUrl: z.string()
    .url("Must be a valid URL")
    .optional(),
})

export const joinCompanySchema = z.object({
  tokenHash:z.string().min(1,"Invitation Link is required").max(64,'The invitation link must be 64 characters or less')
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().nullable().optional(),
  inviteCode: z.string().min(1).max(32),
  key: z.string().min(1).max(10),
});

// `projectId` identifies the row to update; it is not part of the
// create-project payload, so it must be added explicitly to the edit schema.
export const editProjectSchema = createProjectSchema.partial().extend({
  projectId: z.uuid("Project ID must be a valid UUID"),
});

export const editUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.newPassword && !data.currentPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["currentPassword"],
      message: "Current password is required when changing password",
    });
  }

  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "At least one setting must be supplied",
    });
  }
});

export const editCompanySchmea = z.object({
   slug: z.string()
    .min(1, "Slug is required")
    .max(150, "Slug must be 150 characters or less")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  domain:z.string().max(255).optional(),
  description:z.string().optional(),
   logoUrl: z.string()
    .url("Must be a valid URL")
    .optional() 
})
