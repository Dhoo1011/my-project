import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Shield, FileText, Users, LogOut, LayoutDashboard, AlertCircle, Paperclip, Plus, Trash2, Check, Clock, Eye, Megaphone, Upload, Image, Briefcase, UserPlus, ClipboardList, Award, AlertTriangle, Calendar, MessageSquare, Star, Pencil, UserCog, Car, Globe, Lock, Key } from "lucide-react";
import { useReports, useWantedList, useAnnouncements, usePersonnel, usePersonnelRecords, useWantedVehicles, useInternalReports } from "@/hooks/use-police-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabType = "dashboard" | "reports" | "internal-reports" | "wanted" | "vehicles" | "announcements" | "personnel" | "records" | "users" | "submit-internal-report" | "view-announcements";
type RecordType = "promotion" | "warning" | "leave" | "note" | "discipline" | "commendation";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { toast } = useToast();
  
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: wanted, isLoading: wantedLoading } = useWantedList();
  const { data: wantedVehicles } = useWantedVehicles();
  const { data: internalReports, isLoading: internalReportsLoading } = useInternalReports();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { data: personnelList, isLoading: personnelLoading } = usePersonnel();
  const { data: personnelRecords, isLoading: recordsLoading } = usePersonnelRecords();

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<{ id: number; title: string; content: string; type: "public" | "internal" } | null>(null);
  const [showWantedModal, setShowWantedModal] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    rank: "Cadet",
    permissions: [] as string[],
    displayName: "",
  });
  const [newRecord, setNewRecord] = useState({
    personnelId: 0,
    type: "note" as RecordType,
    title: "",
    description: "",
    imageUrl: "",
  });
  const recordImagePathRef = useRef<Map<string, string>>(new Map());
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "public" as "public" | "internal" });
  const [newWanted, setNewWanted] = useState({ name: "", crime: "", status: "wanted" as "wanted" | "captured", imageUrl: "" });
  const [newVehicle, setNewVehicle] = useState({ plateNumber: "", vehicleType: "", color: "", reason: "", status: "wanted" as "wanted" | "found", visibility: "public" as "public" | "internal", imageUrl: "" });
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const vehicleImagePathRef = useRef<Map<string, string>>(new Map());
  const [newPersonnel, setNewPersonnel] = useState({ 
    name: "", 
    rank: "", 
    badge: "", 
    department: "", 
    discord: "", 
    status: "active" as "active" | "on_leave" | "suspended" | "resigned" | "retired",
    imageUrl: "",
    notes: ""
  });
  const wantedImagePathRef = useRef<Map<string, string>>(new Map());
  const personnelImagePathRef = useRef<Map<string, string>>(new Map());
  const [showInternalReportModal, setShowInternalReportModal] = useState(false);
  const [newInternalReport, setNewInternalReport] = useState({
    fromPersonnelId: 0,
    fromName: "",
    toPersonnelId: 0,
    toName: "",
    subject: "",
    content: "",
    attachment: "",
  });
  const internalReportAttachmentRef = useRef<Map<string, string>>(new Map());
  const [submitReportAttachment, setSubmitReportAttachment] = useState("");
  const submitReportAttachmentRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            localStorage.removeItem("user");
            setLocation("/");
          }
        } else {
          localStorage.removeItem("user");
          setLocation("/");
        }
      } catch (error) {
        localStorage.removeItem("user");
        setLocation("/");
      }
    };
    
    validateSession();
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  const updateReportStatus = async (id: number, status: "pending" | "reviewed" | "resolved") => {
    try {
      await apiRequest("PATCH", `/api/reports/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "تم تحديث حالة البلاغ" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const deleteReport = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "تم حذف البلاغ" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const createAnnouncement = async () => {
    try {
      await apiRequest("POST", "/api/announcements", newAnnouncement);
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: "", content: "", type: "public" });
      toast({ title: "تم إضافة الإعلان" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const deleteAnnouncement = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/announcements/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "تم حذف الإعلان" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const openEditAnnouncement = (ann: any) => {
    setEditingAnnouncement({ id: ann.id, title: ann.title, content: ann.content, type: ann.type });
    setShowEditAnnouncementModal(true);
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    try {
      await apiRequest("PATCH", `/api/announcements/${editingAnnouncement.id}`, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        type: editingAnnouncement.type,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setShowEditAnnouncementModal(false);
      setEditingAnnouncement(null);
      toast({ title: "تم تحديث الإعلان" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const createWanted = async () => {
    try {
      await apiRequest("POST", "/api/wanted", newWanted);
      queryClient.invalidateQueries({ queryKey: ["/api/wanted"] });
      setShowWantedModal(false);
      setNewWanted({ name: "", crime: "", status: "wanted", imageUrl: "" });
      wantedImagePathRef.current.clear();
      toast({ title: "تم إضافة المطلوب" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const createWantedVehicle = async () => {
    if (!newVehicle.plateNumber || !newVehicle.vehicleType || !newVehicle.reason) {
      toast({ variant: "destructive", title: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }
    try {
      await apiRequest("POST", "/api/wanted-vehicles", newVehicle);
      queryClient.invalidateQueries({ queryKey: ["/api/wanted-vehicles"] });
      setShowVehicleModal(false);
      setNewVehicle({ plateNumber: "", vehicleType: "", color: "", reason: "", status: "wanted", visibility: "public", imageUrl: "" });
      vehicleImagePathRef.current.clear();
      toast({ title: "تم إضافة السيارة المطلوبة" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const createInternalReport = async () => {
    if (!newInternalReport.fromName || !newInternalReport.toName || !newInternalReport.subject || !newInternalReport.content) {
      toast({ variant: "destructive", title: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }
    if (!newInternalReport.attachment) {
      toast({ variant: "destructive", title: "المرفق مطلوب" });
      return;
    }
    try {
      await apiRequest("POST", "/api/internal-reports", newInternalReport);
      queryClient.invalidateQueries({ queryKey: ["/api/internal-reports"] });
      setShowInternalReportModal(false);
      setNewInternalReport({ fromPersonnelId: 0, fromName: "", toPersonnelId: 0, toName: "", subject: "", content: "", attachment: "" });
      internalReportAttachmentRef.current.clear();
      toast({ title: "تم إرسال البلاغ الداخلي" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const updateInternalReportStatus = async (id: number, status: "pending" | "reviewed" | "resolved") => {
    try {
      await apiRequest("PATCH", `/api/internal-reports/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/internal-reports"] });
      toast({ title: "تم تحديث حالة البلاغ" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const deleteInternalReport = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/internal-reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/internal-reports"] });
      toast({ title: "تم حذف البلاغ" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const handleInternalReportAttachmentUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      credentials: "include",
    });
    const data = await response.json();
    internalReportAttachmentRef.current.set(file.id, data.objectPath);
    return { method: "PUT" as const, url: data.uploadURL };
  };

  const handleInternalReportAttachmentComplete = (result: any) => {
    const paths = result.successful.map((f: any) => internalReportAttachmentRef.current.get(f.id)).filter(Boolean);
    if (paths.length > 0) {
      setNewInternalReport(prev => ({ ...prev, attachment: paths[0] }));
    }
  };

  const handleSubmitReportAttachmentUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      credentials: "include",
    });
    const data = await response.json();
    submitReportAttachmentRef.current.set(file.id, data.objectPath);
    return { method: "PUT" as const, url: data.uploadURL };
  };

  const handleSubmitReportAttachmentComplete = (result: any) => {
    const paths = result.successful.map((f: any) => submitReportAttachmentRef.current.get(f.id)).filter(Boolean);
    if (paths.length > 0) {
      setSubmitReportAttachment(paths[0]);
    }
  };

  const deleteWantedVehicle = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/wanted-vehicles/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/wanted-vehicles"] });
      toast({ title: "تم حذف السيارة" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const updateVehicleStatus = async (id: number, status: "wanted" | "found") => {
    try {
      await apiRequest("PATCH", `/api/wanted-vehicles/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/wanted-vehicles"] });
      toast({ title: "تم تحديث الحالة" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const handleWantedImageUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL, objectPath } = await response.json();
    wantedImagePathRef.current.set(file.id, objectPath);
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleWantedImageComplete = () => {
    const paths = Array.from(wantedImagePathRef.current.values());
    if (paths.length > 0) {
      setNewWanted(prev => ({ ...prev, imageUrl: paths[0] }));
    }
  };

  const handleVehicleImageUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL, objectPath } = await response.json();
    vehicleImagePathRef.current.set(file.id, objectPath);
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleVehicleImageComplete = () => {
    const paths = Array.from(vehicleImagePathRef.current.values());
    if (paths.length > 0) {
      setNewVehicle(prev => ({ ...prev, imageUrl: paths[0] }));
    }
  };

  // Personnel handlers
  const createPersonnel = async () => {
    try {
      await apiRequest("POST", "/api/personnel", newPersonnel);
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      setShowPersonnelModal(false);
      setNewPersonnel({ name: "", rank: "", badge: "", department: "", discord: "", status: "active", imageUrl: "", notes: "" });
      personnelImagePathRef.current.clear();
      toast({ title: "تم إضافة الموظف" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const deletePersonnel = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/personnel/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({ title: "تم حذف الموظف" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const updatePersonnelStatus = async (id: number, status: "active" | "on_leave" | "suspended" | "resigned" | "retired") => {
    try {
      await apiRequest("PATCH", `/api/personnel/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({ title: "تم تحديث الحالة" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const handlePersonnelImageUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL, objectPath } = await response.json();
    personnelImagePathRef.current.set(file.id, objectPath);
    return { method: "PUT" as const, url: uploadURL };
  };

  const handlePersonnelImageComplete = () => {
    const paths = Array.from(personnelImagePathRef.current.values());
    if (paths.length > 0) {
      setNewPersonnel(prev => ({ ...prev, imageUrl: paths[0] }));
    }
  };

  const getPersonnelStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="border-green-500/30 text-green-400">نشط</Badge>;
      case "on_leave":
        return <Badge variant="outline" className="border-gray-500/30 text-gray-400">إجازة</Badge>;
      case "retired":
        return <Badge variant="outline" className="border-purple-500/30 text-purple-400">متقاعد</Badge>;
      case "suspended":
        return <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">موقوف</Badge>;
      case "resigned":
        return <Badge variant="outline" className="border-red-500/30 text-red-400">مستقيل</Badge>;
      default:
        return null;
    }
  };

  // Record handlers
  const createRecord = async () => {
    if (!newRecord.personnelId || !newRecord.title) {
      toast({ variant: "destructive", title: "يرجى ملء الحقول المطلوبة" });
      return;
    }
    try {
      await apiRequest("POST", "/api/personnel-records", newRecord);
      queryClient.invalidateQueries({ queryKey: ["/api/personnel-records"] });
      setShowRecordModal(false);
      setNewRecord({ personnelId: 0, type: "note", title: "", description: "", imageUrl: "" });
      recordImagePathRef.current.clear();
      toast({ title: "تم إضافة السجل" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const handleRecordImageUpload = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL, objectPath } = await response.json();
    recordImagePathRef.current.set(file.id, objectPath);
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleRecordImageComplete = () => {
    const paths = Array.from(recordImagePathRef.current.values());
    if (paths.length > 0) {
      setNewRecord(prev => ({ ...prev, imageUrl: paths[0] }));
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/personnel-records/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/personnel-records"] });
      toast({ title: "تم حذف السجل" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const getRecordTypeInfo = (type: string) => {
    switch (type) {
      case "promotion":
        return { label: "ترقية", icon: Award, color: "text-green-400 border-green-500/30" };
      case "warning":
        return { label: "إنذار", icon: AlertTriangle, color: "text-yellow-400 border-yellow-500/30" };
      case "leave":
        return { label: "إجازة", icon: Calendar, color: "text-blue-400 border-blue-500/30" };
      case "note":
        return { label: "ملاحظة", icon: MessageSquare, color: "text-gray-400 border-gray-500/30" };
      case "discipline":
        return { label: "إجراء تأديبي", icon: AlertCircle, color: "text-red-400 border-red-500/30" };
      case "commendation":
        return { label: "تقدير", icon: Star, color: "text-purple-400 border-purple-500/30" };
      default:
        return { label: type, icon: FileText, color: "text-gray-400 border-gray-500/30" };
    }
  };

  const getPersonnelName = (personnelId: number) => {
    const person = personnelList?.find((p: any) => p.id === personnelId);
    return person?.name || "غير معروف";
  };

  // User management functions
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSystemUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && user?.permissions?.includes("manage_users")) {
      fetchUsers();
    }
  }, [activeTab, user?.permissions]);

  const createUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({ variant: "destructive", title: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }
    try {
      await apiRequest("POST", "/api/auth/register", newUser);
      setShowUserModal(false);
      setNewUser({ username: "", password: "", rank: "Cadet", permissions: [], displayName: "" });
      fetchUsers();
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    } catch (error: any) {
      toast({ variant: "destructive", title: error.message || "حدث خطأ" });
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/users/${id}`);
      fetchUsers();
      toast({ title: "تم حذف المستخدم" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const updateUserData = async (id: number, data: { rank?: string; permissions?: string[] }) => {
    try {
      await apiRequest("PATCH", `/api/users/${id}`, data);
      fetchUsers();
      toast({ title: "تم تحديث المستخدم" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const militaryRanks = [
    "Cadet", "Officer I", "Officer II", "Officer III",
    "Senior Officer", "Corporal", "Sergeant I", "Sergeant II",
    "Detective", "Lieutenant", "Captain", "Commander",
    "Deputy Chief", "Assistant Chief", "Chief of Police", "IA"
  ];

  const juniorRanks = ["Cadet", "Officer I", "Officer II", "Officer III", "Corporal", "Sergeant I", "Sergeant II"];

  const permissionLabels: Record<string, string> = {
    manage_users: "إدارة المستخدمين",
    manage_announcements: "إدارة الإعلانات",
    manage_wanted: "إدارة المطلوبين",
    manage_reports: "إدارة البلاغات",
    manage_personnel: "إدارة شؤون الأفراد",
    view_announcements: "عرض الإعلانات",
    submit_internal_report: "تقديم بلاغ داخلي",
    manage_internal_reports: "إدارة البلاغات الداخلية",
    view_only: "عرض فقط"
  };

  const isJuniorRank = user?.rank ? juniorRanks.includes(user.rank) : false;

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    // manage_users has access to everything
    if (user.permissions.includes("manage_users")) return true;
    return user.permissions.includes(permission);
  };

  // Check if user can perform actions (not view_only)
  const canPerformActions = (): boolean => {
    if (!user?.permissions) return false;
    if (user.permissions.includes("manage_users")) return true;
    return !user.permissions.includes("view_only") || user.permissions.length > 1;
  };

  const getRankBadge = (rank: string) => {
    const highRanks = ["Chief of Police", "Assistant Chief", "Deputy Chief", "Commander"];
    const midRanks = ["Captain", "Lieutenant", "Detective", "Sergeant II"];
    
    if (highRanks.includes(rank)) {
      return <Badge variant="outline" className="border-red-500/30 text-red-400">{rank}</Badge>;
    } else if (midRanks.includes(rank)) {
      return <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">{rank}</Badge>;
    } else {
      return <Badge variant="outline" className="border-blue-500/30 text-blue-400">{rank}</Badge>;
    }
  };

  const deleteWanted = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/wanted/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/wanted"] });
      toast({ title: "تم حذف المطلوب" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const updateWantedStatus = async (id: number, status: "wanted" | "captured") => {
    try {
      await apiRequest("PATCH", `/api/wanted/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/wanted"] });
      toast({ title: "تم تحديث الحالة" });
    } catch (error) {
      toast({ variant: "destructive", title: "حدث خطأ" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/30 text-yellow-400"><Clock className="w-3 h-3 ml-1" />قيد الانتظار</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="border-blue-500/30 text-blue-400"><Eye className="w-3 h-3 ml-1" />تمت المراجعة</Badge>;
      case "resolved":
        return <Badge variant="outline" className="border-green-500/30 text-green-400"><Check className="w-3 h-3 ml-1" />تم الحل</Badge>;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="w-64 border-l border-white/5 bg-neutral-950 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <Shield className="w-8 h-8 text-blue-500" />
          <span className="font-bold text-xl">لوحة التحكم</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full justify-start gap-3 ${activeTab === "dashboard" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
            data-testid="button-tab-dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            الرئيسية
          </Button>
          {hasPermission("manage_reports") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("reports")}
              className={`w-full justify-start gap-3 ${activeTab === "reports" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-reports"
            >
              <FileText className="w-4 h-4" />
              بلاغات المواطنين
              {reports && reports.filter((r: any) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="mr-auto text-[10px]">
                  {reports.filter((r: any) => r.status === "pending").length}
                </Badge>
              )}
            </Button>
          )}
          {(hasPermission("manage_reports") || hasPermission("manage_internal_reports")) && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("internal-reports")}
              className={`w-full justify-start gap-3 ${activeTab === "internal-reports" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-internal-reports"
            >
              <MessageSquare className="w-4 h-4" />
              بلاغات داخلية
              {internalReports && internalReports.filter((r: any) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="mr-auto text-[10px]">
                  {internalReports.filter((r: any) => r.status === "pending").length}
                </Badge>
              )}
            </Button>
          )}
          {(hasPermission("submit_internal_report") || hasPermission("view_announcements")) && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("submit-internal-report")}
              className={`w-full justify-start gap-3 ${activeTab === "submit-internal-report" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-submit-internal-report"
            >
              <FileText className="w-4 h-4" />
              تقديم بلاغ داخلي
            </Button>
          )}
          {(hasPermission("view_announcements") && !hasPermission("manage_announcements")) && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("view-announcements")}
              className={`w-full justify-start gap-3 ${activeTab === "view-announcements" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-view-announcements"
            >
              <Megaphone className="w-4 h-4" />
              الإعلانات والتعميمات
            </Button>
          )}
          {hasPermission("manage_wanted") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("wanted")}
              className={`w-full justify-start gap-3 ${activeTab === "wanted" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-wanted"
            >
              <Users className="w-4 h-4" />
              المطلوبين
            </Button>
          )}
          {hasPermission("manage_wanted") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("vehicles")}
              className={`w-full justify-start gap-3 ${activeTab === "vehicles" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-vehicles"
            >
              <Car className="w-4 h-4" />
              السيارات المطلوبة
            </Button>
          )}
          {hasPermission("manage_announcements") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("announcements")}
              className={`w-full justify-start gap-3 ${activeTab === "announcements" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-announcements"
            >
              <Megaphone className="w-4 h-4" />
              الإعلانات
            </Button>
          )}
          {hasPermission("manage_personnel") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("personnel")}
              className={`w-full justify-start gap-3 ${activeTab === "personnel" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-personnel"
            >
              <Briefcase className="w-4 h-4" />
              الشؤون العسكرية
            </Button>
          )}
          {hasPermission("manage_personnel") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("records")}
              className={`w-full justify-start gap-3 ${activeTab === "records" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-records"
            >
              <ClipboardList className="w-4 h-4" />
              السجلات
            </Button>
          )}
          {hasPermission("manage_users") && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("users")}
              className={`w-full justify-start gap-3 ${activeTab === "users" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-white"}`}
              data-testid="button-tab-users"
            >
              <UserCog className="w-4 h-4" />
              المستخدمين
            </Button>
          )}
        </nav>

        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="mt-auto justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">مرحباً، {user.displayName || user.username}</h1>
            <p className="text-slate-400 text-sm">أهلاً بك في نظام إدارة شؤون الشرطة الداخلي.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowChangePasswordModal(true)}
              className="text-slate-400 hover:text-white"
              data-testid="button-change-password"
            >
              <Key className="w-4 h-4 ml-1" />
              تغيير كلمة المرور
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user.displayName || user.username}</p>
              <Badge variant="outline" className="text-[10px] uppercase border-blue-500/30 text-blue-400">{user.rank || "Officer"}</Badge>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {(user.displayName || user.username)[0].toUpperCase()}
            </div>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-neutral-900 border-white/5">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">إجمالي البلاغات</CardTitle>
                  <FileText className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports?.length || 0}</div>
                  <p className="text-xs text-slate-500">{reports?.filter((r: any) => r.status === "pending").length || 0} قيد الانتظار</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-900 border-white/5">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">المطلوبين حالياً</CardTitle>
                  <Users className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wanted?.filter((w: any) => w.status === "wanted").length || 0}</div>
                  <p className="text-xs text-slate-500">{wanted?.filter((w: any) => w.status === "captured").length || 0} تم القبض عليهم</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-900 border-white/5">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">الإعلانات النشطة</CardTitle>
                  <Megaphone className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{announcements?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold">آخر البلاغات</h2>
              <div className="grid gap-4">
                {reportsLoading ? (
                  <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
                ) : reports && reports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.slice(0, 3).map((report: any) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-neutral-900 border border-white/5 rounded-xl p-5 flex flex-col gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold">{report.name}</h3>
                                {getStatusBadge(report.status)}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">#{report.id}</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{report.content}</p>
                          </div>
                        </div>
                        {report.attachments && report.attachments.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {report.attachments.map((url: string, i: number) => {
                              const href = url.startsWith('/objects/') ? url : `/objects/${url}`;
                              return (
                                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                  <img 
                                    src={href} 
                                    alt={`Attachment ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  >
                                    <Eye className="w-4 h-4 text-white" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                    لا توجد بلاغات حالياً
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "reports" && hasPermission("manage_reports") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">إدارة البلاغات</h2>
            </div>
            <div className="grid gap-4">
              {reportsLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : reports && reports.length > 0 ? (
                reports.map((report: any) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{report.name}</h3>
                            {report.discord && (
                              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                                {report.discord}
                              </Badge>
                            )}
                            {getStatusBadge(report.status)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">#{report.id}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">{report.content}</p>
                        
                        {report.attachments && report.attachments.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                            {report.attachments.map((url: string, i: number) => {
                              const href = url.startsWith('/objects/') ? url : `/objects/${url}`;
                              return (
                                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                  <img 
                                    src={href} 
                                    alt={`Attachment ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  >
                                    <Eye className="w-5 h-5 text-white" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Select 
                            value={report.status} 
                            onValueChange={(value) => updateReportStatus(report.id, value as any)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">قيد الانتظار</SelectItem>
                              <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                              <SelectItem value="resolved">تم الحل</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                            onClick={() => deleteReport(report.id)}
                            data-testid={`button-delete-report-${report.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد بلاغات حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "internal-reports" && hasPermission("manage_reports") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">البلاغات الداخلية</h2>
              <Button onClick={() => setShowInternalReportModal(true)} className="gap-2" data-testid="button-add-internal-report">
                <Plus className="w-4 h-4" />
                إنشاء بلاغ داخلي
              </Button>
            </div>
            <div className="grid gap-4">
              {internalReportsLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : internalReports && internalReports.length > 0 ? (
                internalReports.map((report: any) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{report.subject}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">#{report.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span>من: <span className="text-white">{report.fromName}</span></span>
                          <span className="text-slate-600">→</span>
                          <span>إلى: <span className="text-white">{report.toName}</span></span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">{report.content}</p>
                        
                        {report.attachment && (
                          <div className="mb-3">
                            <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                              <img 
                                src={report.attachment.startsWith('/objects/') ? report.attachment : `/objects/${report.attachment}`} 
                                alt="Attachment"
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              />
                              <a 
                                href={report.attachment.startsWith('/objects/') ? report.attachment : `/objects/${report.attachment}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Eye className="w-5 h-5 text-white" />
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Select 
                            value={report.status} 
                            onValueChange={(value) => updateInternalReportStatus(report.id, value as any)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">قيد الانتظار</SelectItem>
                              <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                              <SelectItem value="resolved">تم الحل</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                            onClick={() => deleteInternalReport(report.id)}
                            data-testid={`button-delete-internal-report-${report.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد بلاغات داخلية حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "submit-internal-report" && (hasPermission("submit_internal_report") || hasPermission("view_announcements")) && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">تقديم بلاغ داخلي</h2>
            <div className="bg-neutral-900 border border-white/5 rounded-xl p-6">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!submitReportAttachment) {
                  toast({ variant: "destructive", title: "خطأ", description: "يجب رفع مرفق للبلاغ" });
                  return;
                }
                const formData = new FormData(e.target as HTMLFormElement);
                try {
                  await apiRequest("POST", "/api/internal-reports", {
                    subject: formData.get("subject"),
                    fromName: user.displayName || user.username,
                    toName: formData.get("toName"),
                    content: formData.get("content"),
                    attachment: submitReportAttachment,
                  });
                  toast({ title: "تم إرسال البلاغ الداخلي بنجاح" });
                  (e.target as HTMLFormElement).reset();
                  setSubmitReportAttachment("");
                } catch (error: any) {
                  toast({ variant: "destructive", title: "خطأ في إرسال البلاغ", description: error.message });
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">الموضوع *</label>
                  <Input name="subject" required placeholder="موضوع البلاغ" className="bg-white/5 border-white/10" data-testid="input-subject" />
                </div>
                <div>
                  <label className="block text-sm mb-2">إلى (اسم المستلم) *</label>
                  <Input name="toName" required placeholder="اسم المسؤول أو القسم" className="bg-white/5 border-white/10" data-testid="input-to-name" />
                </div>
                <div>
                  <label className="block text-sm mb-2">تفاصيل البلاغ *</label>
                  <Textarea name="content" required placeholder="اكتب تفاصيل البلاغ هنا..." className="bg-white/5 border-white/10 min-h-[150px]" data-testid="textarea-content" />
                </div>
                <div>
                  <label className="block text-sm mb-2">مرفق *</label>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleSubmitReportAttachmentUpload}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const file = result.successful[0];
                        const objectPath = submitReportAttachmentRef.current.get(file.id);
                        if (objectPath) {
                          setSubmitReportAttachment(objectPath);
                          toast({ title: "تم رفع المرفق" });
                        }
                      }
                    }}
                    buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    رفع ملف
                  </ObjectUploader>
                  {submitReportAttachment && (
                    <div className="mt-4">
                      <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                        <img 
                          src={submitReportAttachment.startsWith('/objects/') ? submitReportAttachment : `/objects/${submitReportAttachment}`} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute top-1 left-1 h-6 w-6 bg-red-500 hover:bg-red-600 rounded-full text-white"
                          onClick={() => {
                            setSubmitReportAttachment("");
                            submitReportAttachmentRef.current.clear();
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" data-testid="button-submit-internal-report">
                  إرسال البلاغ
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "view-announcements" && hasPermission("view_announcements") && !hasPermission("manage_announcements") && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">الإعلانات والتعميمات</h2>
            <div className="grid gap-4">
              {announcementsLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : announcements && announcements.length > 0 ? (
                announcements.map((ann: any) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${ann.type === "internal" ? "bg-purple-500/20" : "bg-blue-500/20"} flex items-center justify-center flex-shrink-0`}>
                        <Megaphone className={`w-5 h-5 ${ann.type === "internal" ? "text-purple-400" : "text-blue-400"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold">{ann.title}</h3>
                          <Badge variant="outline" className={ann.type === "internal" ? "border-purple-500/30 text-purple-400" : "border-blue-500/30 text-blue-400"}>
                            {ann.type === "internal" ? "داخلي" : "عام"}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{ann.content}</p>
                        <p className="text-[10px] text-slate-500 mt-2">
                          {ann.createdAt && new Date(ann.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد إعلانات حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "wanted" && hasPermission("manage_wanted") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">إدارة المطلوبين</h2>
              <Button onClick={() => setShowWantedModal(true)} className="gap-2" data-testid="button-add-wanted">
                <Plus className="w-4 h-4" />
                إضافة مطلوب
              </Button>
            </div>
            <div className="grid gap-4">
              {wantedLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : wanted && wanted.length > 0 ? (
                wanted.map((person: any) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {person.imageUrl ? (
                        <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                          <img 
                            src={person.imageUrl.startsWith('/objects/') ? person.imageUrl : `/objects/${person.imageUrl}`} 
                            alt={person.name} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <a 
                            href={person.imageUrl.startsWith('/objects/') ? person.imageUrl : `/objects/${person.imageUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Eye className="w-3 h-3 text-white" />
                          </a>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-red-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold">{person.name}</h3>
                        <p className="text-slate-400 text-sm">{person.crime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={person.status} 
                        onValueChange={(value) => updateWantedStatus(person.id, value as any)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wanted">مطلوب</SelectItem>
                          <SelectItem value="captured">تم القبض</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                        onClick={() => deleteWanted(person.id)}
                        data-testid={`button-delete-wanted-${person.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا يوجد مطلوبين حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "vehicles" && hasPermission("manage_wanted") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">إدارة السيارات المطلوبة</h2>
              <Button onClick={() => setShowVehicleModal(true)} className="gap-2" data-testid="button-add-vehicle">
                <Plus className="w-4 h-4" />
                إضافة سيارة
              </Button>
            </div>
            <div className="grid gap-4">
              {wantedVehicles && wantedVehicles.length > 0 ? (
                wantedVehicles.map((vehicle: any) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {vehicle.imageUrl ? (
                        <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                          <img 
                            src={vehicle.imageUrl.startsWith('/objects/') ? vehicle.imageUrl : `/objects/${vehicle.imageUrl}`} 
                            alt={vehicle.plateNumber} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <a 
                            href={vehicle.imageUrl.startsWith('/objects/') ? vehicle.imageUrl : `/objects/${vehicle.imageUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Eye className="w-3 h-3 text-white" />
                          </a>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Car className="w-6 h-6 text-orange-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{vehicle.plateNumber}</h3>
                          <Badge variant="outline" className={`text-[10px] ${vehicle.status === 'wanted' ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}>
                            {vehicle.status === 'wanted' ? 'مطلوب' : 'تم العثور'}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{vehicle.vehicleType} {vehicle.color && `- ${vehicle.color}`}</p>
                        <p className="text-slate-500 text-xs">{vehicle.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={vehicle.status} 
                        onValueChange={(value) => updateVehicleStatus(vehicle.id, value as any)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wanted">مطلوب</SelectItem>
                          <SelectItem value="found">تم العثور</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                        onClick={() => deleteWantedVehicle(vehicle.id)}
                        data-testid={`button-delete-vehicle-${vehicle.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد سيارات مطلوبة حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "announcements" && hasPermission("manage_announcements") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">إدارة الإعلانات</h2>
              <Button onClick={() => setShowAnnouncementModal(true)} className="gap-2" data-testid="button-add-announcement">
                <Plus className="w-4 h-4" />
                إضافة إعلان
              </Button>
            </div>
            <div className="grid gap-4">
              {announcements && announcements.length > 0 ? (
                announcements.map((ann: any) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{ann.title}</h3>
                          <Badge variant="outline" className={`text-[10px] ${ann.type === "public" ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"}`}>
                            {ann.type === "public" ? "عام" : "داخلي"}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{ann.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={() => openEditAnnouncement(ann)}
                        data-testid={`button-edit-announcement-${ann.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteAnnouncement(ann.id)}
                        data-testid={`button-delete-announcement-${ann.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد إعلانات حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "personnel" && hasPermission("manage_personnel") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">الشؤون العسكرية - إدارة الموظفين</h2>
              <Button onClick={() => setShowPersonnelModal(true)} className="gap-2" data-testid="button-add-personnel">
                <UserPlus className="w-4 h-4" />
                إضافة موظف
              </Button>
            </div>
            <div className="grid gap-4">
              {personnelLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : personnelList && personnelList.length > 0 ? (
                personnelList.map((person: any) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {person.imageUrl ? (
                          <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                            <img 
                              src={person.imageUrl.startsWith('/objects/') ? person.imageUrl : `/objects/${person.imageUrl}`} 
                              alt={person.name} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <a 
                              href={person.imageUrl.startsWith('/objects/') ? person.imageUrl : `/objects/${person.imageUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-7 h-7 text-blue-500" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold">{person.name}</h3>
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{person.rank}</Badge>
                            {getPersonnelStatusBadge(person.status)}
                          </div>
                          <div className="text-slate-400 text-sm space-y-1">
                            <p>القسم: {person.department}</p>
                            {person.badge && <p>رقم الشارة: {person.badge}</p>}
                            {person.discord && <p>Discord: {person.discord}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={person.status} 
                          onValueChange={(value) => updatePersonnelStatus(person.id, value as any)}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="on_leave">إجازة</SelectItem>
                            <SelectItem value="retired">متقاعد</SelectItem>
                            <SelectItem value="suspended">موقوف</SelectItem>
                            <SelectItem value="resigned">مستقيل</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                          onClick={() => deletePersonnel(person.id)}
                          data-testid={`button-delete-personnel-${person.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {person.notes && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-slate-500 text-xs">ملاحظات: {person.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا يوجد موظفين مسجلين حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "records" && hasPermission("manage_personnel") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">سجلات الموظفين</h2>
              <Button onClick={() => setShowRecordModal(true)} className="gap-2" data-testid="button-add-record">
                <Plus className="w-4 h-4" />
                إضافة سجل
              </Button>
            </div>
            <div className="grid gap-4">
              {recordsLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : personnelRecords && personnelRecords.length > 0 ? (
                personnelRecords.map((record: any) => {
                  const typeInfo = getRecordTypeInfo(record.type);
                  const RecordIcon = typeInfo.icon;
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${typeInfo.color.split(" ")[0]}`}>
                            <RecordIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold">{record.title}</h3>
                              <Badge variant="outline" className={`text-[10px] ${typeInfo.color}`}>
                                {typeInfo.label}
                              </Badge>
                            </div>
                            <p className="text-slate-500 text-sm">الموظف: {getPersonnelName(record.personnelId)}</p>
                            {record.description && (
                              <p className="text-slate-400 text-sm mt-1">{record.description}</p>
                            )}
                            {record.imageUrl && (
                              <div className="mt-2">
                                <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                  <img 
                                    src={record.imageUrl.startsWith('/objects/') ? record.imageUrl : `/objects/${record.imageUrl}`} 
                                    alt="مرفق السجل" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <a 
                                    href={record.imageUrl.startsWith('/objects/') ? record.imageUrl : `/objects/${record.imageUrl}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  >
                                    <Eye className="w-5 h-5 text-white" />
                                  </a>
                                </div>
                              </div>
                            )}
                            <p className="text-slate-600 text-xs mt-2">
                              {record.createdAt && new Date(record.createdAt).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                          onClick={() => deleteRecord(record.id)}
                          data-testid={`button-delete-record-${record.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا توجد سجلات حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && hasPermission("manage_users") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">إدارة المستخدمين</h2>
              <Button onClick={() => setShowUserModal(true)} data-testid="button-add-user">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مستخدم
              </Button>
            </div>
            <div className="grid gap-4">
              {usersLoading ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : systemUsers && systemUsers.length > 0 ? (
                systemUsers.map((sysUser: any) => (
                  <motion.div
                    key={sysUser.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-900 border border-white/5 rounded-xl p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                            {sysUser.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{sysUser.displayName || sysUser.username}</h3>
                              {getRankBadge(sysUser.rank || "Cadet")}
                            </div>
                            <p className="text-slate-500 text-sm">@{sysUser.username}</p>
                            {sysUser.createdAt && (
                              <p className="text-slate-600 text-xs">
                                انضم في: {new Date(sysUser.createdAt).toLocaleDateString("ar-SA")}
                              </p>
                            )}
                          </div>
                        </div>
                        {sysUser.username !== "admin" && sysUser.id !== user?.id && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteUser(sysUser.id)}
                            data-testid={`button-delete-user-${sysUser.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {sysUser.username !== "admin" && sysUser.id !== user?.id && (
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                          <div>
                            <label className="text-sm text-slate-400 mb-2 block">الرتبة</label>
                            <Select 
                              value={sysUser.rank || "Cadet"} 
                              onValueChange={(value) => updateUserData(sysUser.id, { rank: value })}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10" data-testid={`select-rank-${sysUser.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {militaryRanks.map(rank => (
                                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-slate-400 mb-2 block">الصلاحيات</label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(permissionLabels).map(([key, label]) => (
                                <Button
                                  key={key}
                                  size="sm"
                                  variant={sysUser.permissions?.includes(key) ? "default" : "outline"}
                                  className={sysUser.permissions?.includes(key) ? "bg-blue-600" : ""}
                                  onClick={() => {
                                    const currentPerms = sysUser.permissions || [];
                                    const newPerms = currentPerms.includes(key)
                                      ? currentPerms.filter((p: string) => p !== key)
                                      : [...currentPerms, key];
                                    updateUserData(sysUser.id, { permissions: newPerms });
                                  }}
                                  data-testid={`toggle-perm-${key}-${sysUser.id}`}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
                  لا يوجد مستخدمين
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription className="text-slate-400">أنشئ حساب جديد للنظام</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              placeholder="اسم المستخدم *" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-new-username"
            />
            <Input 
              type="password"
              placeholder="كلمة المرور *" 
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-new-password"
            />
            <Input 
              placeholder="الاسم المعروض (اختياري)" 
              value={newUser.displayName}
              onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-new-displayname"
            />
            <Select 
              value={newUser.rank} 
              onValueChange={(value) => setNewUser({...newUser, rank: value})}
            >
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-new-rank">
                <SelectValue placeholder="الرتبة" />
              </SelectTrigger>
              <SelectContent>
                {militaryRanks.map(rank => (
                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">الصلاحيات</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    type="button"
                    variant={newUser.permissions.includes(key) ? "default" : "outline"}
                    className={newUser.permissions.includes(key) ? "bg-blue-600" : ""}
                    onClick={() => {
                      const newPerms = newUser.permissions.includes(key)
                        ? newUser.permissions.filter(p => p !== key)
                        : [...newUser.permissions, key];
                      setNewUser({...newUser, permissions: newPerms});
                    }}
                    data-testid={`toggle-new-perm-${key}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={createUser} className="w-full" data-testid="button-submit-user">
              إنشاء المستخدم
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة إعلان جديد</DialogTitle>
            <DialogDescription className="text-slate-400">أضف إعلاناً جديداً للموقع</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              placeholder="عنوان الإعلان" 
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              className="bg-white/5 border-white/10"
            />
            <Textarea 
              placeholder="محتوى الإعلان" 
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              className="bg-white/5 border-white/10 min-h-[100px]"
            />
            <Select 
              value={newAnnouncement.type} 
              onValueChange={(value) => setNewAnnouncement({...newAnnouncement, type: value as any})}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">عام (يظهر للجميع)</SelectItem>
                <SelectItem value="internal">داخلي (للضباط فقط)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createAnnouncement} className="w-full" data-testid="button-submit-announcement">
              إضافة الإعلان
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditAnnouncementModal} onOpenChange={setShowEditAnnouncementModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
            <DialogDescription className="text-slate-400">قم بتعديل بيانات الإعلان</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              placeholder="عنوان الإعلان" 
              value={editingAnnouncement?.title || ""}
              onChange={(e) => setEditingAnnouncement(prev => prev ? {...prev, title: e.target.value} : null)}
              className="bg-white/5 border-white/10"
            />
            <Textarea 
              placeholder="محتوى الإعلان" 
              value={editingAnnouncement?.content || ""}
              onChange={(e) => setEditingAnnouncement(prev => prev ? {...prev, content: e.target.value} : null)}
              className="bg-white/5 border-white/10 min-h-[100px]"
            />
            <Select 
              value={editingAnnouncement?.type || "public"} 
              onValueChange={(value) => setEditingAnnouncement(prev => prev ? {...prev, type: value as any} : null)}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">عام (يظهر للجميع)</SelectItem>
                <SelectItem value="internal">داخلي (للضباط فقط)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={updateAnnouncement} className="w-full" data-testid="button-update-announcement">
              حفظ التعديلات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWantedModal} onOpenChange={setShowWantedModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة مطلوب جديد</DialogTitle>
            <DialogDescription className="text-slate-400">أضف شخصاً للقائمة السوداء</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              placeholder="اسم المطلوب" 
              value={newWanted.name}
              onChange={(e) => setNewWanted({...newWanted, name: e.target.value})}
              className="bg-white/5 border-white/10"
            />
            <Input 
              placeholder="التهمة / الجريمة" 
              value={newWanted.crime}
              onChange={(e) => setNewWanted({...newWanted, crime: e.target.value})}
              className="bg-white/5 border-white/10"
            />
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">صورة المطلوب (اختياري)</label>
              <div className="flex items-center gap-3">
                {newWanted.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={newWanted.imageUrl} 
                      alt="صورة المطلوب" 
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute -top-2 -left-2 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full"
                      onClick={() => {
                        setNewWanted(prev => ({ ...prev, imageUrl: "" }));
                        wantedImagePathRef.current.clear();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Image className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleWantedImageUpload}
                  onComplete={handleWantedImageComplete}
                  buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع صورة
                </ObjectUploader>
              </div>
            </div>

            <Button onClick={createWanted} className="w-full" data-testid="button-submit-wanted">
              إضافة للقائمة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة سيارة مطلوبة</DialogTitle>
            <DialogDescription className="text-slate-400">أضف سيارة للبحث عنها</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              placeholder="رقم اللوحة *" 
              value={newVehicle.plateNumber}
              onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-vehicle-plate"
            />
            <Input 
              placeholder="نوع السيارة * (مثال: سيدان أسود)" 
              value={newVehicle.vehicleType}
              onChange={(e) => setNewVehicle({...newVehicle, vehicleType: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-vehicle-type"
            />
            <Input 
              placeholder="اللون (اختياري)" 
              value={newVehicle.color}
              onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-vehicle-color"
            />
            <Input 
              placeholder="سبب الطلب *" 
              value={newVehicle.reason}
              onChange={(e) => setNewVehicle({...newVehicle, reason: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-vehicle-reason"
            />

            <div className="space-y-2">
              <label className="text-sm text-slate-400">الرؤية</label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={newVehicle.visibility === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewVehicle({...newVehicle, visibility: "public"})}
                  className={newVehicle.visibility === "public" ? "bg-green-600 hover:bg-green-700" : "border-white/20"}
                  data-testid="button-visibility-public"
                >
                  <Globe className="w-4 h-4 ml-1" />
                  عام
                </Button>
                <Button
                  type="button"
                  variant={newVehicle.visibility === "internal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewVehicle({...newVehicle, visibility: "internal"})}
                  className={newVehicle.visibility === "internal" ? "bg-yellow-600 hover:bg-yellow-700" : "border-white/20"}
                  data-testid="button-visibility-internal"
                >
                  <Lock className="w-4 h-4 ml-1" />
                  خاص
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">صورة السيارة (اختياري)</label>
              <div className="flex items-center gap-3">
                {newVehicle.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={newVehicle.imageUrl} 
                      alt="صورة السيارة" 
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute -top-2 -left-2 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full"
                      onClick={() => {
                        setNewVehicle(prev => ({ ...prev, imageUrl: "" }));
                        vehicleImagePathRef.current.clear();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Car className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleVehicleImageUpload}
                  onComplete={handleVehicleImageComplete}
                  buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع صورة
                </ObjectUploader>
              </div>
            </div>

            <Button onClick={createWantedVehicle} className="w-full" data-testid="button-submit-vehicle">
              إضافة السيارة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInternalReportModal} onOpenChange={setShowInternalReportModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء بلاغ داخلي</DialogTitle>
            <DialogDescription className="text-slate-400">بلاغ من عسكري إلى عسكري (المرفق إجباري)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">من (المُرسل) *</label>
                <Select 
                  value={newInternalReport.fromPersonnelId ? String(newInternalReport.fromPersonnelId) : ""} 
                  onValueChange={(value) => {
                    const person = personnelList?.find((p: any) => p.id === parseInt(value));
                    setNewInternalReport({
                      ...newInternalReport, 
                      fromPersonnelId: parseInt(value),
                      fromName: person?.name || ""
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="اختر المُرسل" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnelList?.map((person: any) => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        {person.name} - {person.rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">إلى (المُستلم) *</label>
                <Select 
                  value={newInternalReport.toPersonnelId ? String(newInternalReport.toPersonnelId) : ""} 
                  onValueChange={(value) => {
                    const person = personnelList?.find((p: any) => p.id === parseInt(value));
                    setNewInternalReport({
                      ...newInternalReport, 
                      toPersonnelId: parseInt(value),
                      toName: person?.name || ""
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="اختر المُستلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnelList?.map((person: any) => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        {person.name} - {person.rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input 
              placeholder="موضوع البلاغ *" 
              value={newInternalReport.subject}
              onChange={(e) => setNewInternalReport({...newInternalReport, subject: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-internal-report-subject"
            />
            <Textarea 
              placeholder="محتوى البلاغ *" 
              value={newInternalReport.content}
              onChange={(e) => setNewInternalReport({...newInternalReport, content: e.target.value})}
              className="bg-white/5 border-white/10 min-h-[100px]"
              data-testid="input-internal-report-content"
            />
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">المرفق * (إجباري)</label>
              <div className="flex items-center gap-3">
                {newInternalReport.attachment ? (
                  <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                    <img 
                      src={newInternalReport.attachment.startsWith('/objects/') ? newInternalReport.attachment : `/objects/${newInternalReport.attachment}`} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-1 left-1 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full text-white"
                      onClick={() => {
                        setNewInternalReport(prev => ({ ...prev, attachment: "" }));
                        internalReportAttachmentRef.current.clear();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleInternalReportAttachmentUpload}
                  onComplete={handleInternalReportAttachmentComplete}
                  buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع ملف
                </ObjectUploader>
              </div>
            </div>

            <Button 
              onClick={createInternalReport} 
              className="w-full" 
              disabled={!newInternalReport.attachment}
              data-testid="button-submit-internal-report"
            >
              إرسال البلاغ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPersonnelModal} onOpenChange={setShowPersonnelModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription className="text-slate-400">أضف موظفاً جديداً للشؤون العسكرية</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="اسم الموظف *" 
                value={newPersonnel.name}
                onChange={(e) => setNewPersonnel({...newPersonnel, name: e.target.value})}
                className="bg-white/5 border-white/10"
              />
              <Input 
                placeholder="الرتبة *" 
                value={newPersonnel.rank}
                onChange={(e) => setNewPersonnel({...newPersonnel, rank: e.target.value})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="رقم الشارة" 
                value={newPersonnel.badge}
                onChange={(e) => setNewPersonnel({...newPersonnel, badge: e.target.value})}
                className="bg-white/5 border-white/10"
              />
              <Input 
                placeholder="القسم *" 
                value={newPersonnel.department}
                onChange={(e) => setNewPersonnel({...newPersonnel, department: e.target.value})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <Input 
              placeholder="Discord Username" 
              value={newPersonnel.discord}
              onChange={(e) => setNewPersonnel({...newPersonnel, discord: e.target.value})}
              className="bg-white/5 border-white/10"
            />
            <Textarea 
              placeholder="ملاحظات (اختياري)" 
              value={newPersonnel.notes}
              onChange={(e) => setNewPersonnel({...newPersonnel, notes: e.target.value})}
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">صورة الموظف (اختياري)</label>
              <div className="flex items-center gap-3">
                {newPersonnel.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={newPersonnel.imageUrl} 
                      alt="صورة الموظف" 
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute -top-2 -left-2 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full"
                      onClick={() => {
                        setNewPersonnel(prev => ({ ...prev, imageUrl: "" }));
                        personnelImagePathRef.current.clear();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Image className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handlePersonnelImageUpload}
                  onComplete={handlePersonnelImageComplete}
                  buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع صورة
                </ObjectUploader>
              </div>
            </div>

            <Button onClick={createPersonnel} className="w-full" data-testid="button-submit-personnel">
              إضافة الموظف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة سجل جديد</DialogTitle>
            <DialogDescription className="text-slate-400">أضف سجلاً لأحد الموظفين</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select 
              value={newRecord.personnelId ? String(newRecord.personnelId) : ""} 
              onValueChange={(value) => setNewRecord({...newRecord, personnelId: parseInt(value)})}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="اختر الموظف *" />
              </SelectTrigger>
              <SelectContent>
                {personnelList?.map((person: any) => (
                  <SelectItem key={person.id} value={String(person.id)}>
                    {person.name} - {person.rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={newRecord.type} 
              onValueChange={(value) => setNewRecord({...newRecord, type: value as RecordType})}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="نوع السجل *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotion">ترقية</SelectItem>
                <SelectItem value="warning">إنذار</SelectItem>
                <SelectItem value="leave">إجازة</SelectItem>
                <SelectItem value="note">ملاحظة</SelectItem>
                <SelectItem value="discipline">إجراء تأديبي</SelectItem>
                <SelectItem value="commendation">تقدير</SelectItem>
              </SelectContent>
            </Select>

            <Input 
              placeholder="عنوان السجل *" 
              value={newRecord.title}
              onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
              className="bg-white/5 border-white/10"
            />
            <Textarea 
              placeholder="التفاصيل (اختياري)" 
              value={newRecord.description}
              onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
              className="bg-white/5 border-white/10 min-h-[80px]"
            />
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">صورة / مرفق (اختياري)</label>
              <div className="flex items-center gap-3">
                {newRecord.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={newRecord.imageUrl} 
                      alt="مرفق السجل" 
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute -top-2 -left-2 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full"
                      onClick={() => {
                        setNewRecord(prev => ({ ...prev, imageUrl: "" }));
                        recordImagePathRef.current.clear();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Image className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleRecordImageUpload}
                  onComplete={handleRecordImageComplete}
                  buttonClassName="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع صورة
                </ObjectUploader>
              </div>
            </div>

            <Button onClick={createRecord} className="w-full" data-testid="button-submit-record">
              إضافة السجل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription className="text-slate-400">أدخل كلمة المرور الحالية والجديدة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input 
              type="password"
              placeholder="كلمة المرور الحالية *" 
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-current-password"
            />
            <Input 
              type="password"
              placeholder="كلمة المرور الجديدة *" 
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-new-password"
            />
            <Input 
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة *" 
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="bg-white/5 border-white/10"
              data-testid="input-confirm-password"
            />
            <Button 
              onClick={async () => {
                if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                  toast({ variant: "destructive", title: "يرجى ملء جميع الحقول" });
                  return;
                }
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  toast({ variant: "destructive", title: "كلمتا المرور غير متطابقتين" });
                  return;
                }
                if (passwordData.newPassword.length < 4) {
                  toast({ variant: "destructive", title: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
                  return;
                }
                try {
                  await apiRequest("POST", "/api/users/change-password", {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                  });
                  toast({ title: "تم تغيير كلمة المرور بنجاح" });
                  setShowChangePasswordModal(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                } catch (error: any) {
                  toast({ variant: "destructive", title: "خطأ", description: error.message || "كلمة المرور الحالية غير صحيحة" });
                }
              }} 
              className="w-full" 
              data-testid="button-submit-change-password"
            >
              تغيير كلمة المرور
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
