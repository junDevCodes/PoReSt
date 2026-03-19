import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import { createSkillsService, type SkillServicePrismaClient } from "@/modules/skills";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("skills service integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }

    prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: TEST_DATABASE_URL }),
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function runWithRollback(
    testFn: (service: ReturnType<typeof createSkillsService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createSkillsService({ prisma: tx as SkillServicePrismaClient });
        await testFn(service, tx);
        throw rollbackError;
      });
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK_ERROR_MESSAGE)) {
        throw error;
      }
    }
  }

  async function createOwner(tx: Prisma.TransactionClient, suffix: string) {
    const owner = await tx.user.create({
      data: {
        email: `owner-${suffix}@example.com`,
        isOwner: true,
      },
    });

    await tx.portfolioSettings.create({
      data: {
        ownerId: owner.id,
        publicSlug: `owner-${suffix}`,
        isPublic: true,
      },
    });

    return owner;
  }

  // A1: listSkillsForOwner
  describe("listSkillsForOwner", () => {
    it("스킬이 없는 사용자는 빈 배열을 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `empty-${unique}`);

        const skills = await service.listSkillsForOwner(owner.id);

        expect(skills).toEqual([]);
      });
    });

    it("category ASC → order ASC → name ASC 순서로 정렬되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `sort-${unique}`);

        // 역순으로 생성하여 정렬 검증
        await service.createSkill(owner.id, { name: "Zod", category: "Backend", order: 2 });
        await service.createSkill(owner.id, { name: "React", category: "Frontend", order: 1 });
        await service.createSkill(owner.id, { name: "Angular", category: "Frontend", order: 1 });
        await service.createSkill(owner.id, { name: "Next.js", category: "Frontend", order: 0 });
        await service.createSkill(owner.id, { name: "Express", category: "Backend", order: 1 });

        const skills = await service.listSkillsForOwner(owner.id);
        const names = skills.map((s) => s.name);

        // Backend(ASC) → Frontend(ASC), 각 카테고리 내 order ASC → name ASC
        expect(names).toEqual(["Express", "Zod", "Next.js", "Angular", "React"]);
      });
    });

    it("다중 카테고리가 올바르게 그룹핑되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `group-${unique}`);

        await service.createSkill(owner.id, { name: "Docker", category: "DevOps" });
        await service.createSkill(owner.id, { name: "PostgreSQL", category: "Database" });
        await service.createSkill(owner.id, { name: "TypeScript", category: "Frontend" });

        const skills = await service.listSkillsForOwner(owner.id);
        const categories = skills.map((s) => s.category);

        // Database → DevOps → Frontend (ASC 정렬)
        expect(categories).toEqual(["Database", "DevOps", "Frontend"]);
      });
    });
  });

  // A2: createSkill — 정상 케이스
  describe("createSkill — 정상 케이스", () => {
    it("모든 필드가 유효하면 생성에 성공해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `create-${unique}`);

        const skill = await service.createSkill(owner.id, {
          name: `TypeScript-${unique}`,
          category: "Frontend",
          level: 4,
          order: 1,
        });

        expect(skill).toMatchObject({
          name: `TypeScript-${unique}`,
          category: "Frontend",
          level: 4,
          order: 1,
        });
        expect(skill.id).toBeDefined();
      });
    });

    it("필수 필드(name)만 입력하면 기본값이 적용되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `defaults-${unique}`);

        const skill = await service.createSkill(owner.id, {
          name: `MinimalSkill-${unique}`,
        });

        expect(skill.order).toBe(0);
        expect(skill.category).toBeNull();
        expect(skill.level).toBeNull();
        expect(skill.visibility).toBe("PUBLIC");
      });
    });

    it("생성된 스킬이 소유자 목록에서 조회되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `bind-${unique}`);

        await service.createSkill(owner.id, { name: `Bound-${unique}` });

        const skills = await service.listSkillsForOwner(owner.id);

        expect(skills).toHaveLength(1);
        expect(skills[0]?.name).toBe(`Bound-${unique}`);
      });
    });
  });

  // A3: createSkill — 에러 케이스
  describe("createSkill — 에러 케이스", () => {
    it("name이 빈 문자열이면 422 검증 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `empty-name-${unique}`);

        await expect(service.createSkill(owner.id, { name: "" })).rejects.toMatchObject({
          code: "VALIDATION_ERROR",
          status: 422,
        });
      });
    });

    it("동일 이름의 스킬을 두 번 생성하면 409 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `dup-${unique}`);
        const name = `Duplicate-${unique}`;

        await service.createSkill(owner.id, { name });

        await expect(service.createSkill(owner.id, { name })).rejects.toMatchObject({
          code: "CONFLICT",
          status: 409,
        });
      });
    });

    it("다른 소유자의 동일 이름 스킬은 허용되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const ownerA = await createOwner(tx, `iso-a-${unique}`);
        const ownerB = await createOwner(tx, `iso-b-${unique}`);
        const name = `SharedName-${unique}`;

        await service.createSkill(ownerA.id, { name });
        const skillB = await service.createSkill(ownerB.id, { name });

        expect(skillB.name).toBe(name);
      });
    });
  });

  // A4: updateSkill
  describe("updateSkill", () => {
    it("name만 부분 업데이트할 수 있어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `upd-${unique}`);

        const skill = await service.createSkill(owner.id, {
          name: `Before-${unique}`,
          category: "Frontend",
          level: 3,
        });

        const updated = await service.updateSkill(owner.id, skill.id, {
          name: `After-${unique}`,
        });

        expect(updated.name).toBe(`After-${unique}`);
        expect(updated.category).toBe("Frontend");
        expect(updated.level).toBe(3);
      });
    });

    it("소유권이 다른 사용자가 수정하면 403 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const ownerA = await createOwner(tx, `upd-a-${unique}`);
        const ownerB = await createOwner(tx, `upd-b-${unique}`);

        const skill = await service.createSkill(ownerA.id, { name: `Protected-${unique}` });

        await expect(
          service.updateSkill(ownerB.id, skill.id, { name: "수정 시도" }),
        ).rejects.toMatchObject({
          code: "FORBIDDEN",
          status: 403,
        });
      });
    });

    it("존재하지 않는 스킬 ID로 수정하면 404 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `upd-nf-${unique}`);

        await expect(
          service.updateSkill(owner.id, "non-existent-id", { name: "수정 시도" }),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
          status: 404,
        });
      });
    });
  });

  // A5: deleteSkill
  describe("deleteSkill", () => {
    it("정상 삭제 후 목록에서 제외되어야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `del-${unique}`);

        const skill = await service.createSkill(owner.id, { name: `ToDelete-${unique}` });
        await service.deleteSkill(owner.id, skill.id);

        const skills = await service.listSkillsForOwner(owner.id);

        expect(skills).toEqual([]);
      });
    });

    it("소유권이 다른 사용자가 삭제하면 403 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const ownerA = await createOwner(tx, `del-a-${unique}`);
        const ownerB = await createOwner(tx, `del-b-${unique}`);

        const skill = await service.createSkill(ownerA.id, { name: `Protected-${unique}` });

        await expect(service.deleteSkill(ownerB.id, skill.id)).rejects.toMatchObject({
          code: "FORBIDDEN",
          status: 403,
        });
      });
    });

    it("존재하지 않는 스킬 ID로 삭제하면 404 에러를 반환해야 한다", async () => {
      await runWithRollback(async (service, tx) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const owner = await createOwner(tx, `del-nf-${unique}`);

        await expect(service.deleteSkill(owner.id, "non-existent-id")).rejects.toMatchObject({
          code: "NOT_FOUND",
          status: 404,
        });
      });
    });
  });
});
