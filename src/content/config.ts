import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(), // In Astro content, the body is the description content, but Keystatic might save a description field if configured. 
    // Wait, with Keystatic 'content' field, the body is the content. 
    // But in keystatic config I used `format: { contentField: 'description' }`.
    // So the markdown body is the description.
    category: z.string(),
    role: z.string().optional(),
    team_size: z.number().optional(),
    start_date: z.string().or(z.date()).transform((val) => new Date(val)),
    end_date: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
    tech_stack: z.array(z.string()),
    github_url: z.string().url().optional(),
    demo_url: z.string().url().optional(),
    order: z.number().default(0),
    visible: z.boolean().default(true),
  }),
});

const work = defineCollection({
  type: 'data',
  schema: z.object({
    company: z.string(),
    position: z.string(),
    department: z.string().optional(),
    start_date: z.string().or(z.date()).transform((val) => new Date(val)),
    end_date: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
    is_current: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string()).optional(),
    order: z.number().default(0),
    visible: z.boolean().default(true),
  }),
});

const education = defineCollection({
  type: 'data',
  schema: z.object({
    school: z.string(),
    major: z.string(),
    degree: z.string(),
    status: z.string(),
    start_date: z.string().or(z.date()).transform((val) => new Date(val)),
    end_date: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
    gpa: z.string().optional(),
    order: z.number().default(0),
    visible: z.boolean().default(true),
  }),
});

const certifications = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    type: z.string().optional(),
    score: z.string().optional(),
    order: z.number().default(0),
    visible: z.boolean().default(true),
  }),
});

const profile = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    summary: z.string(),
    area: z.array(z.string()),
    email: z.string().optional(),
    phone: z.string().optional(),
    photo: z.string().optional(),
  }),
});

export const collections = {
  projects,
  work,
  education,
  certifications,
  profile,
};
