import { CoverLetterServiceError } from "@/modules/cover-letters/interface";
import {
  createCoverLettersService,
  buildCoverLetterPrompt,
  COVER_LETTER_SYSTEM_PROMPT,
} from "@/modules/cover-letters/implementation";
import type { SimilarCoverLetterDto } from "@/modules/cover-letter-embeddings/interface";

// ─── Mock Prisma ───

function createMockPrisma() {
  return {
    coverLetter: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    coverLetterEmbedding: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    experience: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    skill: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  } as unknown as Parameters<typeof createCoverLettersService>[0]["prisma"];
}

// ─── 테스트 데이터 ───

const NOW = new Date("2026-03-19T12:00:00.000Z");

const mockCoverLetter = {
  id: "cl-1",
  ownerId: "owner-1",
  status: "DRAFT" as const,
  isReference: false,
  title: "A사 프론트엔드 자기소개서",
  targetCompany: "A사",
  targetRole: "프론트엔드 개발자",
  contentMd: "## 지원 동기\n테스트 내용입니다.",
  resumeId: null,
  experienceId: null,
  createdAt: NOW,
  updatedAt: NOW,
};

// ─── CRUD 테스트 ───

describe("CoverLettersService", () => {
  describe("create", () => {
    it("유효한 입력으로 자기소개서를 생성해야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.create as jest.Mock).mockResolvedValue(mockCoverLetter);
      const service = createCoverLettersService({ prisma });

      const result = await service.create("owner-1", {
        title: "A사 프론트엔드 자기소개서",
        targetCompany: "A사",
        targetRole: "프론트엔드 개발자",
        contentMd: "## 지원 동기\n테스트 내용입니다.",
      });

      expect(result.id).toBe("cl-1");
      expect(result.title).toBe("A사 프론트엔드 자기소개서");
      expect(result.status).toBe("DRAFT");
      expect(prisma.coverLetter.create).toHaveBeenCalledTimes(1);
    });

    it("제목이 비어 있으면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createCoverLettersService({ prisma });

      await expect(
        service.create("owner-1", {
          title: "",
          contentMd: "테스트",
        }),
      ).rejects.toThrow(CoverLetterServiceError);
    });

    it("본문이 비어 있으면 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createCoverLettersService({ prisma });

      await expect(
        service.create("owner-1", {
          title: "테스트",
          contentMd: "",
        }),
      ).rejects.toThrow(CoverLetterServiceError);
    });

    it("isReference=true로 합격 자소서를 등록할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.create as jest.Mock).mockResolvedValue({
        ...mockCoverLetter,
        isReference: true,
        status: "FINAL",
      });
      const service = createCoverLettersService({ prisma });

      const result = await service.create("owner-1", {
        title: "합격 자소서",
        contentMd: "합격한 내용",
        isReference: true,
        status: "FINAL",
      });

      expect(result.isReference).toBe(true);
      expect(result.status).toBe("FINAL");
    });
  });

  describe("listForOwner", () => {
    it("소유자의 자기소개서 목록을 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cl-1",
          status: "DRAFT",
          isReference: false,
          title: "테스트",
          targetCompany: "A사",
          targetRole: "개발자",
          updatedAt: NOW,
        },
      ]);
      const service = createCoverLettersService({ prisma });

      const result = await service.listForOwner("owner-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("cl-1");
    });
  });

  describe("getForOwner", () => {
    it("존재하는 자기소개서를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue(mockCoverLetter);
      const service = createCoverLettersService({ prisma });

      const result = await service.getForOwner("owner-1", "cl-1");

      expect(result.id).toBe("cl-1");
      expect(result.contentMd).toContain("지원 동기");
    });

    it("존재하지 않는 자기소개서는 NOT_FOUND를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createCoverLettersService({ prisma });

      await expect(service.getForOwner("owner-1", "nonexist")).rejects.toThrow(
        CoverLetterServiceError,
      );
    });
  });

  describe("update", () => {
    it("자기소개서를 수정할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue(mockCoverLetter);
      (prisma.coverLetter.update as jest.Mock).mockResolvedValue({
        ...mockCoverLetter,
        title: "수정된 제목",
      });
      const service = createCoverLettersService({ prisma });

      const result = await service.update("owner-1", "cl-1", {
        title: "수정된 제목",
      });

      expect(result.title).toBe("수정된 제목");
    });

    it("빈 입력은 VALIDATION_ERROR를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue(mockCoverLetter);
      const service = createCoverLettersService({ prisma });

      await expect(
        service.update("owner-1", "cl-1", {}),
      ).rejects.toThrow(CoverLetterServiceError);
    });
  });

  describe("delete", () => {
    it("자기소개서를 삭제할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue(mockCoverLetter);
      (prisma.coverLetter.delete as jest.Mock).mockResolvedValue(mockCoverLetter);
      const service = createCoverLettersService({ prisma });

      const result = await service.delete("owner-1", "cl-1");

      expect(result.id).toBe("cl-1");
    });

    it("존재하지 않는 자기소개서 삭제는 NOT_FOUND를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createCoverLettersService({ prisma });

      await expect(
        service.delete("owner-1", "nonexist"),
      ).rejects.toThrow(CoverLetterServiceError);
    });
  });

  describe("toggleReference", () => {
    it("isReference를 토글할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue(mockCoverLetter);
      (prisma.coverLetter.update as jest.Mock).mockResolvedValue({
        ...mockCoverLetter,
        isReference: true,
      });
      const service = createCoverLettersService({ prisma });

      const result = await service.toggleReference("owner-1", "cl-1");

      expect(result.isReference).toBe(true);
      expect(prisma.coverLetter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isReference: true },
        }),
      );
    });
  });
});

// ─── 프롬프트 테스트 ───

describe("COVER_LETTER_SYSTEM_PROMPT", () => {
  it("한국어 응답 지시를 포함한다", () => {
    expect(COVER_LETTER_SYSTEM_PROMPT).toContain("한국어");
  });

  it("자기소개서 작성 전문가 페르소나를 포함한다", () => {
    expect(COVER_LETTER_SYSTEM_PROMPT).toContain("자기소개서 작성 전문");
  });

  it("IT 업계 경력을 포함한다", () => {
    expect(COVER_LETTER_SYSTEM_PROMPT).toContain("IT 업계");
  });
});

describe("buildCoverLetterPrompt", () => {
  const baseInput = {
    targetCompany: "네이버",
    targetRole: "프론트엔드 개발자",
    jobDescription: "React 경험 3년 이상",
    motivationHint: null,
  };

  const mockExperiences = [
    {
      company: "카카오",
      role: "웹 개발자",
      startDate: new Date("2023-01-01"),
      endDate: null,
      isCurrent: true,
      summary: "프론트엔드 서비스 개발",
      bulletsJson: ["React SPA 구축", "성능 최적화"],
      metricsJson: { LCP: "-30%" },
      techTags: ["React", "TypeScript"],
    },
  ];

  const mockSkills = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
  ];

  it("지원 정보를 포함해야 한다", () => {
    const prompt = buildCoverLetterPrompt(baseInput, [], [], []);

    expect(prompt).toContain("네이버");
    expect(prompt).toContain("프론트엔드 개발자");
  });

  it("채용 공고를 포함해야 한다", () => {
    const prompt = buildCoverLetterPrompt(baseInput, [], [], []);

    expect(prompt).toContain("채용 공고");
    expect(prompt).toContain("React 경험 3년 이상");
  });

  it("경력 정보를 포함해야 한다", () => {
    const prompt = buildCoverLetterPrompt(
      baseInput,
      mockExperiences,
      [],
      [],
    );

    expect(prompt).toContain("카카오");
    expect(prompt).toContain("웹 개발자");
    expect(prompt).toContain("React SPA 구축");
    expect(prompt).toContain("LCP: -30%");
  });

  it("보유 기술을 포함해야 한다", () => {
    const prompt = buildCoverLetterPrompt(
      baseInput,
      [],
      mockSkills,
      [],
    );

    expect(prompt).toContain("React");
    expect(prompt).toContain("TypeScript");
  });

  it("합격 자소서 예시를 포함해야 한다", () => {
    const refLetters: SimilarCoverLetterDto[] = [
      {
        coverLetterId: "ref-1",
        title: "네이버 합격 자소서",
        targetCompany: "네이버",
        targetRole: "FE",
        contentMd: "합격한 자기소개서 본문",
        score: 0.85,
      },
    ];

    const prompt = buildCoverLetterPrompt(
      baseInput,
      [],
      [],
      refLetters,
    );

    expect(prompt).toContain("합격 자소서 예시");
    expect(prompt).toContain("네이버 합격 자소서");
    expect(prompt).toContain("85%");
  });

  it("출력 형식 지시를 포함해야 한다", () => {
    const prompt = buildCoverLetterPrompt(baseInput, [], [], []);

    expect(prompt).toContain("지원 동기");
    expect(prompt).toContain("핵심 역량");
    expect(prompt).toContain("성장 계획");
    expect(prompt).toContain("입사 후 포부");
  });

  it("지원 동기 힌트를 포함해야 한다", () => {
    const inputWithHint = {
      ...baseInput,
      motivationHint: "네이버 검색 기술에 관심이 많습니다",
    };
    const prompt = buildCoverLetterPrompt(inputWithHint, [], [], []);

    expect(prompt).toContain("지원 동기 힌트");
    expect(prompt).toContain("네이버 검색 기술에 관심이 많습니다");
  });
});
