/**
 * T80-5: AI 이력서 초안 생성 — 단위 테스트
 */
import {
  parseResumeDraftInput,
  buildResumeDraftPrompt,
  parseResumeDraftResponse,
  buildFallbackResumeDraft,
  generateDraftTitle,
  RESUME_DRAFT_SYSTEM_PROMPT,
} from "@/modules/resumes/implementation";
import { ResumeServiceError } from "@/modules/resumes/interface";
import { GeminiClientError } from "@/modules/gemini";

// ─── 테스트 데이터 ───

const mockExperiences = [
  {
    id: "exp-1",
    company: "A사",
    role: "백엔드 개발자",
    startDate: new Date("2022-01-01"),
    endDate: null,
    isCurrent: true,
    summary: "주요 API 서비스 개발",
    bulletsJson: ["REST API 설계", "마이크로서비스 전환"],
    metricsJson: { "응답 속도": "-40%", "가용성": "99.9%" },
    techTags: ["Node.js", "TypeScript", "PostgreSQL"],
    visibility: "PUBLIC",
    isFeatured: true,
  },
  {
    id: "exp-2",
    company: "B사",
    role: "풀스택 개발자",
    startDate: new Date("2020-03-01"),
    endDate: new Date("2021-12-31"),
    isCurrent: false,
    summary: "사내 관리 시스템 구축",
    bulletsJson: ["관리자 대시보드 개발"],
    metricsJson: { "업무 효율": "+25%" },
    techTags: ["React", "Express", "MySQL"],
    visibility: "PUBLIC",
    isFeatured: false,
  },
  {
    id: "exp-3",
    company: "C사",
    role: "인턴",
    startDate: new Date("2019-06-01"),
    endDate: new Date("2019-08-31"),
    isCurrent: false,
    summary: null,
    bulletsJson: null,
    metricsJson: null,
    techTags: [],
    visibility: "PRIVATE",
    isFeatured: false,
  },
];

const mockSkills = [
  { name: "TypeScript", category: "Language" },
  { name: "React", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
];

// ─── parseResumeDraftInput ───

describe("parseResumeDraftInput", () => {
  it("정상 입력을 파싱한다", () => {
    const result = parseResumeDraftInput({
      targetCompany: "네이버",
      targetRole: "백엔드 개발자",
      level: "시니어",
      jobDescription: "Node.js 경력자 우대",
    });

    expect(result.targetCompany).toBe("네이버");
    expect(result.targetRole).toBe("백엔드 개발자");
    expect(result.level).toBe("시니어");
    expect(result.jobDescription).toBe("Node.js 경력자 우대");
  });

  it("빈 객체를 파싱한다 (모든 필드 선택적)", () => {
    const result = parseResumeDraftInput({});
    expect(result.targetCompany).toBeUndefined();
    expect(result.targetRole).toBeUndefined();
  });

  it("빈 문자열은 null로 변환한다", () => {
    const result = parseResumeDraftInput({
      targetCompany: "  ",
      targetRole: "",
    });
    expect(result.targetCompany).toBeNull();
    expect(result.targetRole).toBeNull();
  });

  it("회사명 120자 초과 시 에러", () => {
    expect(() =>
      parseResumeDraftInput({ targetCompany: "a".repeat(121) }),
    ).toThrow(ResumeServiceError);
  });

  it("JD 5000자 초과 시 에러", () => {
    expect(() =>
      parseResumeDraftInput({ jobDescription: "a".repeat(5001) }),
    ).toThrow(ResumeServiceError);
  });
});

// ─── buildResumeDraftPrompt ───

describe("buildResumeDraftPrompt", () => {
  it("경력과 기술 스택을 프롬프트에 포함한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, mockSkills, {
      targetCompany: "네이버",
      targetRole: "백엔드",
    });

    expect(prompt).toContain("네이버");
    expect(prompt).toContain("백엔드");
    expect(prompt).toContain("A사");
    expect(prompt).toContain("B사");
    expect(prompt).toContain("C사");
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("selectedExperiences");
  });

  it("JD가 있으면 채용 공고 섹션을 포함한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, mockSkills, {
      jobDescription: "React + Node.js 풀스택 개발자",
    });

    expect(prompt).toContain("채용 공고 (JD)");
    expect(prompt).toContain("React + Node.js 풀스택 개발자");
  });

  it("JD가 없으면 채용 공고 섹션을 생략한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, mockSkills, {});

    expect(prompt).not.toContain("채용 공고 (JD)");
  });

  it("기술이 없으면 '기술 정보 없음'을 표시한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, [], {});

    expect(prompt).toContain("기술 정보 없음");
  });

  it("경력의 bullets와 metrics를 포함한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, mockSkills, {});

    expect(prompt).toContain("REST API 설계");
    expect(prompt).toContain("응답 속도");
    expect(prompt).toContain("-40%");
  });

  it("날짜를 YYYY-MM 형식으로 표시한다", () => {
    const prompt = buildResumeDraftPrompt(mockExperiences, mockSkills, {});

    expect(prompt).toContain("2022-01");
    expect(prompt).toContain("현재");
    expect(prompt).toContain("2020-03");
  });
});

// ─── parseResumeDraftResponse ───

describe("parseResumeDraftResponse", () => {
  it("정상 JSON 응답을 파싱한다", () => {
    const llmResponse = JSON.stringify({
      summaryMd: "10년차 백엔드 개발자입니다.",
      selectedExperiences: [
        {
          index: 1,
          overrideBullets: ["API 성능 40% 개선", "마이크로서비스 전환 주도"],
          overrideMetrics: { "응답 속도": "-40%" },
          overrideTechTags: ["Node.js", "TypeScript"],
          notes: "현재 재직 중, 주력 경력",
        },
        {
          index: 2,
          overrideBullets: ["관리 시스템 구축"],
          overrideMetrics: {},
          overrideTechTags: ["React"],
          notes: "풀스택 경험 강조",
        },
      ],
    });

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.summaryMd).toBe("10년차 백엔드 개발자입니다.");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].experienceId).toBe("exp-1");
    expect(result.items[0].overrideBullets).toEqual([
      "API 성능 40% 개선",
      "마이크로서비스 전환 주도",
    ]);
    expect(result.items[0].overrideTechTags).toEqual(["Node.js", "TypeScript"]);
    expect(result.items[1].experienceId).toBe("exp-2");
  });

  it("코드 블록으로 감싸진 JSON을 파싱한다", () => {
    const llmResponse =
      '```json\n{"summaryMd": "요약", "selectedExperiences": [{"index": 1, "overrideBullets": ["성과"]}]}\n```';

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.summaryMd).toBe("요약");
    expect(result.items).toHaveLength(1);
  });

  it("JSON 앞뒤에 텍스트가 있어도 파싱한다", () => {
    const llmResponse =
      '분석 결과입니다:\n{"summaryMd": "요약문", "selectedExperiences": []}\n이상입니다.';

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.summaryMd).toBe("요약문");
    expect(result.items).toHaveLength(0);
  });

  it("유효하지 않은 index는 무시한다", () => {
    const llmResponse = JSON.stringify({
      summaryMd: "요약",
      selectedExperiences: [
        { index: 0, overrideBullets: ["무시됨"] },
        { index: 99, overrideBullets: ["무시됨"] },
        { index: 1, overrideBullets: ["포함됨"] },
      ],
    });

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].experienceId).toBe("exp-1");
  });

  it("중복 experience index는 첫 번째만 포함한다", () => {
    const llmResponse = JSON.stringify({
      summaryMd: null,
      selectedExperiences: [
        { index: 1, overrideBullets: ["첫 번째"] },
        { index: 1, overrideBullets: ["두 번째 — 무시됨"] },
      ],
    });

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].overrideBullets).toEqual(["첫 번째"]);
  });

  it("summaryMd가 없으면 null", () => {
    const llmResponse = JSON.stringify({
      selectedExperiences: [{ index: 1 }],
    });

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.summaryMd).toBeNull();
  });

  it("빈 overrideBullets는 null로 변환한다", () => {
    const llmResponse = JSON.stringify({
      summaryMd: "요약",
      selectedExperiences: [
        { index: 1, overrideBullets: [], overrideMetrics: {} },
      ],
    });

    const result = parseResumeDraftResponse(llmResponse, mockExperiences);

    expect(result.items[0].overrideBullets).toBeNull();
    expect(result.items[0].overrideMetrics).toBeNull();
  });

  it("JSON 객체 없는 텍스트는 GeminiClientError", () => {
    expect(() =>
      parseResumeDraftResponse("분석을 완료했습니다.", mockExperiences),
    ).toThrow(GeminiClientError);
  });

  it("유효하지 않은 JSON은 GeminiClientError", () => {
    expect(() =>
      parseResumeDraftResponse("{invalid json}", mockExperiences),
    ).toThrow(GeminiClientError);
  });

  it("배열만 있는 응답에서 내부 객체를 추출한다", () => {
    // regex가 {…}를 추출하므로 배열 내부 첫 번째 객체가 파싱됨
    const result = parseResumeDraftResponse('[{"index": 1}]', mockExperiences);

    expect(result.summaryMd).toBeNull();
    expect(result.items).toHaveLength(0); // selectedExperiences 없음
  });
});

// ─── buildFallbackResumeDraft ───

describe("buildFallbackResumeDraft", () => {
  it("PUBLIC 경력만 선택한다", () => {
    const result = buildFallbackResumeDraft(mockExperiences);

    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => i.experienceId !== "exp-3")).toBe(true);
  });

  it("featured 경력을 우선 배치한다", () => {
    const result = buildFallbackResumeDraft(mockExperiences);

    expect(result.items[0].experienceId).toBe("exp-1");
  });

  it("summaryMd는 null이다", () => {
    const result = buildFallbackResumeDraft(mockExperiences);

    expect(result.summaryMd).toBeNull();
  });

  it("override 값은 모두 null/빈 배열이다", () => {
    const result = buildFallbackResumeDraft(mockExperiences);

    for (const item of result.items) {
      expect(item.overrideBullets).toBeNull();
      expect(item.overrideMetrics).toBeNull();
      expect(item.overrideTechTags).toEqual([]);
      expect(item.notes).toBeNull();
    }
  });

  it("최대 5개까지 선택한다", () => {
    const manyExperiences = Array.from({ length: 10 }, (_, i) => ({
      ...mockExperiences[0],
      id: `exp-${i}`,
      isFeatured: false,
    }));

    const result = buildFallbackResumeDraft(manyExperiences);

    expect(result.items.length).toBeLessThanOrEqual(5);
  });
});

// ─── generateDraftTitle ───

describe("generateDraftTitle", () => {
  it("회사+직무가 있으면 조합한다", () => {
    expect(generateDraftTitle({ targetCompany: "네이버", targetRole: "백엔드" })).toBe(
      "네이버 백엔드 AI 초안",
    );
  });

  it("회사만 있으면 회사명 AI 초안", () => {
    expect(generateDraftTitle({ targetCompany: "카카오" })).toBe("카카오 AI 초안");
  });

  it("아무것도 없으면 기본 제목", () => {
    expect(generateDraftTitle({})).toBe("AI 이력서 초안");
  });
});

// ─── 시스템 프롬프트 ───

describe("RESUME_DRAFT_SYSTEM_PROMPT", () => {
  it("한국어 응답 지시를 포함한다", () => {
    expect(RESUME_DRAFT_SYSTEM_PROMPT).toContain("한국어");
  });

  it("이력서 작성 전문가 페르소나를 포함한다", () => {
    expect(RESUME_DRAFT_SYSTEM_PROMPT).toContain("이력서 작성 전문");
  });

  it("IT 업계 경력을 포함한다", () => {
    expect(RESUME_DRAFT_SYSTEM_PROMPT).toContain("IT 업계");
  });
});
