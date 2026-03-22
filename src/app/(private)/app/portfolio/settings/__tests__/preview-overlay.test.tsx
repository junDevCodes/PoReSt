/** @jest-environment jsdom */

import { render, screen, fireEvent } from "@testing-library/react";
import PortfolioPreviewOverlay from "../PortfolioPreviewOverlay";
import { createRef } from "react";

// PortfolioFullPreview 를 경량 mock 으로 대체 (렌더링 확인 용도)
jest.mock("@/components/portfolio/PortfolioFullPreview", () => ({
  PortfolioFullPreview: (props: { displayName: string }) => (
    <div data-testid="portfolio-full-preview">{props.displayName}</div>
  ),
}));

const baseProps = {
  modalRef: createRef<HTMLDivElement>(),
  publicSlug: "tester",
  displayName: "테스터",
  headline: "헤드라인",
  bio: "소개",
  avatarUrl: "",
  email: "test@test.com",
  isEmailPublic: true,
  location: "서울",
  availabilityStatus: "OPEN",
  resumeUrl: "",
  featuredResumeTitle: "",
  links: [],
  onClose: jest.fn(),
};

describe("PortfolioPreviewOverlay", () => {
  beforeEach(() => {
    (baseProps.onClose as jest.Mock).mockClear();
  });

  it("열기 시 PortfolioFullPreview 가 렌더되어야 한다", () => {
    render(<PortfolioPreviewOverlay {...baseProps} />);

    expect(screen.getByTestId("portfolio-full-preview")).toBeInTheDocument();
    expect(screen.getByText("테스터")).toBeInTheDocument();
    expect(screen.getByText("미리보기")).toBeInTheDocument();
    expect(screen.getByText("저장 전")).toBeInTheDocument();
  });

  it("닫기 버튼 클릭 시 onClose 가 호출되어야 한다", () => {
    render(<PortfolioPreviewOverlay {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /닫기/ }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("배경 오버레이 클릭 시 onClose 가 호출되어야 한다", () => {
    const { container } = render(<PortfolioPreviewOverlay {...baseProps} />);

    // 최상위 오버레이 div 클릭
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("모달 내부 클릭 시 onClose 가 호출되지 않아야 한다", () => {
    render(<PortfolioPreviewOverlay {...baseProps} />);

    const preview = screen.getByTestId("portfolio-full-preview");
    fireEvent.click(preview);
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });
});
