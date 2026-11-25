import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { users } from "./schema";

export const taskStatusEnum = pgEnum(
  "task_status",
  ["TODO", "IN_PROGRESS", "DONE"]
);

export const taskPriorityEnum = pgEnum(
  "task_priority",
  ["LOW", "MEDIUM", "HIGH", "URGENT"]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", { length: 200 }).notNull(),

    description: text("description"),

    status: taskStatusEnum("status")
      .notNull()
      .default("TODO"),

    priority: taskPriorityEnum("priority")
      .notNull()
      .default("MEDIUM"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    assigneeId: uuid("assignee_id")
      .references(() => users.id, {
        onDelete: "set null",
      }),

    dueDate: date("due_date"),

    position: integer("position")
      .notNull()
      .default(0),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_project_status_idx").on(
      table.projectId,
      table.status
    ),

    index("tasks_assignee_status_idx").on(
      table.assigneeId,
      table.status
    ),
  ]
);