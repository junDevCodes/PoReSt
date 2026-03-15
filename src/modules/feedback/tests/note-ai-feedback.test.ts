import {
  parseNoteFeedbackResponse,
  buildNoteFeedbackPrompt,
  NOTE_FEEDBACK_SYSTEM_PROMPT,
} from "@/modules/feedback/implementation";

describe("노트 AI 평가 (T80-3)", () => {
  // ─── parseNoteFeedbackResponse ───
  describe("parseNoteFeedbackResponse", () => {
    it("유효한 JSON 배열을 FeedbackItemDraft[]로 변환해야 한다", () => {
      const text = JSON.stringify([
        { severity: "WARNING", title: "태그 부족", message: "태그를 추가하세요.", suggestion: "2-5개 추천" },
        { severity: "INFO", title: "구조 양호", message: "논리적 흐름이 좋습니다.", suggestion: null },
      ]);

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(2);
      expect(items[0].severity).toBe("WARNING");
      expect(items[0].title).toBe("태그 부족");
      expect(items[0].message).toBe("태그를 추가하세요.");
      expect(items[0].suggestion).toBe("2-5개 추천");
      expect(items[0].evidenceJson).toEqual({ source: "gemini" });
      expect(items[1].severity).toBe("INFO");
      expect(items[1].suggestion).toBeNull();
    });

    it("코드 블록으로 감싸진 JSON을 파싱해야 한다", () => {
      const text =
        '```json\n[{"severity":"WARNING","title":"테스트","message":"메시지","suggestion":null}]\n```';

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].severity).toBe("WARNING");
      expect(items[0].title).toBe("테스트");
    });

    it("빈 배열 []은 빈 배열을 반환해야 한다", () => {
      const items = parseNoteFeedbackResponse("[]");
      expect(items).toHaveLength(0);
    });

    it("JSON 배열이 없는 텍스트는 에러를 던져야 한다", () => {
      expect(() => parseNoteFeedbackResponse("이것은 JSON이 아닙니다")).toThrow(
        "AI 응답에서 JSON 배열을 찾을 수 없습니다.",
      );
    });

    it("유효하지 않은 JSON은 에러를 던져야 한다", () => {
      expect(() => parseNoteFeedbackResponse("[{invalid json}]")).toThrow();
    });

    it("유효하지 않은 severity는 필터링해야 한다", () => {
      const text = JSON.stringify([
        { severity: "INVALID", title: "테스트", message: "메시지" },
        { severity: "WARNING", title: "유효", message: "유효한 항목" },
      ]);

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].severity).toBe("WARNING");
    });

    it("최대 5개까지만 반환해야 한다", () => {
      const text = JSON.stringify(
        Array.from({ length: 8 }, (_, i) => ({
          severity: "INFO",
          title: `항목 ${i + 1}`,
          message: `메시지 ${i + 1}`,
        })),
      );

      const items = parseNoteFeedbackResponse(text);
      expect(items).toHaveLength(5);
    });

    it("title 또는 message가 빈 문자열인 항목은 필터링해야 한다", () => {
      const text = JSON.stringify([
        { severity: "WARNING", title: "", message: "메시지" },
        { severity: "WARNING", title: "유효", message: "" },
        { severity: "WARNING", title: "정상", message: "정상 메시지" },
      ]);

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("정상");
    });

    it("suggestion이 없는 항목은 null로 처리해야 한다", () => {
      const text = JSON.stringify([
        { severity: "INFO", title: "테스트", message: "메시지" },
      ]);

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].suggestion).toBeNull();
    });

    it("CRITICAL severity도 유효하게 처리해야 한다", () => {
      const text = JSON.stringify([
        { severity: "CRITICAL", title: "심각한 오류", message: "핵심 내용 누락" },
      ]);

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].severity).toBe("CRITICAL");
    });

    it("JSON 앞뒤에 텍스트가 있어도 배열을 추출해야 한다", () => {
      const text =
        '분석 결과입니다:\n[{"severity":"INFO","title":"양호","message":"좋은 노트입니다."}]\n이상입니다.';

      const items = parseNoteFeedbackResponse(text);

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("양호");
    });
  });

  // ─── buildNoteFeedbackPrompt ───
  describe("buildNoteFeedbackPrompt", () => {
    it("노트 정보를 포함한 프롬프트를 생성해야 한다", () => {
      const prompt = buildNoteFeedbackPrompt({
        title: "테스트 노트",
        contentMd: "본문 내용입니다.",
        summary: "요약입니다.",
        tags: ["TypeScript", "React"],
      });

      expect(prompt).toContain("테스트 노트");
      expect(prompt).toContain("TypeScript, React");
      expect(prompt).toContain("요약입니다.");
      expect(prompt).toContain("본문 내용입니다.");
    });

    it("태그가 없으면 '없음'을 표시해야 한다", () => {
      const prompt = buildNoteFeedbackPrompt({
        title: "제목",
        contentMd: "내용",
        summary: null,
        tags: [],
      });

      expect(prompt).toContain("태그: 없음");
      expect(prompt).toContain("요약: 없음");
    });

    it("요약이 공백만 있으면 '없음'을 표시해야 한다", () => {
      const prompt = buildNoteFeedbackPrompt({
        title: "제목",
        contentMd: "내용",
        summary: "   ",
        tags: ["tag1"],
      });

      expect(prompt).toContain("요약: 없음");
    });
  });

  // ─── NOTE_FEEDBACK_SYSTEM_PROMPT ───
  describe("NOTE_FEEDBACK_SYSTEM_PROMPT", () => {
    it("평가 기준 5가지를 포함해야 한다", () => {
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("완성도");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("구조");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("근거");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("명확성");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("태그");
    });

    it("JSON 출력 형식 지시를 포함해야 한다", () => {
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("severity");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("JSON");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("CRITICAL");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("WARNING");
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("INFO");
    });

    it("최대 항목 수 제한을 포함해야 한다", () => {
      expect(NOTE_FEEDBACK_SYSTEM_PROMPT).toContain("5개");
    });
  });
});
