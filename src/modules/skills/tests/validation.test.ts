import { createSkillsService, SkillServiceError, type SkillServicePrismaClient } from "@/modules/skills";

function createMockPrisma(): SkillServicePrismaClient {
  return {
    skill: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: "mock-id",
          name: data.name,
          category: data.category ?? null,
          level: data.level ?? null,
          order: data.order ?? 0,
          visibility: data.visibility ?? "PUBLIC",
          updatedAt: new Date(),
        }),
      ),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as SkillServicePrismaClient;
}

describe("skills validation", () => {
  let mockPrisma: SkillServicePrismaClient;
  let service: ReturnType<typeof createSkillsService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createSkillsService({ prisma: mockPrisma });
  });

  // A6: CreateSkillInput Zod 스키마 검증
  describe("CreateSkillInput 검증", () => {
    it("name이 빈 문자열이면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      await expect(service.createSkill("owner-1", { name: "" })).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("name이 50자를 초과하면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      const longName = "a".repeat(51);

      await expect(service.createSkill("owner-1", { name: longName })).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("category가 30자를 초과하면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      const longCategory = "c".repeat(31);

      await expect(
        service.createSkill("owner-1", { name: "Valid", category: longCategory }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("level이 범위(1~5)를 벗어나면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      await expect(
        service.createSkill("owner-1", { name: "Valid", level: 0 }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });

      await expect(
        service.createSkill("owner-1", { name: "Valid", level: 6 }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("order가 음수이면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      await expect(
        service.createSkill("owner-1", { name: "Valid", order: -1 }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("필수 필드(name)만 입력하면 성공해야 한다", async () => {
      const skill = await service.createSkill("owner-1", { name: "ValidSkill" });

      expect(skill.name).toBe("ValidSkill");
      expect(skill.category).toBeNull();
      expect(skill.level).toBeNull();
      expect(skill.order).toBe(0);
    });

    it("모든 선택 필드를 포함하면 성공해야 한다", async () => {
      const skill = await service.createSkill("owner-1", {
        name: "FullSkill",
        category: "Frontend",
        level: 4,
        order: 2,
      });

      expect(skill.name).toBe("FullSkill");
      expect(skill.category).toBe("Frontend");
      expect(skill.level).toBe(4);
      expect(skill.order).toBe(2);
    });
  });

  // A6: UpdateSkillInput Zod 스키마 검증
  describe("UpdateSkillInput 검증", () => {
    beforeEach(() => {
      // updateSkill은 findUnique가 기존 스킬을 반환해야 검증 단계에 도달
      (mockPrisma.skill.findUnique as jest.Mock).mockResolvedValue({
        id: "skill-1",
        ownerId: "owner-1",
      });
      (mockPrisma.skill.update as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({
          id: "skill-1",
          name: data.name ?? "Original",
          category: data.category ?? null,
          level: data.level ?? null,
          order: data.order ?? 0,
          visibility: data.visibility ?? "PUBLIC",
          updatedAt: new Date(),
        }),
      );
    });

    it("빈 객체이면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      await expect(service.updateSkill("owner-1", "skill-1", {})).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });

    it("name만 수정하면 성공해야 한다", async () => {
      const updated = await service.updateSkill("owner-1", "skill-1", { name: "Updated" });

      expect(updated.name).toBe("Updated");
    });

    it("level만 수정하면 성공해야 한다", async () => {
      const updated = await service.updateSkill("owner-1", "skill-1", { level: 5 });

      expect(updated.level).toBe(5);
    });
  });

  // A7: extractZodFieldErrors 간접 검증
  describe("extractZodFieldErrors (간접 검증)", () => {
    it("다중 필드 에러 시 fields에 모든 에러 필드가 포함되어야 한다", async () => {
      // name 빈 문자열 + level 범위 초과 → 두 필드 모두 에러
      const error = await service
        .createSkill("owner-1", { name: "", level: 99 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SkillServiceError);
      const serviceError = error as SkillServiceError;
      expect(serviceError.fields).toBeDefined();
      expect(serviceError.fields).toHaveProperty("name");
      expect(serviceError.fields).toHaveProperty("level");
    });

    it("에러 경로가 올바른 필드 이름으로 매핑되어야 한다", async () => {
      const error = await service
        .createSkill("owner-1", { name: "" })
        .catch((e: unknown) => e);

      const serviceError = error as SkillServiceError;
      expect(serviceError.fields).toBeDefined();
      expect(serviceError.fields!["name"]).toContain("비어 있을 수 없습니다");
    });
  });
});
