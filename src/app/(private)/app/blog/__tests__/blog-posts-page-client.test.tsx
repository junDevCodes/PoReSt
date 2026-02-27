/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SerializedOwnerBlogPostListItemDto } from "@/app/(private)/app/_lib/server-serializers";
import { BlogPostsPageClient } from "@/app/(private)/app/blog/BlogPostsPageClient";

const toast = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("@/components/ui/useToast", () => ({
  useToast: () => toast,
}));

const NETWORK_ERROR_MESSAGE = "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

const INITIAL_POSTS: SerializedOwnerBlogPostListItemDto[] = [
  {
    id: "blog-1",
    status: "DRAFT",
    visibility: "PRIVATE",
    title: "블로그 글 1",
    summary: "요약",
    tags: ["test"],
    lastLintedAt: null,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

function buildMockFetchResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

describe("Test-M6-03 BlogPostsPageClient", () => {
  beforeEach(() => {
    toast.info.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("삭제 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<BlogPostsPageClient initialPosts={INITIAL_POSTS} />);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(screen.getAllByRole("button", { name: "삭제" }).at(-1) as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("삭제 중...")).not.toBeInTheDocument();
  });

  it("Lint 실행 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<BlogPostsPageClient initialPosts={INITIAL_POSTS} />);

    fireEvent.click(screen.getByRole("button", { name: "Lint 실행" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("Lint 실행 중...")).not.toBeInTheDocument();
  });

  it("삭제 후 목록 재조회 API 실패 시 로딩을 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(buildMockFetchResponse({ data: { id: "blog-1" } }))
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<BlogPostsPageClient initialPosts={INITIAL_POSTS} />);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(screen.getAllByRole("button", { name: "삭제" }).at(-1) as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("글 목록을 불러오는 중입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("삭제 중...")).not.toBeInTheDocument();
  });
});
