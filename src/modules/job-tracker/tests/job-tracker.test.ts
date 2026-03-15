import { CompanyTargetStatus } from "@prisma/client";
import {
  buildJdMatchPrompt,
  parseJdMatchResponse,
  JD_MATCH_SYSTEM_PROMPT,
} from "@/modules/job-tracker/implementation";
import { JobTrackerServiceError } from "@/modules/job-tracker/interface";

// ─────────────────────────────────────────────
// parseJdMatchResponse
// ─────────────────────────────────────────────

describe("parseJdMatchResponse", () => {
  it("정상 JSON 응답 파싱", () => {
    const response = JSON.stringify({
      score: 75,
      matchedSkills: ["TypeScript", "React"],
      gaps: ["Kubernetes 경험 부족"],
      summary: "프론트엔드 스택 일치",
    });

    const result = parseJdMatchResponse(response);
    expect(result.score).toBe(75);
    expect(result.matchedSkills).toEqual(["TypeScript", "React"]);
    expect(result.gaps).toEqual(["Kubernetes 경험 부족"]);
    expect(result.summary).toBe("프론트엔드 스택 일치");
  });

  it("코드 블록 감싼 JSON 추출", () => {
    const response = `분석 결과입니다:
\`\`\`json
{
  "score": 80,
  "matchedSkills": ["Next.js"],
  "gaps": [],
  "summary": "좋은 매칭"
}
\`\`\`
위와 같습니다.`;

    const result = parseJdMatchResponse(response);
    expect(result.score).toBe(80);
    expect(result.matchedSkills).toEqual(["Next.js"]);
    expect(result.gaps).toEqual([]);
  });

  it("score 범위 보정 (100 초과 → 100)", () => {
    const response = JSON.stringify({
      score: 150,
      matchedSkills: [],
      gaps: [],
      summary: "test",
    });

    const result = parseJdMatchResponse(response);
    expect(result.score).toBe(100);
  });

  it("score 범위 보정 (음수 → 0)", () => {
    const response = JSON.stringify({
      score: -10,
      matchedSkills: [],
      gaps: [],
      summary: "test",
    });

    const result = parseJdMatchResponse(response);
    expect(result.score).toBe(0);
  });

  it("matchedSkills 최대 10개 제한", () => {
    const skills = Array.from({ length: 15 }, (_, i) => `Skill${i}`);
    const response = JSON.stringify({
      score: 50,
      matchedSkills: skills,
      gaps: [],
      summary: "test",
    });

    const result = parseJdMatchResponse(response);
    expect(result.matchedSkills).toHaveLength(10);
  });

  it("gaps 최대 5개 제한", () => {
    const gaps = Array.from({ length: 8 }, (_, i) => `Gap${i}`);
    const response = JSON.stringify({
      score: 50,
      matchedSkills: [],
      gaps,
      summary: "test",
    });

    const result = parseJdMatchResponse(response);
    expect(result.gaps).toHaveLength(5);
  });

  it("JSON 파싱 실패 시 기본값 반환", () => {
    const result = parseJdMatchResponse("이건 JSON이 아닙니다.");
    expect(result.score).toBe(0);
    expect(result.gaps).toContain("AI 분석 결과를 파싱할 수 없습니다.");
  });

  it("빈 문자열 입력 시 기본값 반환", () => {
    const result = parseJdMatchResponse("");
    expect(result.score).toBe(0);
    expect(result.summary).toBe("분석 실패");
  });

  it("잘못된 JSON 구조 시 안전 처리", () => {
    const response = JSON.stringify({
      score: "문자열",
      matchedSkills: "배열아님",
      gaps: null,
      summary: 123,
    });

    const result = parseJdMatchResponse(response);
    expect(result.score).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.gaps).toEqual([]);
    expect(result.summary).toBe("분석 완료");
  });

  it("summary 500자 초과 시 절삭", () => {
    const longSummary = "A".repeat(600);
    const response = JSON.stringify({
      score: 50,
      matchedSkills: [],
      gaps: [],
      summary: longSummary,
    });

    const result = parseJdMatchResponse(response);
    expect(result.summary).toHaveLength(500);
  });
});

// ─────────────────────────────────────────────
// buildJdMatchPrompt
// ─────────────────────────────────────────────

describe("buildJdMatchPrompt", () => {
  it("기술 + 경력 포함 프롬프트 빌드", () => {
    const prompt = buildJdMatchPrompt(
      "React 개발자 채용",
      [
        { name: "TypeScript", category: "Language" },
        { name: "React", category: "Frontend" },
      ],
      [
        {
          company: "A사",
          role: "프론트엔드",
          techTags: ["React", "Next.js"],
          summary: "프론트엔드 개발",
          isCurrent: true,
        },
      ],
    );

    expect(prompt).toContain("React 개발자 채용");
    expect(prompt).toContain("TypeScript (Language)");
    expect(prompt).toContain("A사 / 프론트엔드");
    expect(prompt).toContain("[재직 중]");
  });

  it("기술/경력 없을 때 기본 메시지", () => {
    const prompt = buildJdMatchPrompt("JD 내용", [], []);

    expect(prompt).toContain("(등록된 기술 없음)");
    expect(prompt).toContain("(등록된 경력 없음)");
  });

  it("JD 10000자 초과 시 절삭", () => {
    const longJd = "X".repeat(15000);
    const prompt = buildJdMatchPrompt(longJd, [], []);

    // JD 부분이 10000자로 잘림
    expect(prompt.length).toBeLessThan(15000 + 200);
  });

  it("카테고리 없는 기술 처리", () => {
    const prompt = buildJdMatchPrompt(
      "JD",
      [{ name: "Docker", category: null }],
      [],
    );

    expect(prompt).toContain("- Docker");
    expect(prompt).not.toContain("(null)");
  });

  it("경력 techTags 포함", () => {
    const prompt = buildJdMatchPrompt(
      "JD",
      [],
      [
        {
          company: "B사",
          role: "백엔드",
          techTags: ["Java", "Spring"],
          summary: null,
          isCurrent: false,
        },
      ],
    );

    expect(prompt).toContain("기술: Java, Spring");
    expect(prompt).not.toContain("[재직 중]");
  });
});

// ─────────────────────────────────────────────
// JD_MATCH_SYSTEM_PROMPT
// ─────────────────────────────────────────────

describe("JD_MATCH_SYSTEM_PROMPT", () => {
  it("한국어 프롬프트 포함", () => {
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("한국어");
  });

  it("커리어 컨설턴트 페르소나 포함", () => {
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("커리어 컨설턴트");
  });

  it("JSON 출력 형식 명시", () => {
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("JSON");
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("score");
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("matchedSkills");
    expect(JD_MATCH_SYSTEM_PROMPT).toContain("gaps");
  });
});

// ─────────────────────────────────────────────
// JobTrackerServiceError
// ─────────────────────────────────────────────

describe("JobTrackerServiceError", () => {
  it("에러 코드 + 상태 코드 생성", () => {
    const error = new JobTrackerServiceError("NOT_FOUND", 404, "카드를 찾을 수 없습니다.");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.message).toBe("카드를 찾을 수 없습니다.");
    expect(error.fields).toBeUndefined();
  });

  it("필드 에러 포함 생성", () => {
    const error = new JobTrackerServiceError(
      "VALIDATION_ERROR",
      422,
      "입력값 오류",
      { status: "상태 값이 올바르지 않습니다." },
    );
    expect(error.fields).toEqual({ status: "상태 값이 올바르지 않습니다." });
  });

  it("isJobTrackerServiceError 타입 가드 동작", () => {
    const { isJobTrackerServiceError } = jest.requireActual<typeof import("@/modules/job-tracker/interface")>("@/modules/job-tracker/interface");
    const error = new JobTrackerServiceError("FORBIDDEN", 403, "권한 없음");
    expect(isJobTrackerServiceError(error)).toBe(true);
    expect(isJobTrackerServiceError(new Error("일반 에러"))).toBe(false);
    expect(isJobTrackerServiceError(null)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// STATUS_ORDER 관련
// ─────────────────────────────────────────────

describe("CompanyTargetStatus", () => {
  it("전체 상태 6개 정의", () => {
    const statuses = Object.values(CompanyTargetStatus);
    expect(statuses).toHaveLength(6);
    expect(statuses).toContain("INTERESTED");
    expect(statuses).toContain("APPLIED");
    expect(statuses).toContain("INTERVIEWING");
    expect(statuses).toContain("OFFER");
    expect(statuses).toContain("REJECTED");
    expect(statuses).toContain("ARCHIVED");
  });
});
