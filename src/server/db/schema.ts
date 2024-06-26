import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { generateId } from "~/lib/utils";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `mentee-register_${name}`);

export const statusEnum = pgEnum(`mentee-register_status`, [
  "todo",
  "in-progress",
  "done",
  "canceled",
]);

export const labelEnum = pgEnum(`mentee-register_label`, [
  "bug",
  "feature",
  "enhancement",
  "documentation",
]);

export const priorityEnum = pgEnum(`mentee-register_priority`, [
  "low",
  "medium",
  "high",
]);

export const UserRoleEnum = pgEnum(`mentee-register_userRole`, [
  "ADMIN",
  "USER",
]);

// Table definitions

export const posts = createTable(
  "post",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    createdById: varchar("createdById", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt"),
  },
  (example) => ({
    createdByIdIdx: index("createdById_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .$defaultFn(() => generateId())
    .notNull()
    .primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: UserRoleEnum("role").notNull().default("USER"),
  isTwoFactorEnabled: boolean("isTwoFactorEnabled").default(false),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  twoFactorConfirmation: one(twoFactorConfirmation),
}));

export const accounts = createTable(
  "account",
  {
    id: varchar("id", { length: 255 })
      .default(sql`gen_random_uuid()`)
      .notNull(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verificationToken",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.email, vt.token] }),
  }),
);

export const passwordResetTokens = createTable("passwordResetToken", {
  id: varchar("id", { length: 255 })
    .notNull()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const twoFactorTokens = createTable("twoFactorToken", {
  id: varchar("id", { length: 255 })
    .notNull()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const twoFactorConfirmation = createTable(
  "twoFactorConfirmation",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
  },
  (tfc) => ({
    uniqueKey: uniqueIndex("tfc_userId_unique").on(tfc.userId),
  }),
);

export const twoFactorConfirmationRelations = relations(
  twoFactorConfirmation,
  ({ one }) => ({
    user: one(users, {
      fields: [twoFactorConfirmation.userId],
      references: [users.id],
    }),
  }),
);

export const tasks = createTable("tasks", {
  id: varchar("id", { length: 30 })
    .$defaultFn(() => generateId())
    .primaryKey(),
  code: varchar("code", { length: 256 }).unique(),
  title: varchar("title", { length: 256 }),
  status: statusEnum("status").notNull().default("todo"),
  label: labelEnum("label").notNull().default("bug"),
  priority: priorityEnum("priority").notNull().default("low"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`current_timestamp`),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
