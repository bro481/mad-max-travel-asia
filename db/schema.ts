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

export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement:true }),
  slug: text("slug").notNull().unique(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en").notNull(),
  city: text("city").notNull(),
  areaZh: text("area_zh").notNull().default(""),
  areaEn: text("area_en").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  images: text("images").notNull().default("[]"),
  imageCategories: text("image_categories").notNull().default("{}"),
  guests: integer("guests").notNull().default(2),
  bedrooms: integer("bedrooms").notNull().default(1),
  beds: integer("beds").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  descriptionZh: text("description_zh").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  amenities: text("amenities").notNull().default("[]"),
  highlights: text("highlights").notNull().default("[]"),
  nearby: text("nearby").notNull().default("[]"),
  priceFrom: integer("price_from").notNull().default(0),
  priceNote: text("price_note").notNull().default("旺季价格请咨询"),
  status: text("status").notNull().default("draft"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
