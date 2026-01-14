import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertAnnouncement, type InsertWantedPerson } from "@shared/schema";
import { z } from "zod";

// ============================================
// ANNOUNCEMENTS
// ============================================

export function useAnnouncements(type?: "public" | "internal") {
  return useQuery({
    queryKey: [api.announcements.list.path, type],
    queryFn: async () => {
      // Manually constructing URL with params since fetch doesn't do it automatically
      const url = type 
        ? `${api.announcements.list.path}?type=${type}`
        : api.announcements.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return api.announcements.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAnnouncement) => {
      const validated = api.announcements.create.input.parse(data);
      const res = await fetch(api.announcements.create.path, {
        method: api.announcements.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.announcements.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create announcement');
      }
      return api.announcements.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.announcements.list.path] });
    },
  });
}

// ============================================
// WANTED LIST
// ============================================

export function useWantedList() {
  return useQuery({
    queryKey: [api.wanted.list.path],
    queryFn: async () => {
      const res = await fetch(api.wanted.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch wanted list");
      return api.wanted.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWantedPerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWantedPerson) => {
      const validated = api.wanted.create.input.parse(data);
      const res = await fetch(api.wanted.create.path, {
        method: api.wanted.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.wanted.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to add to wanted list');
      }
      return api.wanted.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.wanted.list.path] });
    },
  });
}

// ============================================
// DEPARTMENTS
// ============================================

export function useDepartments() {
  return useQuery({
    queryKey: [api.departments.list.path],
    queryFn: async () => {
      const res = await fetch(api.departments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch departments");
      return api.departments.list.responses[200].parse(await res.json());
    },
  });
}

// ============================================
// REPORTS & AUTH
// ============================================

export function useReports() {
  return useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل تسجيل الدخول");
      }
      return res.json();
    },
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.reports.create.input>) => {
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل إرسال البلاغ");
      }
      return res.json();
    },
  });
}

// ============================================
// PERSONNEL (MILITARY AFFAIRS)
// ============================================

export function usePersonnel() {
  return useQuery({
    queryKey: ["/api/personnel"],
    queryFn: async () => {
      const res = await fetch("/api/personnel", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch personnel");
      return res.json();
    },
  });
}

// ============================================
// PERSONNEL RECORDS (السجلات)
// ============================================

export function usePersonnelRecords(personnelId?: number) {
  return useQuery({
    queryKey: ["/api/personnel-records", personnelId],
    queryFn: async () => {
      const url = personnelId 
        ? `/api/personnel-records?personnelId=${personnelId}`
        : "/api/personnel-records";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch personnel records");
      return res.json();
    },
  });
}

// ============================================
// WANTED VEHICLES (السيارات المطلوبة)
// ============================================

export function useWantedVehicles() {
  return useQuery({
    queryKey: ["/api/wanted-vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/wanted-vehicles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch wanted vehicles");
      return res.json();
    },
  });
}

export function usePublicWantedVehicles() {
  return useQuery({
    queryKey: ["/api/wanted-vehicles/public"],
    queryFn: async () => {
      const res = await fetch("/api/wanted-vehicles/public", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch wanted vehicles");
      return res.json();
    },
  });
}

// ============================================
// INTERNAL REPORTS (البلاغات الداخلية)
// ============================================

export function useInternalReports() {
  return useQuery({
    queryKey: ["/api/internal-reports"],
    queryFn: async () => {
      const res = await fetch("/api/internal-reports", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch internal reports");
      return res.json();
    },
  });
}
