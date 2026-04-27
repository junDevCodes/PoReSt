import { ControlSystem, DecisionStatus, OperationalStatus } from "@prisma/client";
import { createJundevOsService } from "@/modules/jundev-os";
import type { JundevOsServicePrismaClient } from "@/modules/jundev-os";

type Row = Record<string, unknown> & {
  id: string;
  ownerId: string;
  createdAt: Date;
  updatedAt?: Date;
};

type WhereValue = string | number | Date | null | { in?: unknown[] };

function matchesWhere(row: Row, where?: Record<string, WhereValue>) {
  if (!where) {
    return true;
  }

  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object" && "in" in value) {
      return value.in?.includes(row[key]) ?? false;
    }
    return row[key] === value;
  });
}

function compareRows(a: Row, b: Row, field: string, direction: "asc" | "desc") {
  const aValue = a[field];
  const bValue = b[field];
  const aComparable = aValue instanceof Date ? aValue.getTime() : Number(aValue ?? 0);
  const bComparable = bValue instanceof Date ? bValue.getTime() : Number(bValue ?? 0);
  return direction === "asc" ? aComparable - bComparable : bComparable - aComparable;
}

function createModel(defaults: (data: Record<string, unknown>) => Record<string, unknown> = () => ({})) {
  const rows: Row[] = [];
  let nextId = 1;

  return {
    rows,
    count: jest.fn(async ({ where }: { where?: Record<string, WhereValue> } = {}) => {
      return rows.filter((row) => matchesWhere(row, where)).length;
    }),
    findMany: jest.fn(
      async ({
        where,
        orderBy,
        take,
      }: {
        where?: Record<string, WhereValue>;
        orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
        take?: number;
      } = {}) => {
        const filtered = rows.filter((row) => matchesWhere(row, where));
        const orderList = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
        const sorted = [...filtered].sort((a, b) => {
          for (const order of orderList) {
            const [field, direction] = Object.entries(order)[0] ?? [];
            if (!field || !direction) {
              continue;
            }
            const compared = compareRows(a, b, field, direction);
            if (compared !== 0) {
              return compared;
            }
          }
          return 0;
        });
        return typeof take === "number" ? sorted.slice(0, take) : sorted;
      },
    ),
    findFirst: jest.fn(async ({ where }: { where?: Record<string, WhereValue> } = {}) => {
      return rows.find((row) => matchesWhere(row, where)) ?? null;
    }),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const now = new Date("2026-04-27T00:00:00.000Z");
      const row = {
        id: `row-${nextId}`,
        ...defaults(data),
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : now,
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
      } as Row;
      nextId += 1;
      rows.push(row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = rows.find((candidate) => candidate.id === where.id);
      if (!row) {
        throw new Error("row not found");
      }
      Object.assign(row, data, { updatedAt: new Date("2026-04-27T00:05:00.000Z") });
      return row;
    }),
  };
}

function createFakePrisma() {
  return {
    systemEvent: createModel((data) => ({
      summary: null,
      payloadJson: null,
      severity: data.severity ?? "INFO",
    })),
    systemReport: createModel((data) => ({
      payloadJson: null,
      tags: data.tags ?? [],
    })),
    systemDecision: createModel((data) => ({
      status: data.status ?? DecisionStatus.OPEN,
      optionsJson: data.optionsJson ?? null,
      result: null,
      resolvedAt: null,
    })),
    contentJob: createModel((data) => ({
      status: data.status ?? OperationalStatus.PLANNED,
      description: data.description ?? null,
      dueAt: data.dueAt ?? null,
      payloadJson: data.payloadJson ?? null,
    })),
    workflowRun: createModel((data) => ({
      status: data.status ?? OperationalStatus.RUNNING,
      summary: data.summary ?? null,
      metricsJson: data.metricsJson ?? null,
      logJson: data.logJson ?? null,
      finishedAt: data.finishedAt ?? null,
      startedAt: data.startedAt ?? new Date("2026-04-27T00:00:00.000Z"),
    })),
  };
}

describe("jundev-os service", () => {
  it("returns all system definitions in an empty dashboard", async () => {
    const prisma = createFakePrisma();
    const service = createJundevOsService({ prisma: prisma as unknown as JundevOsServicePrismaClient });

    const dashboard = await service.getDashboard("owner-1");

    expect(dashboard.systems.map((system) => system.key)).toEqual([
      ControlSystem.LIFE_HACK,
      ControlSystem.JARVIS,
      ControlSystem.TECH,
      ControlSystem.MONEY,
      ControlSystem.POREST,
    ]);
    expect(dashboard.totals).toEqual({
      events: 0,
      reports: 0,
      openDecisions: 0,
      activeJobs: 0,
      workflowRuns: 0,
    });
  });

  it("runs a workflow and writes run, report, and event rows", async () => {
    const prisma = createFakePrisma();
    const service = createJundevOsService({ prisma: prisma as unknown as JundevOsServicePrismaClient });

    const result = await service.runWorkflow("owner-1", {
      system: ControlSystem.POREST,
      workflowKey: "porest-release-gate",
      summary: "release gate completed",
    });

    expect(result.run.status).toBe(OperationalStatus.DONE);
    expect(result.report.source).toBe("jundev-os-control-plane");
    expect(result.event.type).toBe("workflow.run.completed");
    expect(prisma.workflowRun.rows).toHaveLength(1);
    expect(prisma.systemReport.rows).toHaveLength(1);
    expect(prisma.systemEvent.rows).toHaveLength(1);
  });

  it("creates a content job and optional approval decision", async () => {
    const prisma = createFakePrisma();
    const service = createJundevOsService({ prisma: prisma as unknown as JundevOsServicePrismaClient });

    const result = await service.createContentJob("owner-1", {
      system: ControlSystem.MONEY,
      title: "campaign risk review",
      channel: "campaign",
      requiresApproval: true,
    });

    expect(result.job.status).toBe(OperationalStatus.PLANNED);
    expect(result.decision?.status).toBe(DecisionStatus.OPEN);
    expect(prisma.contentJob.rows).toHaveLength(1);
    expect(prisma.systemDecision.rows).toHaveLength(1);
    expect(prisma.systemEvent.rows).toHaveLength(1);
  });
});
