import type { ControlSystem, DecisionStatus, OperationalStatus, Prisma } from "@prisma/client";

export type FieldErrors = Record<string, string>;

export type ControlSystemDefinition = {
  key: ControlSystem;
  label: string;
  role: string;
  owner: string;
  accent: string;
  references: string[];
  workflows: string[];
};

export type SystemSummaryDto = ControlSystemDefinition & {
  eventCount: number;
  openDecisionCount: number;
  activeJobCount: number;
  recentRunCount: number;
};

export type SystemEventDto = {
  id: string;
  system: ControlSystem;
  type: string;
  title: string;
  summary: string | null;
  severity: string;
  payloadJson: Prisma.JsonValue | null;
  createdAt: string;
};

export type SystemReportDto = {
  id: string;
  system: ControlSystem;
  title: string;
  bodyMd: string;
  source: string;
  tags: string[];
  payloadJson: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
};

export type SystemDecisionDto = {
  id: string;
  system: ControlSystem;
  title: string;
  description: string;
  status: DecisionStatus;
  optionsJson: Prisma.JsonValue | null;
  result: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentJobDto = {
  id: string;
  system: ControlSystem;
  title: string;
  channel: string;
  status: OperationalStatus;
  priority: number;
  description: string | null;
  dueAt: string | null;
  payloadJson: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRunDto = {
  id: string;
  system: ControlSystem;
  workflowKey: string;
  status: OperationalStatus;
  summary: string | null;
  metricsJson: Prisma.JsonValue | null;
  logJson: Prisma.JsonValue | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ControlPlaneDashboardDto = {
  systems: SystemSummaryDto[];
  totals: {
    events: number;
    reports: number;
    openDecisions: number;
    activeJobs: number;
    workflowRuns: number;
  };
  recentEvents: SystemEventDto[];
  reports: SystemReportDto[];
  openDecisions: SystemDecisionDto[];
  activeJobs: ContentJobDto[];
  recentRuns: WorkflowRunDto[];
};

export type CreateSystemEventInput = {
  system?: unknown;
  type?: unknown;
  title?: unknown;
  summary?: unknown;
  severity?: unknown;
  payloadJson?: unknown;
};

export type CreateContentJobInput = {
  system?: unknown;
  title?: unknown;
  channel?: unknown;
  status?: unknown;
  priority?: unknown;
  description?: unknown;
  dueAt?: unknown;
  payloadJson?: unknown;
  requiresApproval?: unknown;
};

export type RunWorkflowInput = {
  system?: unknown;
  workflowKey?: unknown;
  summary?: unknown;
};

export type ResolveDecisionInput = {
  status?: unknown;
  result?: unknown;
};

export type JundevOsServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class JundevOsServiceError extends Error {
  readonly code: JundevOsServiceErrorCode;
  readonly status: number;
  readonly fields?: FieldErrors;

  constructor(code: JundevOsServiceErrorCode, status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isJundevOsServiceError(error: unknown): error is JundevOsServiceError {
  return error instanceof JundevOsServiceError;
}

export type JundevOsServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "systemEvent" | "systemReport" | "systemDecision" | "contentJob" | "workflowRun"
>;

export interface JundevOsService {
  getDashboard(ownerId: string): Promise<ControlPlaneDashboardDto>;
  createEvent(ownerId: string, input: CreateSystemEventInput): Promise<SystemEventDto>;
  createContentJob(ownerId: string, input: CreateContentJobInput): Promise<{
    job: ContentJobDto;
    decision: SystemDecisionDto | null;
  }>;
  runWorkflow(ownerId: string, input: RunWorkflowInput): Promise<{
    run: WorkflowRunDto;
    report: SystemReportDto;
    event: SystemEventDto;
  }>;
  resolveDecision(ownerId: string, decisionId: string, input: ResolveDecisionInput): Promise<SystemDecisionDto>;
}
