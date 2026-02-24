/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PortfolioSettingsPage from "@/app/(private)/app/portfolio/settings/page";

function buildSettingsResponse() {
  return {
    data: {
      id: "settings-1",
      publicSlug: "tester",
      isPublic: true,
      displayName: "테스터",
      headline: "기본 헤드라인",
      bio: "기본 소개",
      avatarUrl: "",
      links: [],
    },
  };
}

describe("PortfolioSettingsPage preview", () => {
  beforeEach(() => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(buildSettingsResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("입력값이 바뀌면 미리보기가 즉시 갱신되어야 한다", async () => {
    render(<PortfolioSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("테스터")).toBeInTheDocument();
    });

    const displayNameInput = screen.getByLabelText("표시 이름");
    fireEvent.change(displayNameInput, { target: { value: "새 이름" } });

    expect(screen.getByText("새 이름")).toBeInTheDocument();
  });

  it("publicSlug를 변경하면 경고 배너가 노출되어야 한다", async () => {
    render(<PortfolioSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("tester")).toBeInTheDocument();
    });

    const slugInput = screen.getByLabelText("공개 슬러그");
    fireEvent.change(slugInput, { target: { value: "tester-next" } });

    expect(
      screen.getByText("publicSlug 변경이 감지되었습니다. 저장하면 기존 공유 링크가 깨질 수 있으며 리다이렉트는 제공되지 않습니다."),
    ).toBeInTheDocument();
  });
});
