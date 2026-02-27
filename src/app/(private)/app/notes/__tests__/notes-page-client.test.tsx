/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  SerializedOwnerNoteListItemDto,
  SerializedOwnerNotebookDto,
} from "@/app/(private)/app/_lib/server-serializers";
import { NotesPageClient } from "@/app/(private)/app/notes/NotesPageClient";

const toast = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("@/components/ui/useToast", () => ({
  useToast: () => toast,
}));

const NETWORK_ERROR_MESSAGE = "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

const INITIAL_NOTEBOOKS: SerializedOwnerNotebookDto[] = [
  {
    id: "notebook-1",
    name: "노트북 1",
    description: null,
    noteCount: 0,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

const INITIAL_NOTES: SerializedOwnerNoteListItemDto[] = [
  {
    id: "note-1",
    notebookId: "notebook-1",
    visibility: "PRIVATE",
    title: "노트 1",
    summary: "요약",
    tags: [],
    updatedAt: "2026-02-27T00:00:00.000Z",
    notebook: {
      id: "notebook-1",
      name: "노트북 1",
    },
  },
];

function buildMockFetchResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

describe("Test-M6-03 NotesPageClient", () => {
  beforeEach(() => {
    toast.info.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("노트북 생성 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NotesPageClient initialNotes={INITIAL_NOTES} initialNotebooks={INITIAL_NOTEBOOKS} />);

    fireEvent.change(screen.getByPlaceholderText("예: 백엔드 자료구조"), {
      target: { value: "새 노트북" },
    });
    fireEvent.click(screen.getByRole("button", { name: "노트북 생성" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("생성 중...")).not.toBeInTheDocument();
  });

  it("노트 생성 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NotesPageClient initialNotes={INITIAL_NOTES} initialNotebooks={INITIAL_NOTEBOOKS} />);

    fireEvent.change(screen.getByPlaceholderText("노트 제목"), {
      target: { value: "실패 테스트 노트" },
    });
    fireEvent.change(screen.getByPlaceholderText("노트 본문 (Markdown)"), {
      target: { value: "본문" },
    });
    fireEvent.click(screen.getByRole("button", { name: "노트 저장" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("저장 중...")).not.toBeInTheDocument();
  });

  it("노트북 삭제 후 목록 재조회 API 실패 시 로딩을 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(buildMockFetchResponse({ data: { id: "notebook-1" } }))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(buildMockFetchResponse({ data: INITIAL_NOTEBOOKS }));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NotesPageClient initialNotes={INITIAL_NOTES} initialNotebooks={INITIAL_NOTEBOOKS} />);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    expect(screen.queryByText("노트 목록을 불러오는 중입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("삭제 중...")).not.toBeInTheDocument();
  });
});
