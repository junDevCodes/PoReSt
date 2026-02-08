import {
  toPublicHomeViewModel,
  toPublicProjectDetailViewModel,
  toPublicProjectsListViewModel,
} from "@/view-models/public-portfolio";

describe("public portfolio view models", () => {
  it("빈 홈 데이터가 들어오면 기본값으로 변환해야 한다", () => {
    // 준비: 비어 있는 응답
    const input = {
      profile: null,
      featuredProjects: [],
      featuredExperiences: [],
    };

    // 실행: 뷰모델 변환
    const viewModel = toPublicHomeViewModel(input);

    // 검증: 기본 문구와 빈 컬렉션 확인
    expect(viewModel.profile.displayName).toBe("이름을 준비 중입니다.");
    expect(viewModel.featuredProjects).toEqual([]);
    expect(viewModel.featuredExperiences).toEqual([]);
  });

  it("오류 형태의 데이터가 들어와도 안전하게 기본값을 반환해야 한다", () => {
    // 준비: 스키마가 깨진 응답
    const input = {
      featuredProjects: [{ id: 123, slug: null, title: {} }],
    };

    // 실행: 뷰모델 변환
    const home = toPublicHomeViewModel(input);
    const list = toPublicProjectsListViewModel(input.featuredProjects);

    // 검증: 비정상 데이터가 제거되어야 한다
    expect(home.featuredProjects).toHaveLength(0);
    expect(list).toHaveLength(0);
  });

  it("정상 상세 데이터에서 섹션을 추출해야 한다", () => {
    // 준비: 섹션 헤딩이 포함된 상세 데이터
    const input = {
      id: "project-1",
      slug: "project-one",
      title: "프로젝트 하나",
      contentMd: [
        "## Problem",
        "문제 정의",
        "## Approach",
        "해결 접근",
        "## Architecture",
        "아키텍처",
        "## Results",
        "성과",
        "## Links",
        "https://example.com",
      ].join("\n"),
      techStack: ["Next.js", "Prisma"],
      updatedAt: "2026-02-07T10:00:00.000Z",
    };

    // 실행: 상세 뷰모델 변환
    const viewModel = toPublicProjectDetailViewModel(input);

    // 검증: 섹션 매핑 확인
    expect(viewModel).not.toBeNull();
    expect(viewModel?.sections.problem).toBe("문제 정의");
    expect(viewModel?.sections.approach).toBe("해결 접근");
    expect(viewModel?.sections.architecture).toBe("아키텍처");
    expect(viewModel?.sections.results).toBe("성과");
    expect(viewModel?.sections.links).toBe("https://example.com");
  });
});
