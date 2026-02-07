import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import { createPortfolioSettingsService } from "@/modules/portfolio-settings/implementation";
import { type PortfolioSettingsServicePrismaClient } from "@/modules/portfolio-settings/interface";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("portfolio settings service integration", () => {
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
    testFn: (
      service: ReturnType<typeof createPortfolioSettingsService>,
      tx: Prisma.TransactionClient,
    ) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createPortfolioSettingsService({
          prisma: tx as PortfolioSettingsServicePrismaClient,
        });
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
    return tx.user.create({
      data: {
        email: `owner-settings-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  it("최초 upsert 호출 시 포트폴리오 설정을 생성해야 한다", async () => {
    // 준비: 오너와 생성 입력값
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `create-${unique}`);

      // 실행: 설정 생성
      const created = await service.upsertPortfolioSettingsForOwner(owner.id, {
        publicSlug: `owner-${unique}`,
        displayName: "홍길동",
        links: [
          { label: "GitHub", url: "https://github.com/example", order: 2 },
          { label: "Blog", url: "https://example.com", order: 1 },
        ],
      });

      // 검증: 생성 결과와 정렬 확인
      expect(created.publicSlug).toBe(`owner-${unique}`);
      expect(created.links.map((link) => link.order)).toEqual([1, 2]);
      expect(created.links.map((link) => link.label)).toEqual(["Blog", "GitHub"]);
    });
  });

  it("기존 설정에 대한 부분 수정이 가능해야 한다", async () => {
    // 준비: 기존 설정을 먼저 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `update-${unique}`);
      const slug = `settings-update-${unique}`;

      await service.upsertPortfolioSettingsForOwner(owner.id, {
        publicSlug: slug,
        displayName: "기존 이름",
      });

      // 실행: 일부 필드만 수정한다.
      const updated = await service.upsertPortfolioSettingsForOwner(owner.id, {
        headline: "수정된 헤드라인",
        isPublic: false,
      });

      // 검증: 기존 값 유지 + 수정값 반영 확인
      expect(updated.publicSlug).toBe(slug);
      expect(updated.headline).toBe("수정된 헤드라인");
      expect(updated.isPublic).toBe(false);
    });
  });

  it("publicSlug가 중복되면 409 에러를 반환해야 한다", async () => {
    // 준비: 서로 다른 오너에 대해 설정을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `conflict-a-${unique}`);
      const ownerB = await createOwner(tx, `conflict-b-${unique}`);
      const duplicateSlug = `duplicate-settings-${unique}`;

      await service.upsertPortfolioSettingsForOwner(ownerA.id, {
        publicSlug: duplicateSlug,
      });
      await service.upsertPortfolioSettingsForOwner(ownerB.id, {
        publicSlug: `other-settings-${unique}`,
      });

      // 실행 및 검증: 중복 슬러그 수정 시도는 409여야 한다.
      await expect(
        service.upsertPortfolioSettingsForOwner(ownerB.id, {
          publicSlug: duplicateSlug,
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });
  });

  it("owner 스코프가 다르면 조회 결과는 null이어야 한다", async () => {
    // 준비: ownerA에만 설정을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `scope-a-${unique}`);
      const ownerB = await createOwner(tx, `scope-b-${unique}`);

      await service.upsertPortfolioSettingsForOwner(ownerA.id, {
        publicSlug: `scope-${unique}`,
      });

      // 실행: ownerB 기준으로 조회한다.
      const ownerBSettings = await service.getPortfolioSettingsForOwner(ownerB.id);

      // 검증: 다른 오너 데이터는 조회되지 않아야 한다.
      expect(ownerBSettings).toBeNull();
    });
  });

  it("links 필드가 전달되면 기존 링크를 교체해야 한다", async () => {
    // 준비: 기존 링크 2개를 가진 설정을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `links-${unique}`);

      await service.upsertPortfolioSettingsForOwner(owner.id, {
        publicSlug: `links-${unique}`,
        links: [
          { label: "Old-1", url: "https://old-one.example.com", order: 0 },
          { label: "Old-2", url: "https://old-two.example.com", order: 1 },
        ],
      });

      // 실행: 새로운 링크로 교체한다.
      const updated = await service.upsertPortfolioSettingsForOwner(owner.id, {
        links: [{ label: "New", url: "https://new.example.com", order: 3 }],
      });

      // 검증: 기존 링크는 제거되고 신규 링크만 남아야 한다.
      expect(updated.links).toHaveLength(1);
      expect(updated.links[0]?.label).toBe("New");
      expect(updated.links[0]?.url).toBe("https://new.example.com");
      expect(updated.links[0]?.order).toBe(3);
    });
  });
});
