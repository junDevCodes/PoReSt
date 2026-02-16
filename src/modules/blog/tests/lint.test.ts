import { runBlogLint } from "@/modules/blog/lint";

describe("blog lint", () => {
  it("45자를 초과하는 긴 문장을 검출해야 한다", () => {
    const result = runBlogLint(
      "이 문장은 블로그 린트의 긴 문장 규칙을 검증하기 위해 충분히 길고 장황하게 작성된 예시 문장입니다.",
    );

    expect(result.issues.some((issue) => issue.ruleId === "LONG_SENTENCE")).toBe(true);
  });

  it("반복 표현 과다를 검출해야 한다", () => {
    const result = runBlogLint("테스트 코드 테스트 코드 테스트 코드 테스트 코드 확인");

    expect(result.issues.some((issue) => issue.ruleId === "REPEATED_EXPRESSION")).toBe(true);
  });

  it("모호 표현 밀도가 높으면 경고를 반환해야 한다", () => {
    const result = runBlogLint(
      "이 방식은 아마 맞는 것 같다. 결과도 느낌상 괜찮은 것 같다. 어쩌면 될지도 모르겠다.",
    );

    expect(result.issues.some((issue) => issue.ruleId === "AMBIGUOUS_EXPRESSION_DENSITY")).toBe(true);
  });

  it("근거 링크 없이 단정 표현이 있으면 경고를 반환해야 한다", () => {
    const result = runBlogLint("이 방법은 반드시 성공한다. 이 선택은 무조건 최고의 성능을 보장한다.");

    expect(result.issues.some((issue) => issue.ruleId === "UNSUPPORTED_ASSERTION")).toBe(true);
  });

  it("문단 길이가 과도하면 경고를 반환해야 한다", () => {
    const longParagraph = "문단 길이 검증을 위한 테스트 텍스트입니다. ".repeat(12);
    const result = runBlogLint(longParagraph);

    expect(result.issues.some((issue) => issue.ruleId === "LONG_PARAGRAPH")).toBe(true);
  });

  it("동일 수치를 서로 다른 단위 표기로 혼용하면 경고를 반환해야 한다", () => {
    const result = runBlogLint("전환율은 30%까지 상승했다. 동일 지표를 보고서에는 30 퍼센트라고도 표현했다.");

    expect(result.issues.some((issue) => issue.ruleId === "UNIT_NUMBER_INCONSISTENCY")).toBe(true);
  });

  it("코드 블록만 있고 설명이 부족하면 경고를 반환해야 한다", () => {
    const result = runBlogLint("```ts\nconst value = 1;\nconsole.log(value);\n```\n\n적용.");

    expect(result.issues.some((issue) => issue.ruleId === "CODE_BLOCK_WITHOUT_EXPLANATION")).toBe(true);
  });

  it("금칙어가 포함되면 경고를 반환해야 한다", () => {
    const result = runBlogLint("이 방법은 충격적인 성능을 보여줍니다. 무조건 구매하세요.");

    expect(result.issues.some((issue) => issue.ruleId === "FORBIDDEN_WORD")).toBe(true);
  });

  it("제목과 본문 주제가 어긋나면 경고를 반환해야 한다", () => {
    const result = runBlogLint("# React 성능 최적화\n\n파이썬 데이터 분석 기초와 판다스 사용법을 설명합니다.");

    expect(result.issues.some((issue) => issue.ruleId === "TITLE_BODY_MISMATCH")).toBe(true);
  });

  it("헤딩 레벨을 건너뛰면 경고를 반환해야 한다", () => {
    const result = runBlogLint("# 개요\n\n### 세부 내용\n\n본문입니다.");

    expect(result.issues.some((issue) => issue.ruleId === "HEADING_LEVEL_JUMP")).toBe(true);
  });
});
