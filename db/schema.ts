import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement:true }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  travelDate: text("travel_date").notNull(),
  people: integer("people").notNull(),
  requirements: text("requirements").notNull(),
  message: text("message"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const inquiryRequests = sqliteTable("inquiry_requests", {
  id: integer("id").primaryKey({ autoIncrement:true }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  destinations: text("destinations").notNull(),
  services: text("services").notNull(),
  travelTime: text("travel_time"),
  message: text("message"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
