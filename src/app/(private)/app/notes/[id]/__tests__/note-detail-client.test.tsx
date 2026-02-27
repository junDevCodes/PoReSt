/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type NoteEdgeDto } from "@/app/(private)/app/notes/_lib/detail";
import {
  NoteDetailClient,
  type OwnerNoteDetailView,
} from "@/app/(private)/app/notes/[id]/NoteDetailClient";

const NETWORK_ERROR_MESSAGE = "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

const NOTE: OwnerNoteDetailView = {
  id: "note-1",
  notebookId: "notebook-1",
  visibility: "PRIVATE",
  title: "기준 노트",
  contentMd: "본문",
  summary: "요약",
  tags: ["tag"],
  updatedAt: "2026-02-27T00:00:00.000Z",
  notebook: {
    id: "notebook-1",
    name: "노트북 1",
  },
};

const CANDIDATE_EDGE: NoteEdgeDto = {
  id: "edge-1",
  fromId: "note-1",
  toId: "note-2",
  relationType: "RELATED",
  weight: 0.84,
  status: "CANDIDATE",
  origin: "AUTO",
  reason: null,
  updatedAt: "2026-02-27T00:00:00.000Z",
  from: {
    id: "note-1",
    title: "기준 노트",
  },
  to: {
    id: "note-2",
    title: "대상 노트",
  },
};

function buildMockFetchResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

describe("Test-M6-03 NoteDetailClient", () => {
  it("연관 엣지 확정 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NoteDetailClient note={NOTE} initialEdges={[CANDIDATE_EDGE]} />);

    fireEvent.click(screen.getByRole("button", { name: "확정" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "확정" })).not.toBeDisabled();
    });
  });

  it("연관 엣지 확정 후 목록 재조회 API 실패 시 처리 상태를 해제하고 오류 배너를 표시해야 한다", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(buildMockFetchResponse({ data: CANDIDATE_EDGE }))
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NoteDetailClient note={NOTE} initialEdges={[CANDIDATE_EDGE]} />);

    fireEvent.click(screen.getByRole("button", { name: "확정" }));

    await waitFor(() => {
      expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "확정" })).not.toBeDisabled();
    });
  });
});
