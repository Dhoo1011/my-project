import { db } from "./db";
import {
  announcements,
  wantedList,
  departments,
  reports,
  personnel,
  personnelRecords,
  users,
  wantedVehicles,
  internalReports,
  passwordResetTokens,
  type InsertAnnouncement,
  type InsertWantedPerson,
  type InsertDepartment,
  type InsertReport,
  type InsertPersonnel,
  type InsertPersonnelRecord,
  type InsertUser,
  type InsertWantedVehicle,
  type InsertInternalReport,
  type Announcement,
  type WantedPerson,
  type Department,
  type Report,
  type Personnel,
  type PersonnelRecord,
  type User,
  type WantedVehicle,
  type InternalReport,
  type PasswordResetToken
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAnnouncements(type?: "public" | "internal"): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  getWantedPersons(): Promise<WantedPerson[]>;
  createWantedPerson(person: InsertWantedPerson): Promise<WantedPerson>;
  updateWantedPerson(id: number, data: Partial<InsertWantedPerson>): Promise<WantedPerson | null>;
  deleteWantedPerson(id: number): Promise<boolean>;
  
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReportStatus(id: number, status: "pending" | "reviewed" | "resolved"): Promise<Report | null>;
  deleteReport(id: number): Promise<boolean>;

  // Personnel (Military Affairs)
  getPersonnel(): Promise<Personnel[]>;
  createPersonnel(person: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | null>;
  deletePersonnel(id: number): Promise<boolean>;

  // Personnel Records (السجلات)
  getPersonnelRecords(personnelId?: number): Promise<PersonnelRecord[]>;
  createPersonnelRecord(record: InsertPersonnelRecord): Promise<PersonnelRecord>;
  deletePersonnelRecord(id: number): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  updateUser(id: number, data: { rank?: string; permissions?: string[]; passwordHash?: string; email?: string }): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | null>;

  // Password Reset Tokens
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  consumePasswordResetToken(id: number): Promise<boolean>;
  deletePasswordResetTokensByUserId(userId: number): Promise<boolean>;

  // Wanted Vehicles (السيارات المطلوبة)
  getWantedVehicles(): Promise<WantedVehicle[]>;
  createWantedVehicle(vehicle: InsertWantedVehicle): Promise<WantedVehicle>;
  updateWantedVehicle(id: number, data: Partial<InsertWantedVehicle>): Promise<WantedVehicle | null>;
  deleteWantedVehicle(id: number): Promise<boolean>;

  // Internal Reports (البلاغات الداخلية)
  getInternalReports(): Promise<InternalReport[]>;
  createInternalReport(report: InsertInternalReport): Promise<InternalReport>;
  updateInternalReportStatus(id: number, status: "pending" | "reviewed" | "resolved"): Promise<InternalReport | null>;
  deleteInternalReport(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAnnouncements(type?: "public" | "internal"): Promise<Announcement[]> {
    let query = db.select().from(announcements).orderBy(desc(announcements.createdAt));
    if (type) {
      // @ts-ignore
      query = query.where(eq(announcements.type, type));
    }
    return await query;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null> {
    const [updated] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return updated || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return true;
  }

  async getWantedPersons(): Promise<WantedPerson[]> {
    return await db.select().from(wantedList).orderBy(desc(wantedList.createdAt));
  }

  async createWantedPerson(person: InsertWantedPerson): Promise<WantedPerson> {
    const [newPerson] = await db.insert(wantedList).values(person).returning();
    return newPerson;
  }

  async updateWantedPerson(id: number, data: Partial<InsertWantedPerson>): Promise<WantedPerson | null> {
    const [updated] = await db.update(wantedList).set(data).where(eq(wantedList.id, id)).returning();
    return updated || null;
  }

  async deleteWantedPerson(id: number): Promise<boolean> {
    await db.delete(wantedList).where(eq(wantedList.id, id));
    return true;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: number, status: "pending" | "reviewed" | "resolved"): Promise<Report | null> {
    const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
    return updated || null;
  }

  async deleteReport(id: number): Promise<boolean> {
    await db.delete(reports).where(eq(reports.id, id));
    return true;
  }

  // Personnel (Military Affairs)
  async getPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel).orderBy(desc(personnel.createdAt));
  }

  async createPersonnel(person: InsertPersonnel): Promise<Personnel> {
    const [newPerson] = await db.insert(personnel).values(person).returning();
    return newPerson;
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | null> {
    const [updated] = await db.update(personnel).set(data).where(eq(personnel.id, id)).returning();
    return updated || null;
  }

  async deletePersonnel(id: number): Promise<boolean> {
    await db.delete(personnel).where(eq(personnel.id, id));
    return true;
  }

  // Personnel Records (السجلات)
  async getPersonnelRecords(personnelId?: number): Promise<PersonnelRecord[]> {
    if (personnelId) {
      return await db.select().from(personnelRecords)
        .where(eq(personnelRecords.personnelId, personnelId))
        .orderBy(desc(personnelRecords.createdAt));
    }
    return await db.select().from(personnelRecords).orderBy(desc(personnelRecords.createdAt));
  }

  async createPersonnelRecord(record: InsertPersonnelRecord): Promise<PersonnelRecord> {
    const [newRecord] = await db.insert(personnelRecords).values(record).returning();
    return newRecord;
  }

  async deletePersonnelRecord(id: number): Promise<boolean> {
    await db.delete(personnelRecords).where(eq(personnelRecords.id, id));
    return true;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async updateUser(id: number, data: { rank?: string; permissions?: string[]; passwordHash?: string; email?: string }): Promise<boolean> {
    const updateData: any = {};
    if (data.rank) updateData.rank = data.rank;
    if (data.permissions) updateData.permissions = data.permissions;
    if (data.passwordHash) updateData.passwordHash = data.passwordHash;
    if (data.email !== undefined) updateData.email = data.email;
    await db.update(users).set(updateData).where(eq(users.id, id));
    return true;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt }).returning();
    return token;
  }

  async getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [token] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return token || null;
  }

  async consumePasswordResetToken(id: number): Promise<boolean> {
    await db.update(passwordResetTokens).set({ consumedAt: new Date() }).where(eq(passwordResetTokens.id, id));
    return true;
  }

  async deletePasswordResetTokensByUserId(userId: number): Promise<boolean> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    return true;
  }

  // Wanted Vehicles (السيارات المطلوبة)
  async getWantedVehicles(): Promise<WantedVehicle[]> {
    return await db.select().from(wantedVehicles).orderBy(desc(wantedVehicles.createdAt));
  }

  async createWantedVehicle(vehicle: InsertWantedVehicle): Promise<WantedVehicle> {
    const [newVehicle] = await db.insert(wantedVehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateWantedVehicle(id: number, data: Partial<InsertWantedVehicle>): Promise<WantedVehicle | null> {
    const [updated] = await db.update(wantedVehicles).set(data).where(eq(wantedVehicles.id, id)).returning();
    return updated || null;
  }

  async deleteWantedVehicle(id: number): Promise<boolean> {
    await db.delete(wantedVehicles).where(eq(wantedVehicles.id, id));
    return true;
  }

  // Internal Reports (البلاغات الداخلية)
  async getInternalReports(): Promise<InternalReport[]> {
    return await db.select().from(internalReports).orderBy(desc(internalReports.createdAt));
  }

  async createInternalReport(report: InsertInternalReport): Promise<InternalReport> {
    const [newReport] = await db.insert(internalReports).values(report).returning();
    return newReport;
  }

  async updateInternalReportStatus(id: number, status: "pending" | "reviewed" | "resolved"): Promise<InternalReport | null> {
    const [updated] = await db.update(internalReports).set({ status }).where(eq(internalReports.id, id)).returning();
    return updated || null;
  }

  async deleteInternalReport(id: number): Promise<boolean> {
    await db.delete(internalReports).where(eq(internalReports.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
