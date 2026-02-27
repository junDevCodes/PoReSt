/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SerializedOwnerProjectDto } from "@/app/(private)/app/_lib/server-serializers";
import { ProjectsPageClient } from "@/app/(private)/app/projects/ProjectsPageClient";

const toast = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("@/components/ui/useToast", () => ({
  useToast: () => toast,
}));

const NETWORK_ERROR_MESSAGE = "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

const INITIAL_PROJECTS: SerializedOwnerProjectDto[] = [
  {
    id: "project-1",
    slug: "project-1",
    title: "프로젝트 1",
    subtitle: null,
    description: null,
    contentMd: "내용",
    techStack: [],
    repoUrl: null,
    demoUrl: null,
    thumbnailUrl: null,
    visibility: "PUBLIC",
    isFeatured: false,
    order: 0,
    highlightsJson: null,
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

describe("Test-M6-03 ProjectsPageClient", () => {
  beforeEach(() => {
    toast.info.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("삭제 후 목록 재조회 API 실패 시 로딩을 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(buildMockFetchResponse({ data: { id: "project-1" } }))
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ProjectsPageClient initialProjects={INITIAL_PROJECTS} />);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(screen.getAllByRole("button", { name: "삭제" }).at(-1) as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("프로젝트 목록을 불러오는 중입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("처리 중...")).not.toBeInTheDocument();
  });
});
