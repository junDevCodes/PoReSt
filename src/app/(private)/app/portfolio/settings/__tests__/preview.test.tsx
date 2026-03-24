/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PortfolioSettingsPageClient } from "@/app/(private)/app/portfolio/settings/PortfolioSettingsPageClient";

function buildInitialSettings() {
  return {
    id: "settings-1",
    publicSlug: "tester",
    isPublic: true,
    displayName: "테스터",
    headline: "기본 헤드라인",
    bio: "기본 소개",
    avatarUrl: "",
    layoutJson: null,
    email: null,
    isEmailPublic: false,
    location: null,
    availabilityStatus: null,
    resumeUrl: null,
    featuredResumeId: null,
    featuredResumeTitle: null,
    links: [] as Array<{ id: string; label: string; url: string; order: number; type: string }>,
  };
}

describe("PortfolioSettingsPageClient preview", () => {
  it("미리보기를 열고 입력값이 바뀌면 미리보기가 즉시 갱신되어야 한다", async () => {
    render(
      <PortfolioSettingsPageClient
        initialSettings={buildInitialSettings()}
        initialResumes={[]}
      />,
    );

    expect(screen.getByDisplayValue("테스터")).toBeInTheDocument();

    // 미리보기 모달 열기
    fireEvent.click(screen.getByRole("button", { name: "미리보기" }));

    // dynamic import 로딩 대기
    await waitFor(() => {
      expect(screen.getByText("미리보기", { selector: "span" })).toBeInTheDocument();
    });

    const displayNameInput = screen.getByLabelText("표시 이름");
    fireEvent.change(displayNameInput, { target: { value: "새 이름" } });

    // 모달 내 미리보기에 새 이름이 즉시 반영되어야 한다
    await waitFor(() => {
      expect(screen.getAllByText("새 이름").length).toBeGreaterThan(0);
    });
  });

  it("publicSlug를 변경하면 경고 배너가 노출되어야 한다", async () => {
    render(
      <PortfolioSettingsPageClient
        initialSettings={buildInitialSettings()}
        initialResumes={[]}
      />,
    );

    expect(screen.getByDisplayValue("tester")).toBeInTheDocument();

    const slugInput = screen.getByLabelText("공개 슬러그");
    fireEvent.change(slugInput, { target: { value: "tester-next" } });

    expect(
      screen.getByText(
        "publicSlug 변경이 감지되었습니다. 저장하면 기존 공유 링크가 깨질 수 있으며 리다이렉트는 제공되지 않습니다.",
      ),
    ).toBeInTheDocument();
  });
});
