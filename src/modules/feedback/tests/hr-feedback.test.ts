// ─────────────────────────────────────────────
// T80-4: HR 피드백 LLM 테스트
// parseFeedbackItemsFromLLM 파서 + 서비스 LLM 통합
// ─────────────────────────────────────────────

import { parseFeedbackItemsFromLLM } from "@/modules/feedback/implementation";

describe("HR 피드백 LLM (T80-4)", () => {
  describe("parseFeedbackItemsFromLLM", () => {
    it("정상 JSON 배열을 파싱해야 한다", () => {
      const text = JSON.stringify([
        {
          severity: "WARNING",
          title: "헤드라인 보강",
          message: "헤드라인이 너무 일반적입니다.",
          suggestion: "구체적인 기술 스택과 강점을 포함하세요.",
        },
        {
          severity: "INFO",
          title: "링크 추가 권장",
          message: "GitHub 링크가 없습니다.",
          suggestion: "GitHub 프로필 링크를 추가하세요.",
        },
      ]);

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(2);
      expect(items[0].severity).toBe("WARNING");
      expect(items[0].title).toBe("헤드라인 보강");
      expect(items[0].message).toBe("헤드라인이 너무 일반적입니다.");
      expect(items[0].suggestion).toBe("구체적인 기술 스택과 강점을 포함하세요.");
      expect(items[0].evidenceJson).toEqual({ source: "gemini" });
      expect(items[1].severity).toBe("INFO");
    });

    it("마크다운 코드 블록 내 JSON을 파싱해야 한다", () => {
      const text = '```json\n[{"severity":"CRITICAL","title":"경력 누락","message":"경력 항목이 없습니다.","suggestion":"최소 1개 경력을 추가하세요."}]\n```';

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(1);
      expect(items[0].severity).toBe("CRITICAL");
      expect(items[0].title).toBe("경력 누락");
    });

    it("코드 블록 없이 마크다운에 둘러싸인 JSON도 파싱해야 한다", () => {
      const text =
        '분석 결과입니다:\n\n[{"severity":"WARNING","title":"요약 부족","message":"요약이 짧습니다."}]\n\n이상입니다.';

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(1);
      expect(items[0].severity).toBe("WARNING");
      expect(items[0].suggestion).toBeNull();
    });

    it("잘못된 severity를 INFO로 정규화해야 한다", () => {
      const text = JSON.stringify([
        { severity: "HIGH", title: "테스트", message: "메시지" },
        { severity: "critical", title: "대소문자", message: "소문자도 처리" },
        { severity: " WARNING ", title: "공백", message: "공백도 처리" },
      ]);

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(3);
      expect(items[0].severity).toBe("INFO");
      expect(items[1].severity).toBe("CRITICAL");
      expect(items[2].severity).toBe("WARNING");
    });

    it("빈 응답 시 빈 배열을 반환해야 한다", () => {
      expect(parseFeedbackItemsFromLLM("")).toEqual([]);
      expect(parseFeedbackItemsFromLLM("응답 없음")).toEqual([]);
    });

    it("잘못된 JSON 시 빈 배열을 반환해야 한다", () => {
      expect(parseFeedbackItemsFromLLM("[invalid json}")).toEqual([]);
    });

    it("JSON 배열이 아닌 객체 시 빈 배열을 반환해야 한다", () => {
      const text = JSON.stringify({ severity: "INFO", title: "단일 객체", message: "배열 아님" });
      expect(parseFeedbackItemsFromLLM(text)).toEqual([]);
    });

    it("필수 필드 누락 항목을 필터링해야 한다", () => {
      const text = JSON.stringify([
        { severity: "INFO", title: "정상", message: "정상 항목" },
        { severity: "INFO", title: "제목만" },
        { severity: "INFO", message: "메시지만" },
        { title: "심각도 없음", message: "메시지" },
        null,
        "문자열",
        42,
      ]);

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("정상");
    });

    it("title과 message 길이를 제한해야 한다", () => {
      const longTitle = "가".repeat(200);
      const longMessage = "나".repeat(1000);
      const text = JSON.stringify([
        {
          severity: "INFO",
          title: longTitle,
          message: longMessage,
          suggestion: "다".repeat(800),
        },
      ]);

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(1);
      expect(items[0].title.length).toBeLessThanOrEqual(100);
      expect(items[0].message.length).toBeLessThanOrEqual(500);
      expect(items[0].suggestion!.length).toBeLessThanOrEqual(500);
    });

    it("suggestion이 없는 항목은 null로 처리해야 한다", () => {
      const text = JSON.stringify([
        { severity: "INFO", title: "제안 없음", message: "메시지" },
      ]);

      const items = parseFeedbackItemsFromLLM(text);

      expect(items).toHaveLength(1);
      expect(items[0].suggestion).toBeNull();
    });

    it("빈 배열 응답을 정상 처리해야 한다", () => {
      const items = parseFeedbackItemsFromLLM("[]");
      expect(items).toEqual([]);
    });
  });
});
