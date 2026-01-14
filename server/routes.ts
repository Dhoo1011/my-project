import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { verifyDiscordMembership } from "./discord";
import { sendPasswordResetEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Admin routes require authentication - refreshes permissions from database
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Refresh permissions from database to ensure they are up-to-date
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.session.permissions = user.permissions || [];
      req.session.username = user.username;
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
    next();
  };

  // Require specific permission - refreshes from database
  const requirePermission = (permission: string) => async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Refresh permissions from database
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.session.permissions = user.permissions || [];
      const permissions = user.permissions || [];
      if (!permissions.includes(permission) && !permissions.includes("manage_users")) {
        return res.status(403).json({ message: "ليس لديك صلاحية للقيام بهذا الإجراء" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
    next();
  };

  // Require admin (manage_users permission) - refreshes from database
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Refresh permissions from database
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.session.permissions = user.permissions || [];
      const permissions = user.permissions || [];
      if (!permissions.includes("manage_users")) {
        return res.status(403).json({ message: "يجب أن تمتلك صلاحية إدارة المستخدمين" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
    next();
  };

  // Create default admin user if not exists
  (async () => {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "1234";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await storage.createUser({
        username: "admin",
        passwordHash,
        rank: "لواء",
        permissions: ["manage_users", "manage_announcements", "manage_wanted", "manage_reports", "manage_personnel"],
        displayName: "مدير النظام",
      });
      console.log("Default admin user created");
    }
  })();

  // Auth - Login with database
  app.post(api.auth.login.path, async (req: any, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ success: false, message: "اسم المستخدم غير موجود ❌" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة ❌" });
      }
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.permissions = user.permissions || [];
      
      res.json({ 
        success: true, 
        message: "تم تسجيل الدخول بنجاح ✅",
        user: { username: user.username, rank: user.rank, permissions: user.permissions, displayName: user.displayName }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
    }
  });

  // Auth - Check session validity and refresh permissions from database
  app.get("/api/auth/me", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ authenticated: false });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ authenticated: false });
      }
      
      // Always update session with latest permissions from database
      req.session.permissions = user.permissions || [];
      req.session.username = user.username;
      
      res.json({ 
        authenticated: true,
        user: { 
          username: user.username, 
          rank: user.rank, 
          permissions: user.permissions, 
          displayName: user.displayName 
        }
      });
    } catch (error) {
      res.status(401).json({ authenticated: false });
    }
  });

  // Auth - Register new user (admin only)
  app.post("/api/auth/register", requireAdmin, async (req: any, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
        password: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
        rank: z.string().optional(),
        permissions: z.array(z.string()).optional(),
        displayName: z.string().optional(),
      });
      
      const input = schema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "اسم المستخدم موجود بالفعل" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      const newUser = await storage.createUser({
        username: input.username,
        passwordHash,
        rank: input.rank || "مجند",
        permissions: input.permissions || ["view_only"],
        displayName: input.displayName || input.username,
      });
      
      res.status(201).json({ 
        success: true, 
        message: "تم إنشاء المستخدم بنجاح",
        user: { id: newUser.id, username: newUser.username, rank: newUser.rank, permissions: newUser.permissions }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Get all users (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    const allUsers = await storage.getUsers();
    // Don't return password hashes
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      username: u.username,
      rank: u.rank,
      permissions: u.permissions,
      displayName: u.displayName,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  });

  // Update user rank and permissions (admin only)
  app.patch("/api/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف المستخدم غير صالح" });
      }
      
      // Prevent changing own permissions
      if (req.session.userId === id) {
        return res.status(400).json({ message: "لا يمكنك تغيير صلاحياتك" });
      }
      
      const { rank, permissions } = req.body;
      await storage.updateUser(id, { rank, permissions });
      res.json({ success: true, message: "تم تحديث المستخدم بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تحديث المستخدم" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف المستخدم غير صالح" });
      }
      
      // Prevent deleting current user
      if (req.session.userId === id) {
        return res.status(400).json({ message: "لا يمكنك حذف حسابك الحالي" });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف المستخدم" });
    }
  });

  // Change own password
  app.post("/api/users/change-password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "يرجى ملء جميع الحقول" });
      }
      if (newPassword.length < 4) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      const bcrypt = await import("bcryptjs");
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash: hashedPassword });
      
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  app.post("/api/auth/logout", async (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true });
    });
  });

  // Forgot Password - Request reset link
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      if (!user) {
        return res.json({ success: true, message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور" });
      }

      // Delete any existing reset tokens for this user
      await storage.deletePasswordResetTokensByUserId(user.id);

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Token expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

      // Build reset URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      const emailResult = await sendPasswordResetEmail(email, resetLink);
      
      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error);
      }

      res.json({ success: true, message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور" });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "حدث خطأ أثناء معالجة الطلب" });
    }
  });

  // Validate reset token
  app.get("/api/auth/reset-password/validate", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.json({ valid: false, message: "رمز غير صالح" });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetToken = await storage.getPasswordResetTokenByHash(tokenHash);

      if (!resetToken) {
        return res.json({ valid: false, message: "رمز غير صالح أو منتهي الصلاحية" });
      }

      if (resetToken.consumedAt) {
        return res.json({ valid: false, message: "تم استخدام هذا الرمز بالفعل" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.json({ valid: false, message: "انتهت صلاحية الرمز" });
      }

      res.json({ valid: true });
    } catch (error) {
      res.json({ valid: false, message: "حدث خطأ أثناء التحقق" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "البيانات غير مكتملة" });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetToken = await storage.getPasswordResetTokenByHash(tokenHash);

      if (!resetToken) {
        return res.status(400).json({ message: "رمز غير صالح أو منتهي الصلاحية" });
      }

      if (resetToken.consumedAt) {
        return res.status(400).json({ message: "تم استخدام هذا الرمز بالفعل" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "انتهت صلاحية الرمز" });
      }

      // Hash new password and update user
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { passwordHash });

      // Mark token as consumed
      await storage.consumePasswordResetToken(resetToken.id);

      // Delete all other tokens for this user
      await storage.deletePasswordResetTokensByUserId(resetToken.userId);

      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "حدث خطأ أثناء إعادة تعيين كلمة المرور" });
    }
  });

  // Update user email (admin can set email for users)
  app.patch("/api/users/:id/email", requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف المستخدم غير صالح" });
      }

      const { email } = req.body;
      await storage.updateUser(id, { email: email || null });
      res.json({ success: true, message: "تم تحديث البريد الإلكتروني" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تحديث البريد الإلكتروني" });
    }
  });

  // Internal Data (Protected)
  app.get("/api/reports", requireAuth, async (req, res) => {
    const reports = await storage.getReports();
    res.json(reports);
  });

  // Reports
  app.post(api.reports.create.path, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      
      // Discord verification temporarily disabled - bot needs to be added to server
      // To enable: add the bot to Phantom RP server with SERVER MEMBERS INTENT
      // const discordId = input.discord;
      // const verification = await verifyDiscordMembership(discordId);
      // if (!verification.isMember) {
      //   return res.status(400).json({
      //     message: verification.error || "يجب أن تكون عضواً في سيرفر Phantom RP لتقديم بلاغ",
      //     field: "discord",
      //   });
      // }
      
      await storage.createReport(input);
      res.json({ success: true, message: "تم إرسال البلاغ بنجاح" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Departments
  app.get(api.departments.list.path, async (req, res) => {
    const depts = await storage.getDepartments();
    res.json(depts);
  });

  // Announcements
  app.get(api.announcements.list.path, async (req, res) => {
    const type = req.query.type as "public" | "internal" | undefined;
    const items = await storage.getAnnouncements(type);
    res.json(items);
  });

  app.post(api.announcements.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.announcements.create.input.parse(req.body);
      const item = await storage.createAnnouncement(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch("/api/announcements/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      type: z.enum(["public", "internal"]).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    }
    const updated = await storage.updateAnnouncement(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteAnnouncement(id);
    res.json({ success: true });
  });

  // Wanted List
  app.get(api.wanted.list.path, async (req, res) => {
    const items = await storage.getWantedPersons();
    res.json(items);
  });

  app.post(api.wanted.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.wanted.create.input.parse(req.body);
      const item = await storage.createWantedPerson(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch("/api/wanted/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      name: z.string().min(1).optional(),
      crime: z.string().min(1).optional(),
      status: z.enum(["wanted", "captured"]).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    }
    const updated = await storage.updateWantedPerson(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/wanted/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteWantedPerson(id);
    res.json({ success: true });
  });

  // Wanted Vehicles (السيارات المطلوبة)
  app.get("/api/wanted-vehicles", async (req, res) => {
    const items = await storage.getWantedVehicles();
    res.json(items);
  });

  app.get("/api/wanted-vehicles/public", async (req, res) => {
    const items = await storage.getWantedVehicles();
    const publicItems = items.filter(v => v.visibility === "public");
    res.json(publicItems);
  });

  app.post("/api/wanted-vehicles", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        plateNumber: z.string().min(1),
        vehicleType: z.string().min(1),
        color: z.string().optional(),
        reason: z.string().min(1),
        status: z.enum(["wanted", "found"]).optional(),
        visibility: z.enum(["public", "internal"]).optional(),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const item = await storage.createWantedVehicle(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/wanted-vehicles/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      plateNumber: z.string().min(1).optional(),
      vehicleType: z.string().min(1).optional(),
      color: z.string().optional(),
      reason: z.string().min(1).optional(),
      status: z.enum(["wanted", "found"]).optional(),
      visibility: z.enum(["public", "internal"]).optional(),
      imageUrl: z.string().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    }
    const updated = await storage.updateWantedVehicle(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/wanted-vehicles/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteWantedVehicle(id);
    res.json({ success: true });
  });

  // Internal Reports (بلاغات داخلية من عسكري لعسكري)
  app.get("/api/internal-reports", requireAuth, async (req, res) => {
    const items = await storage.getInternalReports();
    res.json(items);
  });

  app.post("/api/internal-reports", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        fromPersonnelId: z.number().optional(),
        fromName: z.string().min(1),
        toPersonnelId: z.number().optional(),
        toName: z.string().min(1),
        subject: z.string().min(1),
        content: z.string().min(1),
        attachment: z.string().min(1, "المرفق مطلوب"),
      });
      const parsed = schema.parse(req.body);
      const input = {
        ...parsed,
        fromPersonnelId: parsed.fromPersonnelId ?? 0,
        toPersonnelId: parsed.toPersonnelId ?? 0,
      };
      const item = await storage.createInternalReport(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/internal-reports/:id/status", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      status: z.enum(["pending", "reviewed", "resolved"]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const updated = await storage.updateInternalReportStatus(id, parsed.data.status);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/internal-reports/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteInternalReport(id);
    res.json({ success: true });
  });

  // Report Management
  app.patch("/api/reports/:id/status", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      status: z.enum(["pending", "reviewed", "resolved"]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const updated = await storage.updateReportStatus(id, parsed.data.status);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteReport(id);
    res.json({ success: true });
  });

  // Personnel (Military Affairs)
  app.get("/api/personnel", requireAuth, async (req, res) => {
    const items = await storage.getPersonnel();
    res.json(items);
  });

  app.post("/api/personnel", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        rank: z.string().min(1),
        badge: z.string().optional(),
        department: z.string().min(1),
        discord: z.string().optional(),
        status: z.enum(["active", "on_leave", "suspended", "resigned", "retired"]).optional(),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const item = await storage.createPersonnel(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/personnel/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const schema = z.object({
      name: z.string().min(1).optional(),
      rank: z.string().min(1).optional(),
      badge: z.string().optional(),
      department: z.string().min(1).optional(),
      discord: z.string().optional(),
      status: z.enum(["active", "on_leave", "suspended", "resigned", "retired"]).optional(),
      imageUrl: z.string().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    }
    const updated = await storage.updatePersonnel(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/personnel/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deletePersonnel(id);
    res.json({ success: true });
  });

  // Personnel Records (السجلات)
  app.get("/api/personnel-records", requireAuth, async (req, res) => {
    const personnelId = req.query.personnelId ? parseInt(req.query.personnelId as string) : undefined;
    const records = await storage.getPersonnelRecords(personnelId);
    res.json(records);
  });

  app.post("/api/personnel-records", requireAuth, async (req: any, res) => {
    try {
      const schema = z.object({
        personnelId: z.number(),
        type: z.enum(["promotion", "warning", "leave", "note", "discipline", "commendation"]),
        title: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        date: z.string().optional(),
        createdBy: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const record = await storage.createPersonnelRecord({
        ...input,
        createdBy: req.session?.userId || "admin",
        date: input.date ? new Date(input.date) : undefined,
      });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/personnel-records/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deletePersonnelRecord(id);
    res.json({ success: true });
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const depts = await storage.getDepartments();
  if (depts.length === 0) {
    await storage.createDepartment({
      title: "الدوريات",
      description: "حفظ الأمن والاستجابة للبلاغات.",
      icon: "Shield"
    });
    await storage.createDepartment({
      title: "التحقيقات",
      description: "متابعة القضايا وجمع الأدلة.",
      icon: "FileText"
    });
    await storage.createDepartment({
      title: "المرور",
      description: "تنظيم السير والحوادث.",
      icon: "AlertTriangle"
    });
    await storage.createDepartment({
      title: "الأكاديمية",
      description: "تدريب وتأهيل الأفراد الجدد.",
      icon: "GraduationCap"
    });
    await storage.createDepartment({
      title: "الشؤون",
      description: "الإدارة والملفات والموارد.",
      icon: "Briefcase"
    });
  }

  const announcements = await storage.getAnnouncements();
  if (announcements.length === 0) {
    await storage.createAnnouncement({
      title: "افتتاح التقديم",
      content: "تم فتح باب القبول والتسجيل في الأكاديمية لهذا الموسم.",
      type: "public"
    });
    await storage.createAnnouncement({
      title: "اجتماع طارئ",
      content: "يوجد اجتماع لجميع الضباط في القاعة الرئيسية الساعة ٨ مساءً.",
      type: "internal"
    });
  }
}
