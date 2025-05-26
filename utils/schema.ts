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
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

// 1) Clerk-backed users
export const users = pgTable("users", {
  id:         text("id").primaryKey(),           // Clerk user ID (UUID)
  name:       varchar("name", { length: 100 }),  // optional display name
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

// 2) Items catalog
export const items = pgTable("items", {
  id:         serial("id").primaryKey(),
  sku:        varchar("sku", { length: 50 }).unique().notNull(),
  name:       varchar("name", { length: 150 }).notNull(),
  cost_price: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  sale_price: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

// 3) Transactions
export const transactions = pgTable("transactions", {
  id:             serial("id").primaryKey(),
  user_id:        text("user_id").notNull().references(() => users.id),
  name:           varchar("name", { length: 200 }).notNull(),
  date:           date("date").notNull(),
  type:           text("type").notNull(),         // 'income' | 'expense'
  total_amount:   numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  payment_method: varchar("payment_method", { length: 50 }),
  notes:          text("notes"),
  created_at:     timestamp("created_at").notNull().default(sql`now()`),
});

// 4) Transaction Items
export const transaction_items = pgTable("transaction_items", {
  id:             serial("id").primaryKey(),
  transaction_id: integer("transaction_id").notNull().references(() => transactions.id),
  item_id:        integer("item_id").notNull().references(() => items.id),
  quantity:       integer("quantity").notNull(),
  unit_price:     numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 5) Stock Movements
export const stock_movements = pgTable("stock_movements", {
  id:          serial("id").primaryKey(),
  user_id:     text("user_id").notNull().references(() => users.id),
  item_id:     integer("item_id").notNull().references(() => items.id),
  change_qty:  integer("change_qty").notNull(),
  reason:      text("reason").notNull(),            // 'purchase' | 'sale' | 'adjustment'
  movement_at: timestamp("movement_at").notNull().default(sql`now()`),
});
