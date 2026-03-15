import {
  GROWTH_EVENT_TYPES,
  GROWTH_EVENT_LABELS,
  GrowthTimelineServiceError,
  isGrowthTimelineServiceError,
} from "@/modules/growth-timeline/interface";
import { createGrowthTimelineService } from "@/modules/growth-timeline/implementation";

// ─────────────────────────────────────────────
// GROWTH_EVENT_TYPES
// ─────────────────────────────────────────────

describe("GROWTH_EVENT_TYPES", () => {
  it("8개 이벤트 타입 정의", () => {
    expect(GROWTH_EVENT_TYPES).toHaveLength(8);
    expect(GROWTH_EVENT_TYPES).toContain("SKILL_ADDED");
    expect(GROWTH_EVENT_TYPES).toContain("PROJECT_CREATED");
    expect(GROWTH_EVENT_TYPES).toContain("EXPERIENCE_ADDED");
    expect(GROWTH_EVENT_TYPES).toContain("RESUME_CREATED");
    expect(GROWTH_EVENT_TYPES).toContain("NOTE_CREATED");
    expect(GROWTH_EVENT_TYPES).toContain("JOB_APPLIED");
    expect(GROWTH_EVENT_TYPES).toContain("OFFER_RECEIVED");
    expect(GROWTH_EVENT_TYPES).toContain("CUSTOM");
  });

  it("모든 타입에 한국어 라벨 존재", () => {
    for (const type of GROWTH_EVENT_TYPES) {
      expect(GROWTH_EVENT_LABELS[type]).toBeDefined();
      expect(typeof GROWTH_EVENT_LABELS[type]).toBe("string");
      expect(GROWTH_EVENT_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────
// GrowthTimelineServiceError
// ─────────────────────────────────────────────

describe("GrowthTimelineServiceError", () => {
  it("에러 생성 (기본)", () => {
    const error = new GrowthTimelineServiceError(
      "NOT_FOUND",
      404,
      "이벤트를 찾을 수 없습니다.",
    );
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.message).toBe("이벤트를 찾을 수 없습니다.");
    expect(error.fields).toBeUndefined();
  });

  it("에러 생성 (필드 에러 포함)", () => {
    const error = new GrowthTimelineServiceError(
      "VALIDATION_ERROR",
      422,
      "입력값 오류",
      { title: "제목을 입력해주세요." },
    );
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fields).toEqual({ title: "제목을 입력해주세요." });
  });

  it("isGrowthTimelineServiceError 타입 가드 (true)", () => {
    const error = new GrowthTimelineServiceError("FORBIDDEN", 403, "권한 없음");
    expect(isGrowthTimelineServiceError(error)).toBe(true);
  });

  it("isGrowthTimelineServiceError 타입 가드 (false)", () => {
    expect(isGrowthTimelineServiceError(new Error("일반 에러"))).toBe(false);
    expect(isGrowthTimelineServiceError(null)).toBe(false);
    expect(isGrowthTimelineServiceError("string")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// createGrowthTimelineService — createEvent 검증
// ─────────────────────────────────────────────

describe("createGrowthTimelineService — createEvent 검증", () => {
  const mockPrisma = {
    growthEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    skill: { findMany: jest.fn() },
    project: { findMany: jest.fn() },
    experience: { findMany: jest.fn() },
    resume: { findMany: jest.fn() },
    note: { findMany: jest.fn() },
    companyTarget: { findMany: jest.fn() },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createGrowthTimelineService({ prisma: mockPrisma as any });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("유효한 입력 → 이벤트 생성", async () => {
    const now = new Date();
    mockPrisma.growthEvent.create.mockResolvedValue({
      id: "evt1",
      type: "CUSTOM",
      title: "자격증 취득",
      description: null,
      entityId: null,
      occurredAt: now,
      createdAt: now,
      ownerId: "owner1",
    });

    const result = await service.createEvent("owner1", {
      type: "CUSTOM",
      title: "자격증 취득",
      occurredAt: now.toISOString(),
    });

    expect(result.id).toBe("evt1");
    expect(result.title).toBe("자격증 취득");
    expect(mockPrisma.growthEvent.create).toHaveBeenCalledTimes(1);
  });

  it("빈 제목 → VALIDATION_ERROR", async () => {
    await expect(
      service.createEvent("owner1", {
        type: "CUSTOM",
        title: "",
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(GrowthTimelineServiceError);

    try {
      await service.createEvent("owner1", {
        type: "CUSTOM",
        title: "",
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      expect((error as GrowthTimelineServiceError).code).toBe("VALIDATION_ERROR");
      expect((error as GrowthTimelineServiceError).status).toBe(422);
    }
  });

  it("잘못된 이벤트 타입 → VALIDATION_ERROR", async () => {
    await expect(
      service.createEvent("owner1", {
        type: "INVALID_TYPE",
        title: "테스트",
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(GrowthTimelineServiceError);
  });

  it("잘못된 날짜 형식 → VALIDATION_ERROR", async () => {
    await expect(
      service.createEvent("owner1", {
        type: "CUSTOM",
        title: "테스트",
        occurredAt: "not-a-date",
      }),
    ).rejects.toThrow(GrowthTimelineServiceError);
  });

  it("제목 200자 초과 → VALIDATION_ERROR", async () => {
    await expect(
      service.createEvent("owner1", {
        type: "CUSTOM",
        title: "가".repeat(201),
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(GrowthTimelineServiceError);
  });

  it("설명 2000자 초과 → VALIDATION_ERROR", async () => {
    await expect(
      service.createEvent("owner1", {
        type: "CUSTOM",
        title: "테스트",
        description: "가".repeat(2001),
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(GrowthTimelineServiceError);
  });
});

// ─────────────────────────────────────────────
// createGrowthTimelineService — deleteEvent 검증
// ─────────────────────────────────────────────

describe("createGrowthTimelineService — deleteEvent 검증", () => {
  const mockPrisma = {
    growthEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    skill: { findMany: jest.fn() },
    project: { findMany: jest.fn() },
    experience: { findMany: jest.fn() },
    resume: { findMany: jest.fn() },
    note: { findMany: jest.fn() },
    companyTarget: { findMany: jest.fn() },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createGrowthTimelineService({ prisma: mockPrisma as any });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("존재하지 않는 이벤트 → NOT_FOUND", async () => {
    mockPrisma.growthEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.deleteEvent("owner1", "nonexistent"),
    ).rejects.toThrow(GrowthTimelineServiceError);

    try {
      await service.deleteEvent("owner1", "nonexistent");
    } catch (error) {
      expect((error as GrowthTimelineServiceError).code).toBe("NOT_FOUND");
    }
  });

  it("다른 소유자 이벤트 삭제 → FORBIDDEN", async () => {
    mockPrisma.growthEvent.findUnique.mockResolvedValue({
      id: "evt1",
      ownerId: "other-owner",
    });

    await expect(
      service.deleteEvent("owner1", "evt1"),
    ).rejects.toThrow(GrowthTimelineServiceError);

    try {
      await service.deleteEvent("owner1", "evt1");
    } catch (error) {
      expect((error as GrowthTimelineServiceError).code).toBe("FORBIDDEN");
    }
  });

  it("정상 삭제", async () => {
    mockPrisma.growthEvent.findUnique.mockResolvedValue({
      id: "evt1",
      ownerId: "owner1",
    });
    mockPrisma.growthEvent.delete.mockResolvedValue({});

    await service.deleteEvent("owner1", "evt1");
    expect(mockPrisma.growthEvent.delete).toHaveBeenCalledWith({
      where: { id: "evt1" },
    });
  });
});

// ─────────────────────────────────────────────
// createGrowthTimelineService — syncFromEntities 검증
// ─────────────────────────────────────────────

describe("createGrowthTimelineService — syncFromEntities 검증", () => {
  const now = new Date();
  const mockPrisma = {
    growthEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    skill: { findMany: jest.fn() },
    project: { findMany: jest.fn() },
    experience: { findMany: jest.fn() },
    resume: { findMany: jest.fn() },
    note: { findMany: jest.fn() },
    companyTarget: { findMany: jest.fn() },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createGrowthTimelineService({ prisma: mockPrisma as any });

  beforeEach(() => {
    jest.clearAllMocks();
    // 기존 이벤트 없음
    mockPrisma.growthEvent.findMany.mockResolvedValue([]);
    mockPrisma.growthEvent.create.mockResolvedValue({});
  });

  it("기존 엔티티가 없으면 0개 생성", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.experience.findMany.mockResolvedValue([]);
    mockPrisma.resume.findMany.mockResolvedValue([]);
    mockPrisma.note.findMany.mockResolvedValue([]);
    mockPrisma.companyTarget.findMany.mockResolvedValue([]);

    const result = await service.syncFromEntities("owner1");
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("기술 추가 시 SKILL_ADDED 이벤트 생성", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([
      { id: "s1", name: "TypeScript", createdAt: now },
    ]);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.experience.findMany.mockResolvedValue([]);
    mockPrisma.resume.findMany.mockResolvedValue([]);
    mockPrisma.note.findMany.mockResolvedValue([]);
    mockPrisma.companyTarget.findMany.mockResolvedValue([]);

    const result = await service.syncFromEntities("owner1");
    expect(result.created).toBe(1);
    expect(mockPrisma.growthEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "SKILL_ADDED",
          entityId: "s1",
        }),
      }),
    );
  });

  it("이미 동기화된 엔티티는 건너뜀", async () => {
    mockPrisma.growthEvent.findMany.mockResolvedValue([
      { entityId: "s1", type: "SKILL_ADDED" },
    ]);
    mockPrisma.skill.findMany.mockResolvedValue([
      { id: "s1", name: "TypeScript", createdAt: now },
    ]);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.experience.findMany.mockResolvedValue([]);
    mockPrisma.resume.findMany.mockResolvedValue([]);
    mockPrisma.note.findMany.mockResolvedValue([]);
    mockPrisma.companyTarget.findMany.mockResolvedValue([]);

    const result = await service.syncFromEntities("owner1");
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockPrisma.growthEvent.create).not.toHaveBeenCalled();
  });

  it("여러 엔티티 복합 동기화", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([
      { id: "s1", name: "React", createdAt: now },
    ]);
    mockPrisma.project.findMany.mockResolvedValue([
      { id: "p1", title: "PoReSt", createdAt: now },
    ]);
    mockPrisma.experience.findMany.mockResolvedValue([
      { id: "e1", company: "A사", role: "개발자", createdAt: now },
    ]);
    mockPrisma.resume.findMany.mockResolvedValue([]);
    mockPrisma.note.findMany.mockResolvedValue([
      { id: "n1", title: "학습 노트", createdAt: now },
    ]);
    mockPrisma.companyTarget.findMany.mockResolvedValue([]);

    const result = await service.syncFromEntities("owner1");
    expect(result.created).toBe(4);
    expect(result.skipped).toBe(0);
  });

  it("JOB_APPLIED 이벤트 생성 — appliedAt 사용", async () => {
    const appliedAt = new Date("2026-03-01");
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.experience.findMany.mockResolvedValue([]);
    mockPrisma.resume.findMany.mockResolvedValue([]);
    mockPrisma.note.findMany.mockResolvedValue([]);
    mockPrisma.companyTarget.findMany.mockResolvedValue([
      { id: "ct1", company: "B사", role: "FE", status: "APPLIED", appliedAt, createdAt: now },
    ]);

    const result = await service.syncFromEntities("owner1");
    expect(result.created).toBe(1);
    expect(mockPrisma.growthEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "JOB_APPLIED",
          occurredAt: appliedAt,
        }),
      }),
    );
  });
});

// ─────────────────────────────────────────────
// createGrowthTimelineService — getTimeline 검증
// ─────────────────────────────────────────────

describe("createGrowthTimelineService — getTimeline 검증", () => {
  const mockPrisma = {
    growthEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    skill: { findMany: jest.fn() },
    project: { findMany: jest.fn() },
    experience: { findMany: jest.fn() },
    resume: { findMany: jest.fn() },
    note: { findMany: jest.fn() },
    companyTarget: { findMany: jest.fn() },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createGrowthTimelineService({ prisma: mockPrisma as any });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("이벤트 없음 → 빈 타임라인", async () => {
    mockPrisma.growthEvent.count.mockResolvedValue(0);
    mockPrisma.growthEvent.findMany.mockResolvedValue([]);

    const result = await service.getTimeline("owner1", 30);
    expect(result.totalEvents).toBe(0);
    expect(result.recentEvents).toEqual([]);
    expect(result.heatmap.length).toBe(30);
    expect(result.typeDistribution).toEqual([]);
    expect(result.monthlySummary).toEqual([]);
  });

  it("이벤트 있음 → 히트맵/타입 분포/월별 요약 포함", async () => {
    const date1 = new Date("2026-03-10");
    const date2 = new Date("2026-03-10");
    const date3 = new Date("2026-03-12");

    mockPrisma.growthEvent.count.mockResolvedValue(3);
    // allEvents (range 내)
    mockPrisma.growthEvent.findMany
      .mockResolvedValueOnce([
        { type: "SKILL_ADDED", occurredAt: date1 },
        { type: "SKILL_ADDED", occurredAt: date2 },
        { type: "PROJECT_CREATED", occurredAt: date3 },
      ])
      // recentEvents
      .mockResolvedValueOnce([
        {
          id: "e3", type: "PROJECT_CREATED", title: "프로젝트",
          description: null, entityId: null, occurredAt: date3, createdAt: date3, ownerId: "o1",
        },
        {
          id: "e2", type: "SKILL_ADDED", title: "React",
          description: null, entityId: null, occurredAt: date2, createdAt: date2, ownerId: "o1",
        },
        {
          id: "e1", type: "SKILL_ADDED", title: "TS",
          description: null, entityId: null, occurredAt: date1, createdAt: date1, ownerId: "o1",
        },
      ]);

    const result = await service.getTimeline("owner1", 30);
    expect(result.totalEvents).toBe(3);
    expect(result.recentEvents).toHaveLength(3);

    // 히트맵에 3/10 날짜 = 2개 이벤트
    const march10 = result.heatmap.find((h) => h.date === "2026-03-10");
    expect(march10?.count).toBe(2);

    // 타입 분포
    expect(result.typeDistribution).toHaveLength(2);
    expect(result.typeDistribution[0].type).toBe("SKILL_ADDED");
    expect(result.typeDistribution[0].count).toBe(2);

    // 월별 요약
    expect(result.monthlySummary).toHaveLength(1);
    expect(result.monthlySummary[0].month).toBe("2026-03");
    expect(result.monthlySummary[0].count).toBe(3);
  });
});
