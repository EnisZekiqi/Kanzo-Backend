import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { companies } from "./company";
import { users } from "./schema"

export const projectStatusEnum = pgEnum(
  "project_status",
  ["ACTIVE", "ARCHIVED"]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    key: varchar("key", { length: 10 }).notNull(),

    inviteCode: varchar("invite_code", { length: 32 }).notNull(),

    description: text("description"),

    status: projectStatusEnum("status")
      .notNull()
      .default("ACTIVE"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("projects_company_key_unique").on(
      table.companyId,
      table.key
    ),
  ]
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId
    ),
  ]
);