import { defineCollection, z } from 'astro:content';

// Astro Content Collection 스키마 (Zod)
// - Strict TS의 “단일 진실 공급원”으로 사용

const projectSchema = z.object({
  title: z.string(),
  // Keystatic의 contentField 설정에 따라 MDX 본문이 description으로 저장될 수 있음
  description: z.string().optional(),
  category: z.string(),
  role: z.string().optional(),
  team_size: z.number().optional(),
  start_date: z.string().or(z.date()).transform((val) => new Date(val)),
  end_date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  tech_stack: z.array(z.string()),
  github_url: z.string().url().optional(),
  demo_url: z.string().url().optional(),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

const workSchema = z.object({
  company: z.string(),
  position: z.string(),
  department: z.string().optional(),
  start_date: z.string().or(z.date()).transform((val) => new Date(val)),
  end_date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

const educationSchema = z.object({
  school: z.string(),
  major: z.string(),
  degree: z.string(),
  status: z.string(),
  start_date: z.string().or(z.date()).transform((val) => new Date(val)),
  end_date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  gpa: z.string().optional(),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

const certificationsSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  type: z.string().optional(),
  score: z.string().optional(),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

const profileSchema = z.object({
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  area: z.array(z.string()),
  email: z.string().optional(),
  phone: z.string().optional(),
  photo: z.string().optional(),
});

export type ProjectData = z.infer<typeof projectSchema>;
export type WorkData = z.infer<typeof workSchema>;
export type EducationData = z.infer<typeof educationSchema>;
export type CertificationData = z.infer<typeof certificationsSchema>;
export type ProfileData = z.infer<typeof profileSchema>;

const projects = defineCollection({
  type: 'content',
  schema: projectSchema,
});

const work = defineCollection({
  type: 'data',
  schema: workSchema,
});

const education = defineCollection({
  type: 'data',
  schema: educationSchema,
});

const certifications = defineCollection({
  type: 'data',
  schema: certificationsSchema,
});

const profile = defineCollection({
  type: 'data',
  schema: profileSchema,
});

export const collections = {
  projects,
  work,
  education,
  certifications,
  profile,
};

