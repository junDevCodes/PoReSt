import { ControlSystem, DecisionStatus, OperationalStatus, Prisma } from "@prisma/client";
import type {
  ContentJobDto,
  ControlPlaneDashboardDto,
  ControlSystemDefinition,
  CreateContentJobInput,
  CreateSystemEventInput,
  FieldErrors,
  JundevOsService,
  JundevOsServicePrismaClient,
  ResolveDecisionInput,
  RunWorkflowInput,
  SystemDecisionDto,
  SystemEventDto,
  SystemReportDto,
  WorkflowRunDto,
} from "@/modules/jundev-os/interface";
import { JundevOsServiceError } from "@/modules/jundev-os/interface";

const ACTIVE_JOB_STATUSES: OperationalStatus[] = [
  OperationalStatus.PLANNED,
  OperationalStatus.READY,
  OperationalStatus.RUNNING,
  OperationalStatus.BLOCKED,
];

const CONTROL_SYSTEMS = Object.values(ControlSystem);
const OPERATIONAL_STATUSES = Object.values(OperationalStatus);
const DECISION_RESOLUTION_STATUSES: DecisionStatus[] = [
  DecisionStatus.APPROVED,
  DecisionStatus.REJECTED,
  DecisionStatus.CANCELED,
];

export const CONTROL_SYSTEM_DEFINITIONS: ControlSystemDefinition[] = [
  {
    key: ControlSystem.LIFE_HACK,
    label: "Life Hack",
    role: "콘텐츠 아이디어, 루틴, 발행 후보를 작업 단위로 관리합니다.",
    owner: "content-operator",
    accent: "#2E7BD9",
    references: ["Life Hack/contents", "agents/specs/content-operator.md", "archive content notes"],
    workflows: ["content-brief", "publish-review", "weekly-routine"],
  },
  {
    key: ControlSystem.JARVIS,
    label: "Jarvis",
    role: "이벤트, 리포트, 승인 요청을 공통 운영 타임라인으로 수집합니다.",
    owner: "reviewer",
    accent: "#13A15B",
    references: ["jarvis/events", "jarvis/reports", "jarvis/decision-requests"],
    workflows: ["event-ingest", "report-rollup", "decision-audit"],
  },
  {
    key: ControlSystem.TECH,
    label: "Tech",
    role: "레퍼런스 기반 구현 절차, 배포 체크, 워크플로 실행을 담당합니다.",
    owner: "executor",
    accent: "#F59E0B",
    references: ["tech/workflows", "tech/prompts", "integrations/*/contract.md"],
    workflows: ["reference-sync", "release-gate", "implementation-run"],
  },
  {
    key: ControlSystem.MONEY,
    label: "Money",
    role: "수익화 실험, 캠페인, 리스크 승인을 추적합니다.",
    owner: "planner",
    accent: "#8B5CF6",
    references: ["money/jobs", "money/localization", "archive monetization analysis"],
    workflows: ["campaign-plan", "risk-review", "revenue-report"],
  },
  {
    key: ControlSystem.POREST,
    label: "PoReSt",
    role: "jundevcodes.info에 배포되는 공개 포트폴리오와 private workspace host입니다.",
    owner: "PoReSt Next.js",
    accent: "#0EA5A3",
    references: ["PoReSt/src/app", "PoReSt/prisma/schema.prisma", "Vercel porest project"],
    workflows: ["porest-release-gate", "neon-health-check", "workspace-orchestration"],
  },
];

function buildValidationError(fields: FieldErrors): JundevOsServiceError {
  return new JundevOsServiceError(
    "VALIDATION_ERROR",
    422,
    "jundev-os 요청 값이 올바르지 않습니다.",
    fields,
  );
}

function readString(value: unknown, field: string, fields: FieldErrors, options?: { max?: number; required?: boolean }) {
  if (typeof value !== "string") {
    if (options?.required !== false) {
      fields[field] = `${field} 값이 필요합니다.`;
    }
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed && options?.required !== false) {
    fields[field] = `${field} 값이 필요합니다.`;
    return undefined;
  }

  if (options?.max && trimmed.length > options.max) {
    fields[field] = `${field} 값은 ${options.max}자를 넘을 수 없습니다.`;
    return undefined;
  }

  return trimmed || undefined;
}

function readControlSystem(value: unknown, fields: FieldErrors): ControlSystem {
  if (typeof value === "string" && CONTROL_SYSTEMS.includes(value as ControlSystem)) {
    return value as ControlSystem;
  }
  fields.system = `system은 ${CONTROL_SYSTEMS.join(", ")} 중 하나여야 합니다.`;
  return ControlSystem.POREST;
}

function readOperationalStatus(value: unknown, fields: FieldErrors): OperationalStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "string" && OPERATIONAL_STATUSES.includes(value as OperationalStatus)) {
    return value as OperationalStatus;
  }
  fields.status = `status는 ${OPERATIONAL_STATUSES.join(", ")} 중 하나여야 합니다.`;
  return undefined;
}

function readDecisionStatus(value: unknown, fields: FieldErrors): DecisionStatus {
  if (typeof value === "string" && DECISION_RESOLUTION_STATUSES.includes(value as DecisionStatus)) {
    return value as DecisionStatus;
  }
  fields.status = "status는 APPROVED, REJECTED, CANCELED 중 하나여야 합니다.";
  return DecisionStatus.CANCELED;
}

function readPriority(value: unknown, fields: FieldErrors) {
  if (value === undefined || value === null || value === "") {
    return 2;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    fields.priority = "priority는 1부터 5 사이의 정수여야 합니다.";
    return 2;
  }
  return parsed;
}

function readDate(value: unknown, field: string, fields: FieldErrors) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    fields[field] = `${field} 값은 ISO 날짜 문자열이어야 합니다.`;
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    fields[field] = `${field} 값은 유효한 날짜여야 합니다.`;
    return undefined;
  }
  return date;
}

function asInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

function definitionFor(system: ControlSystem) {
  return CONTROL_SYSTEM_DEFINITIONS.find((item) => item.key === system) ?? CONTROL_SYSTEM_DEFINITIONS[0];
}

function mapEvent(record: {
  id: string;
  system: ControlSystem;
  type: string;
  title: string;
  summary: string | null;
  severity: string;
  payloadJson: Prisma.JsonValue | null;
  createdAt: Date;
}): SystemEventDto {
  return {
    id: record.id,
    system: record.system,
    type: record.type,
    title: record.title,
    summary: record.summary,
    severity: record.severity,
    payloadJson: record.payloadJson,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapReport(record: {
  id: string;
  system: ControlSystem;
  title: string;
  bodyMd: string;
  source: string;
  tags: string[];
  payloadJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): SystemReportDto {
  return {
    id: record.id,
    system: record.system,
    title: record.title,
    bodyMd: record.bodyMd,
    source: record.source,
    tags: record.tags,
    payloadJson: record.payloadJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapDecision(record: {
  id: string;
  system: ControlSystem;
  title: string;
  description: string;
  status: DecisionStatus;
  optionsJson: Prisma.JsonValue | null;
  result: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SystemDecisionDto {
  return {
    id: record.id,
    system: record.system,
    title: record.title,
    description: record.description,
    status: record.status,
    optionsJson: record.optionsJson,
    result: record.result,
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapJob(record: {
  id: string;
  system: ControlSystem;
  title: string;
  channel: string;
  status: OperationalStatus;
  priority: number;
  description: string | null;
  dueAt: Date | null;
  payloadJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): ContentJobDto {
  return {
    id: record.id,
    system: record.system,
    title: record.title,
    channel: record.channel,
    status: record.status,
    priority: record.priority,
    description: record.description,
    dueAt: record.dueAt?.toISOString() ?? null,
    payloadJson: record.payloadJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapRun(record: {
  id: string;
  system: ControlSystem;
  workflowKey: string;
  status: OperationalStatus;
  summary: string | null;
  metricsJson: Prisma.JsonValue | null;
  logJson: Prisma.JsonValue | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkflowRunDto {
  return {
    id: record.id,
    system: record.system,
    workflowKey: record.workflowKey,
    status: record.status,
    summary: record.summary,
    metricsJson: record.metricsJson,
    logJson: record.logJson,
    startedAt: record.startedAt.toISOString(),
    finishedAt: record.finishedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function createJundevOsService({ prisma }: { prisma: JundevOsServicePrismaClient }): JundevOsService {
  return {
    async getDashboard(ownerId: string): Promise<ControlPlaneDashboardDto> {
      const [
        totalEvents,
        totalReports,
        totalOpenDecisions,
        totalActiveJobs,
        totalRuns,
        recentEvents,
        reports,
        openDecisions,
        activeJobs,
        recentRuns,
        systemCounts,
      ] = await Promise.all([
        prisma.systemEvent.count({ where: { ownerId } }),
        prisma.systemReport.count({ where: { ownerId } }),
        prisma.systemDecision.count({ where: { ownerId, status: DecisionStatus.OPEN } }),
        prisma.contentJob.count({ where: { ownerId, status: { in: ACTIVE_JOB_STATUSES } } }),
        prisma.workflowRun.count({ where: { ownerId } }),
        prisma.systemEvent.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, take: 12 }),
        prisma.systemReport.findMany({ where: { ownerId }, orderBy: { updatedAt: "desc" }, take: 6 }),
        prisma.systemDecision.findMany({
          where: { ownerId, status: DecisionStatus.OPEN },
          orderBy: { updatedAt: "desc" },
          take: 8,
        }),
        prisma.contentJob.findMany({
          where: { ownerId, status: { in: ACTIVE_JOB_STATUSES } },
          orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
          take: 10,
        }),
        prisma.workflowRun.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, take: 8 }),
        Promise.all(
          CONTROL_SYSTEM_DEFINITIONS.map(async (system) => {
            const [eventCount, openDecisionCount, activeJobCount, recentRunCount] = await Promise.all([
              prisma.systemEvent.count({ where: { ownerId, system: system.key } }),
              prisma.systemDecision.count({ where: { ownerId, system: system.key, status: DecisionStatus.OPEN } }),
              prisma.contentJob.count({
                where: { ownerId, system: system.key, status: { in: ACTIVE_JOB_STATUSES } },
              }),
              prisma.workflowRun.count({ where: { ownerId, system: system.key } }),
            ]);

            return {
              ...system,
              eventCount,
              openDecisionCount,
              activeJobCount,
              recentRunCount,
            };
          }),
        ),
      ]);

      return {
        systems: systemCounts,
        totals: {
          events: totalEvents,
          reports: totalReports,
          openDecisions: totalOpenDecisions,
          activeJobs: totalActiveJobs,
          workflowRuns: totalRuns,
        },
        recentEvents: recentEvents.map(mapEvent),
        reports: reports.map(mapReport),
        openDecisions: openDecisions.map(mapDecision),
        activeJobs: activeJobs.map(mapJob),
        recentRuns: recentRuns.map(mapRun),
      };
    },

    async createEvent(ownerId: string, input: CreateSystemEventInput): Promise<SystemEventDto> {
      const fields: FieldErrors = {};
      const system = readControlSystem(input.system, fields);
      const type = readString(input.type, "type", fields, { max: 80 }) ?? "manual.event";
      const title = readString(input.title, "title", fields, { max: 160 });
      const summary = readString(input.summary, "summary", fields, { max: 2000, required: false });
      const severity = readString(input.severity, "severity", fields, { max: 24, required: false }) ?? "INFO";

      if (!title || Object.keys(fields).length > 0) {
        throw buildValidationError(fields);
      }

      const event = await prisma.systemEvent.create({
        data: {
          ownerId,
          system,
          type,
          title,
          summary,
          severity,
          payloadJson: asInputJson(input.payloadJson),
        },
      });

      return mapEvent(event);
    },

    async createContentJob(ownerId: string, input: CreateContentJobInput) {
      const fields: FieldErrors = {};
      const system = readControlSystem(input.system, fields);
      const title = readString(input.title, "title", fields, { max: 180 });
      const channel = readString(input.channel, "channel", fields, { max: 80 }) ?? "workspace";
      const status = readOperationalStatus(input.status, fields) ?? OperationalStatus.PLANNED;
      const priority = readPriority(input.priority, fields);
      const description = readString(input.description, "description", fields, { max: 4000, required: false });
      const dueAt = readDate(input.dueAt, "dueAt", fields);

      if (!title || Object.keys(fields).length > 0) {
        throw buildValidationError(fields);
      }

      const job = await prisma.contentJob.create({
        data: {
          ownerId,
          system,
          title,
          channel,
          status,
          priority,
          description,
          dueAt,
          payloadJson: asInputJson(input.payloadJson),
        },
      });

      await prisma.systemEvent.create({
        data: {
          ownerId,
          system,
          type: "content.job.created",
          title: `${definitionFor(system).label} 작업 생성`,
          summary: title,
          severity: "INFO",
          payloadJson: { jobId: job.id, channel, priority },
        },
      });

      let decision = null;
      if (input.requiresApproval === true) {
        const createdDecision = await prisma.systemDecision.create({
          data: {
            ownerId,
            system,
            title: `승인 필요: ${title}`,
            description: description ?? `${definitionFor(system).label} 작업을 실행하기 전에 승인해야 합니다.`,
            optionsJson: { jobId: job.id, actions: ["APPROVED", "REJECTED", "CANCELED"] },
          },
        });
        decision = mapDecision(createdDecision);
      }

      return {
        job: mapJob(job),
        decision,
      };
    },

    async runWorkflow(ownerId: string, input: RunWorkflowInput) {
      const fields: FieldErrors = {};
      const system = readControlSystem(input.system, fields);
      const workflowKey = readString(input.workflowKey, "workflowKey", fields, { max: 120 });
      const requestedSummary = readString(input.summary, "summary", fields, { max: 2000, required: false });

      if (!workflowKey || Object.keys(fields).length > 0) {
        throw buildValidationError(fields);
      }

      const definition = definitionFor(system);
      const startedAt = new Date();
      const finishedAt = new Date();
      const summary =
        requestedSummary ??
        `${definition.label} ${workflowKey} workflow completed against the shared control-plane contract.`;

      const run = await prisma.workflowRun.create({
        data: {
          ownerId,
          system,
          workflowKey,
          status: OperationalStatus.DONE,
          summary,
          startedAt,
          finishedAt,
          metricsJson: {
            referenceCount: definition.references.length,
            workflowCount: definition.workflows.length,
          },
          logJson: [
            { step: "load-references", status: "DONE", references: definition.references },
            { step: "execute-workflow", status: "DONE", workflowKey },
            { step: "write-report", status: "DONE" },
          ],
        },
      });

      const report = await prisma.systemReport.create({
        data: {
          ownerId,
          system,
          title: `${definition.label} workflow report`,
          bodyMd: [
            `# ${definition.label} workflow report`,
            "",
            `- Workflow: ${workflowKey}`,
            `- Owner: ${definition.owner}`,
            `- Result: ${summary}`,
            `- References: ${definition.references.join(", ")}`,
          ].join("\n"),
          source: "jundev-os-control-plane",
          tags: [workflowKey, definition.label, "control-plane"],
          payloadJson: { runId: run.id, generatedAt: finishedAt.toISOString() },
        },
      });

      const event = await prisma.systemEvent.create({
        data: {
          ownerId,
          system,
          type: "workflow.run.completed",
          title: `${definition.label} workflow completed`,
          summary,
          severity: "INFO",
          payloadJson: { runId: run.id, reportId: report.id, workflowKey },
        },
      });

      return {
        run: mapRun(run),
        report: mapReport(report),
        event: mapEvent(event),
      };
    },

    async resolveDecision(ownerId: string, decisionId: string, input: ResolveDecisionInput) {
      const fields: FieldErrors = {};
      const status = readDecisionStatus(input.status, fields);
      const result = readString(input.result, "result", fields, { max: 2000, required: false });

      if (!decisionId) {
        fields.decisionId = "decisionId 값이 필요합니다.";
      }
      if (Object.keys(fields).length > 0) {
        throw buildValidationError(fields);
      }

      const existing = await prisma.systemDecision.findFirst({
        where: { id: decisionId, ownerId },
      });

      if (!existing) {
        throw new JundevOsServiceError("NOT_FOUND", 404, "승인 요청을 찾을 수 없습니다.");
      }

      if (existing.status !== DecisionStatus.OPEN) {
        throw new JundevOsServiceError("CONFLICT", 409, "이미 처리된 승인 요청입니다.");
      }

      const updated = await prisma.systemDecision.update({
        where: { id: decisionId },
        data: {
          status,
          result: result ?? status,
          resolvedAt: new Date(),
        },
      });

      await prisma.systemEvent.create({
        data: {
          ownerId,
          system: updated.system,
          type: "decision.resolved",
          title: `Decision ${status.toLowerCase()}`,
          summary: updated.title,
          severity: status === DecisionStatus.APPROVED ? "INFO" : "WARN",
          payloadJson: { decisionId: updated.id, status },
        },
      });

      return mapDecision(updated);
    },
  };
}
