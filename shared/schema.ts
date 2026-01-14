import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Military ranks (الرتب العسكرية)
export const militaryRanks = [
  "مجند", "جندي", "جندي أول", "عريف", "رقيب", "رقيب أول", 
  "مساعد", "مساعد أول", "ملازم", "ملازم أول", "نقيب", 
  "رائد", "مقدم", "عقيد", "عميد", "لواء", "IA"
] as const;

// Junior ranks (Cadet to Sergeant 2) - can only view and submit internal reports
export const juniorRanks = ["مجند", "جندي", "جندي أول", "عريف", "رقيب", "رقيب أول"] as const;

// Permission types
export const permissionTypes = [
  "manage_users",           // إدارة المستخدمين
  "manage_announcements",   // إدارة الإعلانات
  "manage_wanted",          // إدارة المطلوبين
  "manage_reports",         // إدارة البلاغات
  "manage_personnel",       // إدارة شؤون الأفراد
  "view_announcements",     // عرض الإعلانات فقط
  "submit_internal_report", // تقديم بلاغ داخلي
  "manage_internal_reports", // إدارة البلاغات الداخلية
  "view_only"               // عرض فقط
] as const;

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rank: text("rank").default("مجند").notNull(),
  permissions: text("permissions").array().default([]).notNull(),
  displayName: text("display_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export type MilitaryRank = typeof militaryRanks[number];
export type PermissionType = typeof permissionTypes[number];

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["public", "internal"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wantedList = pgTable("wanted_list", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  crime: text("crime").notNull(),
  status: text("status", { enum: ["wanted", "captured"] }).default("wanted").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Lucide icon name
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertWantedSchema = createInsertSchema(wantedList).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  discord: text("discord"),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  status: text("status", { enum: ["pending", "reviewed", "resolved"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true }).extend({
  discord: z.string().min(17, "حساب الديسكورد يجب أن يكون 17-19 رقماً").max(19, "حساب الديسكورد يجب أن يكون 17-19 رقماً"),
  attachments: z.array(z.string()).min(1, "يجب رفع ملف واحد على الأقل"),
});

// Military Affairs - Officers/Personnel
export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rank: text("rank").notNull(),
  badge: text("badge"), // رقم الشارة
  department: text("department").notNull(),
  discord: text("discord"),
  joinDate: timestamp("join_date").defaultNow(),
  status: text("status", { enum: ["active", "on_leave", "suspended", "resigned", "retired"] }).default("active").notNull(),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({ id: true, createdAt: true });

// Military Affairs - Personnel Records (السجلات)
export const personnelRecords = pgTable("personnel_records", {
  id: serial("id").primaryKey(),
  personnelId: serial("personnel_id").notNull(),
  type: text("type", { enum: ["promotion", "warning", "leave", "note", "discipline", "commendation"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  date: timestamp("date").defaultNow(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPersonnelRecordSchema = createInsertSchema(personnelRecords).omit({ id: true, createdAt: true });

// Wanted Vehicles (السيارات المطلوبة)
export const wantedVehicles = pgTable("wanted_vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull(),
  vehicleType: text("vehicle_type").notNull(), // نوع السيارة
  color: text("color"),
  reason: text("reason").notNull(), // سبب الطلب
  status: text("status", { enum: ["wanted", "found"] }).default("wanted").notNull(),
  visibility: text("visibility", { enum: ["public", "internal"] }).default("public").notNull(),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWantedVehicleSchema = createInsertSchema(wantedVehicles).omit({ id: true, createdAt: true });

// Internal Reports (بلاغات داخلية من عسكري لعسكري)
export const internalReports = pgTable("internal_reports", {
  id: serial("id").primaryKey(),
  fromPersonnelId: integer("from_personnel_id").default(0).notNull(),
  fromName: text("from_name").notNull(),
  toPersonnelId: integer("to_personnel_id").default(0).notNull(),
  toName: text("to_name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  attachment: text("attachment").notNull(), // مرفق إجباري
  status: text("status", { enum: ["pending", "reviewed", "resolved"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInternalReportSchema = createInsertSchema(internalReports).omit({ id: true, createdAt: true });

// Explicit API types for frontend/hooks
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type WantedPerson = typeof wantedList.$inferSelect;
export type InsertWantedPerson = z.infer<typeof insertWantedSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;

export type PersonnelRecord = typeof personnelRecords.$inferSelect;
export type InsertPersonnelRecord = z.infer<typeof insertPersonnelRecordSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WantedVehicle = typeof wantedVehicles.$inferSelect;
export type InsertWantedVehicle = z.infer<typeof insertWantedVehicleSchema>;

export type InternalReport = typeof internalReports.$inferSelect;
export type InsertInternalReport = z.infer<typeof insertInternalReportSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
