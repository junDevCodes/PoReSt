/** @jest-environment jsdom */

import { render, screen, fireEvent } from "@testing-library/react";
import JobCardDetailModal, {
  type JobCardDetailModalProps,
} from "../JobCardDetailModal";

const baseCard = {
  id: "card-1",
  company: "테스트 기업",
  role: "프론트엔드 개발자",
  status: "APPLIED" as const,
  priority: 1,
  summary: "테스트 요약",
  tags: ["React", "TypeScript"],
  jobDescriptionMd: null,
  appliedAt: "2026-03-20T00:00:00.000Z",
  matchScoreJson: null,
  eventCount: 0,
  updatedAt: "2026-03-20T00:00:00.000Z",
};

const baseProps: JobCardDetailModalProps = {
  card: baseCard,
  events: [],
  eventsLoading: false,
  jdInput: "",
  onJdInputChange: jest.fn(),
  matchLoading: false,
  matchResult: null,
  statusNote: "",
  onStatusNoteChange: jest.fn(),
  onStatusChange: jest.fn(),
  onJdMatch: jest.fn(),
  onClose: jest.fn(),
};

describe("JobCardDetailModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("열기 시 회사명과 직무가 렌더되어야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    expect(screen.getByText("테스트 기업")).toBeInTheDocument();
    expect(screen.getByText("프론트엔드 개발자")).toBeInTheDocument();
    expect(screen.getByText("지원 완료")).toBeInTheDocument();
  });

  it("상세 정보(요약, 지원일)가 렌더되어야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    expect(screen.getByText("테스트 요약")).toBeInTheDocument();
    expect(screen.getByText(/지원일/)).toBeInTheDocument();
  });

  it("상태 변경 버튼들이 현재 상태 제외하고 렌더되어야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    // APPLIED 상태이므로 APPLIED 제외한 5개 버튼
    expect(screen.getByText("관심")).toBeInTheDocument();
    expect(screen.getByText("면접 진행")).toBeInTheDocument();
    expect(screen.getByText("오퍼 수령")).toBeInTheDocument();
    expect(screen.getByText("탈락/거절")).toBeInTheDocument();
    expect(screen.getByText("보관")).toBeInTheDocument();
  });

  it("닫기 버튼 클릭 시 onClose 가 호출되어야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    fireEvent.click(screen.getByText("✕"));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("배경 오버레이 클릭 시 onClose 가 호출되어야 한다", () => {
    const { container } = render(<JobCardDetailModal {...baseProps} />);

    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("모달 내부 클릭 시 onClose 가 호출되지 않아야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    fireEvent.click(screen.getByText("테스트 기업"));
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it("JD 매칭 결과가 있으면 점수가 표시되어야 한다", () => {
    const matchResult = {
      score: 85,
      matchedSkills: ["React", "TypeScript"],
      gaps: ["GraphQL"],
      summary: "높은 매칭도",
    };

    render(
      <JobCardDetailModal {...baseProps} matchResult={matchResult} />,
    );

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("/ 100점")).toBeInTheDocument();
    expect(screen.getByText("높은 매칭도")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("GraphQL")).toBeInTheDocument();
  });

  it("이벤트 목록이 렌더되어야 한다", () => {
    const events = [
      {
        id: "ev-1",
        fromStatus: "INTERESTED" as const,
        toStatus: "APPLIED" as const,
        note: "서류 제출 완료",
        createdAt: "2026-03-20T10:00:00.000Z",
      },
    ];

    render(<JobCardDetailModal {...baseProps} events={events} />);

    expect(screen.getByText(/관심 → 지원 완료/)).toBeInTheDocument();
    expect(screen.getByText("서류 제출 완료")).toBeInTheDocument();
  });

  it("상태 변경 버튼 클릭 시 onStatusChange 가 호출되어야 한다", () => {
    render(<JobCardDetailModal {...baseProps} />);

    fireEvent.click(screen.getByText("면접 진행"));
    expect(baseProps.onStatusChange).toHaveBeenCalledWith("card-1", "INTERVIEWING");
  });
});
