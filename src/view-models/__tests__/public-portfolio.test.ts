import {
  toPublicHomeViewModel,
  toPublicProjectDetailViewModel,
  toPublicProjectsListViewModel,
} from "@/view-models/public-portfolio";

describe("public portfolio view models", () => {
  it("빈 데이터가 들어오면 프로필 필드는 null로 반환해야 한다", () => {
    // Arrange: 비어 있는 응답
    const input = {
      profile: null,
      featuredProjects: [],
      featuredExperiences: [],
    };

    // Act: 뷰모델 변환
    const viewModel = toPublicHomeViewModel(input);

    // Assert: 기본 컬렉션과 null 필드 확인
    expect(viewModel.profile.displayName).toBeNull();
    expect(viewModel.profile.headline).toBeNull();
    expect(viewModel.profile.bio).toBeNull();
    expect(viewModel.featuredProjects).toEqual([]);
    expect(viewModel.featuredExperiences).toEqual([]);
  });

  it("잘못된 데이터가 들어오면 안전하게 제외해야 한다", () => {
    // Arrange: 스키마가 깨진 응답
    const input = {
      featuredProjects: [{ id: 123, slug: null, title: {} }],
    };

    // Act: 뷰모델 변환
    const home = toPublicHomeViewModel(input);
    const list = toPublicProjectsListViewModel(input.featuredProjects);

    // Assert: 비정상 데이터 제거
    expect(home.featuredProjects).toHaveLength(0);
    expect(list).toHaveLength(0);
  });

  it("정상 상세 데이터에서 섹션을 추출해야 한다", () => {
    // Arrange: 섹션 헤딩이 포함된 상세 데이터
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

    // Act: 상세 뷰모델 변환
    const viewModel = toPublicProjectDetailViewModel(input);

    // Assert: 섹션 매핑 확인
    expect(viewModel).not.toBeNull();
    expect(viewModel?.sections.problem).toBe("문제 정의");
    expect(viewModel?.sections.approach).toBe("해결 접근");
    expect(viewModel?.sections.architecture).toBe("아키텍처");
    expect(viewModel?.sections.results).toBe("성과");
    expect(viewModel?.sections.links).toBe("https://example.com");
  });

  it("허용되지 않은 URL 스킴은 제거해야 한다", () => {
    // Arrange: javascript 스킴을 포함한 입력 데이터
    const input = {
      profile: {
        displayName: "테스트 사용자",
        links: [
          { label: "unsafe", url: "javascript:alert(1)" },
          { label: "safe", url: "https://example.com" },
        ],
      },
      featuredProjects: [
        {
          id: "project-1",
          slug: "project-1",
          title: "프로젝트",
          repoUrl: "javascript:alert(2)",
          demoUrl: "https://demo.example.com",
        },
      ],
      featuredExperiences: [],
    };

    // Act: 뷰모델 변환
    const home = toPublicHomeViewModel(input);
    const detail = toPublicProjectDetailViewModel({
      id: "project-1",
      slug: "project-1",
      title: "프로젝트",
      contentMd: "## Problem\n문제",
      repoUrl: "javascript:alert(3)",
      demoUrl: "https://demo.example.com",
    });

    // Assert: 허용 URL만 유지
    expect(home.profile.links).toEqual([{ label: "safe", url: "https://example.com/" }]);
    expect(home.featuredProjects[0]?.repoUrl).toBeNull();
    expect(home.featuredProjects[0]?.demoUrl).toBe("https://demo.example.com/");
    expect(detail?.repoUrl).toBeNull();
    expect(detail?.demoUrl).toBe("https://demo.example.com/");
  });
});
