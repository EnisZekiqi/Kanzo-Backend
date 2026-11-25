import * as z from "zod";

export const createTaskSchema = z.object({
  projectId:z.uuid("Project ID must be a valid UUID"),
  title: z.string()
    .trim()
    .min(1, "Task title is required")
    .max(200, "Task title must be 200 characters or less"),

  description: z.string()
    .trim()
    .max(1000, "Task description must be 1000 characters or less")
    .nullable().optional(),

  status :z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),

  assigneeId: z.uuid("Assignee ID must be a valid UUID")
    .optional(),

  dueDate: z.iso.date("Due date must be a valid date")
    .optional(),
});
