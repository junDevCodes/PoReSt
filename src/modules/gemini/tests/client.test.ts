import {
  createGeminiClient,
  getDefaultGeminiClient,
  resetDefaultGeminiClient,
  withGeminiFallback,
} from "@/modules/gemini/implementation";
import {
  GeminiClientError,
  isGeminiClientError,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_TEXT_MODEL,
} from "@/modules/gemini/interface";

// ─── @google/generative-ai SDK 모킹 ───
const mockEmbedContent = jest.fn();
const mockGenerateContent = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      embedContent: mockEmbedContent,
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe("Gemini 클라이언트 모듈", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDefaultGeminiClient();
  });

  // ─── 설정 확인 ───
  describe("isConfigured", () => {
    it("API 키가 있으면 true를 반환해야 한다", () => {
      const client = createGeminiClient({ apiKey: "test-api-key" });
      expect(client.isConfigured()).toBe(true);
    });

    it("API 키가 없으면 false를 반환해야 한다", () => {
      const client = createGeminiClient({ apiKey: undefined });
      expect(client.isConfigured()).toBe(false);
    });

    it("빈 문자열 API 키는 false를 반환해야 한다", () => {
      const client = createGeminiClient({ apiKey: "" });
      expect(client.isConfigured()).toBe(false);
    });
  });

  // ─── 임베딩 생성 ───
  describe("generateEmbedding", () => {
    it("API 키 미설정 시 NOT_CONFIGURED 에러를 던져야 한다", async () => {
      const client = createGeminiClient({ apiKey: undefined });

      await expect(client.generateEmbedding("테스트 텍스트")).rejects.toThrow(GeminiClientError);
      await expect(client.generateEmbedding("테스트 텍스트")).rejects.toMatchObject({
        code: "NOT_CONFIGURED",
        status: 503,
      });
    });

    it("빈 텍스트 입력 시 INVALID_INPUT 에러를 던져야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateEmbedding("")).rejects.toThrow(GeminiClientError);
      await expect(client.generateEmbedding("   ")).rejects.toMatchObject({
        code: "INVALID_INPUT",
        status: 422,
      });
    });

    it("너무 긴 텍스트 입력 시 INVALID_INPUT 에러를 던져야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });
      const longText = "가".repeat(10001);

      await expect(client.generateEmbedding(longText)).rejects.toMatchObject({
        code: "INVALID_INPUT",
        status: 422,
      });
    });

    it("성공적으로 임베딩을 생성해야 한다", async () => {
      const mockValues = Array.from({ length: 1536 }, (_, i) => i * 0.001);
      mockEmbedContent.mockResolvedValue({
        embedding: { values: mockValues },
      });

      const client = createGeminiClient({ apiKey: "test-key" });
      const result = await client.generateEmbedding("Prisma ORM 사용법");

      expect(result.embedding).toEqual(mockValues);
      expect(result.dimensions).toBe(1536);
      expect(mockEmbedContent).toHaveBeenCalledWith("Prisma ORM 사용법");
    });

    it("빈 임베딩 응답 시 EMPTY_RESPONSE 에러를 던져야 한다", async () => {
      mockEmbedContent.mockResolvedValue({
        embedding: { values: [] },
      });

      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateEmbedding("테스트")).rejects.toMatchObject({
        code: "EMPTY_RESPONSE",
        status: 502,
      });
    });

    it("SDK 에러 시 API_ERROR로 래핑해야 한다", async () => {
      mockEmbedContent.mockRejectedValue(new Error("Network timeout"));

      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateEmbedding("테스트")).rejects.toMatchObject({
        code: "API_ERROR",
        status: 502,
        retryable: true,
      });
    });

    it("Rate limit 에러를 RATE_LIMITED로 변환해야 한다", async () => {
      mockEmbedContent.mockRejectedValue(new Error("429 Resource has been exhausted"));

      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateEmbedding("테스트")).rejects.toMatchObject({
        code: "RATE_LIMITED",
        status: 429,
        retryable: true,
      });
    });
  });

  // ─── 텍스트 생성 ───
  describe("generateText", () => {
    it("API 키 미설정 시 NOT_CONFIGURED 에러를 던져야 한다", async () => {
      const client = createGeminiClient({ apiKey: undefined });

      await expect(client.generateText("테스트 프롬프트")).rejects.toMatchObject({
        code: "NOT_CONFIGURED",
        status: 503,
      });
    });

    it("빈 프롬프트 입력 시 INVALID_INPUT 에러를 던져야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateText("")).rejects.toMatchObject({
        code: "INVALID_INPUT",
        status: 422,
      });
    });

    it("성공적으로 텍스트를 생성해야 한다", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "AI가 생성한 피드백입니다.",
          usageMetadata: { totalTokenCount: 42 },
        },
      });

      const client = createGeminiClient({ apiKey: "test-key" });
      const result = await client.generateText("노트를 분석해주세요.");

      expect(result.text).toBe("AI가 생성한 피드백입니다.");
      expect(result.model).toBe(DEFAULT_TEXT_MODEL);
      expect(result.tokenCount).toBe(42);
    });

    it("커스텀 모델과 옵션을 지정할 수 있어야 한다", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "응답 텍스트",
          usageMetadata: { totalTokenCount: 10 },
        },
      });

      const client = createGeminiClient({ apiKey: "test-key" });
      await client.generateText("프롬프트", {
        model: "gemini-2.0-flash",
        systemPrompt: "당신은 HR 전문가입니다.",
        temperature: 0.3,
        maxOutputTokens: 4096,
      });

      expect(mockGenerateContent).toHaveBeenCalledWith("프롬프트");
    });

    it("빈 텍스트 응답 시 EMPTY_RESPONSE 에러를 던져야 한다", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "",
          usageMetadata: null,
        },
      });

      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateText("프롬프트")).rejects.toMatchObject({
        code: "EMPTY_RESPONSE",
        status: 502,
      });
    });

    it("SDK 에러 시 API_ERROR로 래핑해야 한다", async () => {
      mockGenerateContent.mockRejectedValue(new Error("Internal server error"));

      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(client.generateText("프롬프트")).rejects.toMatchObject({
        code: "API_ERROR",
        status: 502,
        retryable: true,
      });
    });
  });

  // ─── GeminiClientError ───
  describe("GeminiClientError", () => {
    it("isGeminiClientError 타입 가드가 올바르게 동작해야 한다", () => {
      const geminiError = new GeminiClientError("NOT_CONFIGURED", 503, "미설정");
      const normalError = new Error("일반 에러");

      expect(isGeminiClientError(geminiError)).toBe(true);
      expect(isGeminiClientError(normalError)).toBe(false);
      expect(isGeminiClientError(null)).toBe(false);
    });

    it("retryable 플래그를 올바르게 설정해야 한다", () => {
      const notConfigured = new GeminiClientError("NOT_CONFIGURED", 503, "미설정", false);
      const rateLimited = new GeminiClientError("RATE_LIMITED", 429, "한도 초과", true);

      expect(notConfigured.retryable).toBe(false);
      expect(rateLimited.retryable).toBe(true);
    });
  });

  // ─── 싱글턴 ───
  describe("getDefaultGeminiClient", () => {
    it("동일한 인스턴스를 반환해야 한다", () => {
      const client1 = getDefaultGeminiClient();
      const client2 = getDefaultGeminiClient();

      expect(client1).toBe(client2);
    });

    it("resetDefaultGeminiClient 후 새 인스턴스를 생성해야 한다", () => {
      const client1 = getDefaultGeminiClient();
      resetDefaultGeminiClient();
      const client2 = getDefaultGeminiClient();

      expect(client1).not.toBe(client2);
    });
  });

  // ─── withGeminiFallback ───
  describe("withGeminiFallback", () => {
    it("API 키 미설정 시 fallback 경로를 실행해야 한다", async () => {
      const client = createGeminiClient({ apiKey: undefined });
      const fallbackValue = [0.1, 0.2, 0.3];

      const { result, source } = await withGeminiFallback(
        client,
        async () => {
          throw new Error("이 경로는 실행되면 안 됨");
        },
        () => fallbackValue,
      );

      expect(result).toEqual(fallbackValue);
      expect(source).toBe("fallback");
    });

    it("API 키 설정 시 AI 경로를 실행해야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });
      // isConfigured를 true로 만들되 실제 API는 호출하지 않음
      const aiValue = [0.5, 0.6, 0.7];

      const { result, source } = await withGeminiFallback(
        client,
        async () => aiValue,
        () => [0.1, 0.2, 0.3],
      );

      expect(result).toEqual(aiValue);
      expect(source).toBe("gemini");
    });

    it("AI 경로 retryable 실패 시 fallback으로 전환해야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });
      const fallbackValue = "fallback 결과";

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { result, source } = await withGeminiFallback(
        client,
        async () => {
          throw new GeminiClientError("API_ERROR", 502, "네트워크 오류", true);
        },
        () => fallbackValue,
      );

      expect(result).toBe(fallbackValue);
      expect(source).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("AI 경로 non-retryable 에러 시 fallback 없이 에러를 전파해야 한다", async () => {
      const client = createGeminiClient({ apiKey: "test-key" });

      await expect(
        withGeminiFallback(
          client,
          async () => {
            throw new GeminiClientError("INVALID_INPUT", 422, "잘못된 입력", false);
          },
          () => "이 값은 반환되면 안 됨",
        ),
      ).rejects.toMatchObject({
        code: "INVALID_INPUT",
        status: 422,
      });
    });
  });

  // ─── 상수 확인 ───
  describe("상수", () => {
    it("기본 임베딩 모델이 text-embedding-004여야 한다", () => {
      expect(DEFAULT_EMBEDDING_MODEL).toBe("text-embedding-004");
    });

    it("기본 텍스트 모델이 gemini-2.0-flash여야 한다", () => {
      expect(DEFAULT_TEXT_MODEL).toBe("gemini-2.0-flash");
    });
  });
});
