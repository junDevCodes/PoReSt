import { z } from "zod";
import { CompanyTargetStatus } from "@prisma/client";
import {
  GrowthTimelineServiceError,
  GROWTH_EVENT_TYPES,
  GROWTH_EVENT_LABELS,
  type GrowthEventDto,
  type GrowthTimelineData,
  type DailyActivityCount,
  type TypeDistribution,
  type MonthlySummary,
  type SyncResult,
  type GrowthTimelineService,
  type GrowthTimelineServicePrismaClient,
} from "@/modules/growth-timeline/interface";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const DEFAULT_DAYS = 365; // 히트맵: 최근 1년
const RECENT_EVENTS_LIMIT = 50;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MS_PER_DAY = 86400000;

// ─────────────────────────────────────────────
// Zod 스키마
// ─────────────────────────────────────────────

const createEventSchema = z.object({
  type: z.enum(GROWTH_EVENT_TYPES as unknown as [string, ...string[]], {
    message: "올바른 이벤트 유형이 아닙니다.",
  }),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(MAX_TITLE_LENGTH, `제목은 ${MAX_TITLE_LENGTH}자 이하로 입력해주세요.`),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, `설명은 ${MAX_DESCRIPTION_LENGTH}자 이하로 입력해주세요.`)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  occurredAt: z
    .string()
    .min(1, "발생일을 입력해주세요.")
    .refine((v) => !isNaN(new Date(v).getTime()), "올바른 날짜 형식이 아닙니다."),
});

// ─────────────────────────────────────────────
// Prisma Select
// ─────────────────────────────────────────────

const growthEventSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  entityId: true,
  occurredAt: true,
  createdAt: true,
  ownerId: true,
} as const;

// ─────────────────────────────────────────────
// Zod 검증 헬퍼
// ─────────────────────────────────────────────

function extractZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
}

// ─────────────────────────────────────────────
// 서비스 생성
// ─────────────────────────────────────────────

export function createGrowthTimelineService(deps: {
  prisma: GrowthTimelineServicePrismaClient;
}): GrowthTimelineService {
  const { prisma } = deps;

  return {
    async getTimeline(ownerId, days = DEFAULT_DAYS): Promise<GrowthTimelineData> {
      const now = new Date();
      const rangeStart = new Date(now.getTime() - days * MS_PER_DAY);
      rangeStart.setHours(0, 0, 0, 0);

      const [totalEvents, allEvents, recentEvents] = await Promise.all([
        prisma.growthEvent.count({ where: { ownerId } }),
        prisma.growthEvent.findMany({
          where: { ownerId, occurredAt: { gte: rangeStart } },
          select: { type: true, occurredAt: true },
          orderBy: { occurredAt: "asc" },
        }),
        prisma.growthEvent.findMany({
          where: { ownerId },
          select: growthEventSelect,
          orderBy: { occurredAt: "desc" },
          take: RECENT_EVENTS_LIMIT,
        }),
      ]);

      // 히트맵: 일별 카운트
      const dailyMap = new Map<string, number>();
      for (let d = 0; d < days; d++) {
        const date = new Date(rangeStart.getTime() + d * MS_PER_DAY);
        dailyMap.set(date.toISOString().slice(0, 10), 0);
      }
      for (const event of allEvents) {
        const dateKey = event.occurredAt.toISOString().slice(0, 10);
        dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
      }
      const heatmap: DailyActivityCount[] = Array.from(dailyMap.entries()).map(
        ([date, count]) => ({ date, count }),
      );

      // 타입별 분포
      const typeMap = new Map<string, number>();
      for (const event of allEvents) {
        typeMap.set(event.type, (typeMap.get(event.type) ?? 0) + 1);
      }
      const typeDistribution: TypeDistribution[] = Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          label: GROWTH_EVENT_LABELS[type as keyof typeof GROWTH_EVENT_LABELS] ?? type,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // 월별 요약
      const monthlyMap = new Map<string, number>();
      for (const event of allEvents) {
        const month = event.occurredAt.toISOString().slice(0, 7);
        monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
      }
      const monthlySummary: MonthlySummary[] = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalEvents,
        recentEvents: recentEvents.map(mapGrowthEvent),
        heatmap,
        typeDistribution,
        monthlySummary,
      };
    },

    async createEvent(ownerId, input): Promise<GrowthEventDto> {
      const parsed = createEventSchema.safeParse(input);
      if (!parsed.success) {
        throw new GrowthTimelineServiceError(
          "VALIDATION_ERROR",
          422,
          "이벤트 입력값이 올바르지 않습니다.",
          extractZodFieldErrors(parsed.error),
        );
      }

      const created = await prisma.growthEvent.create({
        data: {
          ownerId,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description,
          occurredAt: new Date(parsed.data.occurredAt),
        },
        select: growthEventSelect,
      });

      return mapGrowthEvent(created);
    },

    async deleteEvent(ownerId, eventId): Promise<void> {
      const existing = await prisma.growthEvent.findUnique({
        where: { id: eventId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new GrowthTimelineServiceError("NOT_FOUND", 404, "이벤트를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new GrowthTimelineServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      await prisma.growthEvent.delete({ where: { id: eventId } });
    },

    async syncFromEntities(ownerId): Promise<SyncResult> {
      // 기존 이벤트의 entityId 목록 조회 (중복 방지)
      const existingEvents = await prisma.growthEvent.findMany({
        where: { ownerId, entityId: { not: null } },
        select: { entityId: true, type: true },
      });
      const existingKeys = new Set(
        existingEvents.map((e) => `${e.type}:${e.entityId}`),
      );

      let created = 0;
      let skipped = 0;

      // 1. Skills
      const skills = await prisma.skill.findMany({
        where: { ownerId },
        select: { id: true, name: true, createdAt: true },
      });
      for (const skill of skills) {
        const key = `SKILL_ADDED:${skill.id}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await prisma.growthEvent.create({
          data: {
            ownerId,
            type: "SKILL_ADDED",
            title: `${skill.name} 기술 추가`,
            entityId: skill.id,
            occurredAt: skill.createdAt,
          },
        });
        created++;
      }

      // 2. Projects
      const projects = await prisma.project.findMany({
        where: { ownerId },
        select: { id: true, title: true, createdAt: true },
      });
      for (const project of projects) {
        const key = `PROJECT_CREATED:${project.id}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await prisma.growthEvent.create({
          data: {
            ownerId,
            type: "PROJECT_CREATED",
            title: `${project.title} 프로젝트 생성`,
            entityId: project.id,
            occurredAt: project.createdAt,
          },
        });
        created++;
      }

      // 3. Experiences
      const experiences = await prisma.experience.findMany({
        where: { ownerId },
        select: { id: true, company: true, role: true, createdAt: true },
      });
      for (const exp of experiences) {
        const key = `EXPERIENCE_ADDED:${exp.id}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await prisma.growthEvent.create({
          data: {
            ownerId,
            type: "EXPERIENCE_ADDED",
            title: `${exp.company} / ${exp.role} 경력 추가`,
            entityId: exp.id,
            occurredAt: exp.createdAt,
          },
        });
        created++;
      }

      // 4. Resumes
      const resumes = await prisma.resume.findMany({
        where: { ownerId },
        select: { id: true, title: true, createdAt: true },
      });
      for (const resume of resumes) {
        const key = `RESUME_CREATED:${resume.id}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await prisma.growthEvent.create({
          data: {
            ownerId,
            type: "RESUME_CREATED",
            title: `${resume.title} 이력서 생성`,
            entityId: resume.id,
            occurredAt: resume.createdAt,
          },
        });
        created++;
      }

      // 5. Notes (soft delete 제외)
      const notes = await prisma.note.findMany({
        where: { ownerId, deletedAt: null },
        select: { id: true, title: true, createdAt: true },
      });
      for (const note of notes) {
        const key = `NOTE_CREATED:${note.id}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await prisma.growthEvent.create({
          data: {
            ownerId,
            type: "NOTE_CREATED",
            title: `${note.title} 노트 작성`,
            entityId: note.id,
            occurredAt: note.createdAt,
          },
        });
        created++;
      }

      // 6. CompanyTarget — APPLIED/OFFER 상태
      const targets = await prisma.companyTarget.findMany({
        where: {
          ownerId,
          status: { in: [CompanyTargetStatus.APPLIED, CompanyTargetStatus.OFFER] },
        },
        select: { id: true, company: true, role: true, status: true, appliedAt: true, createdAt: true },
      });
      for (const target of targets) {
        if (target.status === CompanyTargetStatus.APPLIED || target.status === CompanyTargetStatus.OFFER) {
          const eventType = target.status === CompanyTargetStatus.APPLIED ? "JOB_APPLIED" : "OFFER_RECEIVED";
          const key = `${eventType}:${target.id}`;
          if (existingKeys.has(key)) {
            skipped++;
            continue;
          }
          const label = eventType === "JOB_APPLIED" ? "지원 완료" : "오퍼 수령";
          await prisma.growthEvent.create({
            data: {
              ownerId,
              type: eventType,
              title: `${target.company} / ${target.role} ${label}`,
              entityId: target.id,
              occurredAt: target.appliedAt ?? target.createdAt,
            },
          });
          created++;
        }
      }

      return { created, skipped };
    },
  };
}

// ─────────────────────────────────────────────
// DTO 매핑
// ─────────────────────────────────────────────

type GrowthEventRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityId: string | null;
  occurredAt: Date;
  createdAt: Date;
  ownerId: string;
};

function mapGrowthEvent(row: GrowthEventRow): GrowthEventDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    entityId: row.entityId,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}
