// schema.ts
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  date,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

// 1) Clerk-backed users
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID (UUID)
  name: varchar("name", { length: 100 }), // optional display name
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

// 2) Items catalog
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  cost_price: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  sale_price: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  user_id: text("user_id").references(() => users.id), // Nullable by default, allowing for global items
});

// 3) Suppliers Table (MODIFIED for nullable user_id)
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").references(() => users.id), // Nullable, allowing for global suppliers
  name: varchar("name", { length: 200 }).notNull(),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

// 4) Transactions Table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }),
  supplier_id: integer("supplier_id").references(() => suppliers.id),
  date: date("date").notNull(),
  type: text("type").notNull(),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  payment_method: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  is_stock_related: boolean("is_stock_related").notNull().default(false),
});

// 5) Transaction Items
export const transaction_items = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transaction_id: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  item_id: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 6) Stock Movements
export const stock_movements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id), // Or nullable if global items can have movements not tied to a user action
  item_id: integer("item_id").notNull().references(() => items.id),
  change_qty: integer("change_qty").notNull(),
  reason: text("reason").notNull(),
  movement_at: timestamp("movement_at").notNull().default(sql`now()`),
  transaction_item_id: integer("transaction_item_id").references(() => transaction_items.id),
});
