
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
   pgEnum,
} from "drizzle-orm/pg-core";

import { users } from "./schema";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    slug: varchar("slug", {
      length: 150,
    }).notNull(),

    domain: varchar("domain", {
      length: 255,
    }),
    
    description: text("description"),

    logoUrl: text("logo_url"),

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
    uniqueIndex("companies_slug_unique").on(
      table.slug
    ),
  ]
);

export const companyInviteLinks = pgTable(
  "company_invite_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    tokenHash: varchar("token_hash", {
      length: 64,
    })
      .notNull()
      .unique(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("company_invite_links_company_unique")
      .on(table.companyId),
  ]
);

export const companyMemberRoleEnum = pgEnum(
  "company_member_role",
  ["OWNER", "ADMIN", "MEMBER"]
);

export const companyMemberStatusEnum = pgEnum(
  "company_member_status",
  ["ACTIVE", "PENDING", "REJECTED"]
);

export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    role: companyMemberRoleEnum("role")
      .notNull()
      .default("MEMBER"),

    status: companyMemberStatusEnum("status")
      .notNull()
      .default("PENDING"),

    joinedAt: timestamp("joined_at", {
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
    uniqueIndex("company_members_company_user_unique").on(
      table.companyId,
      table.userId
    ),
  ]
);