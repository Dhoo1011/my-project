import { z } from 'zod';
import { insertAnnouncementSchema, insertWantedSchema, insertDepartmentSchema, insertReportSchema, announcements, wantedList, departments, reports } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/report',
      input: insertReportSchema,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        201: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/announcements',
      input: z.object({ type: z.enum(["public", "internal"]).optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof announcements.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/announcements',
      input: insertAnnouncementSchema,
      responses: {
        201: z.custom<typeof announcements.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  wanted: {
    list: {
      method: 'GET' as const,
      path: '/api/wanted',
      responses: {
        200: z.array(z.custom<typeof wantedList.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/wanted',
      input: insertWantedSchema,
      responses: {
        201: z.custom<typeof wantedList.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  departments: {
    list: {
      method: 'GET' as const,
      path: '/api/departments',
      responses: {
        200: z.array(z.custom<typeof departments.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
