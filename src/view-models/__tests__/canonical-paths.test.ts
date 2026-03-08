/**
 * Test-M6-14: canonical 경로 /portfolio/ 검증
 * /u/[publicSlug] → /portfolio/[publicSlug] 전환 후 내부 경로 일관성 확인
 */

import {
  toPublicHomeViewModel,
  toPublicProjectsListViewModel,
} from "@/view-models/public-portfolio";
import { DYNAMIC_REVALIDATE_PAGES } from "@/lib/revalidate-public";

describe("Test-M6-14 canonical 경로 /portfolio/ 검증", () => {
  it("toPublicHomeViewModel의 featuredProject.publicPath가 /portfolio/로 시작한다", () => {
    const input = {
      profile: { publicSlug: "tester", isPublic: true },
      featuredProjects: [
        {
          id: "proj-1",
          slug: "my-project",
          title: "테스트 프로젝트",
          publicSlug: "tester",
        },
      ],
      featuredExperiences: [],
    };

    const vm = toPublicHomeViewModel(input);

    expect(vm.featuredProjects[0].publicPath).toMatch(/^\/portfolio\//);
  });

  it("toPublicProjectsListViewModel의 publicPath가 /portfolio/로 시작한다", () => {
    const input = [
      {
        id: "proj-1",
        slug: "my-project",
        title: "테스트 프로젝트",
        publicSlug: "tester",
      },
    ];

    const list = toPublicProjectsListViewModel(input);

    expect(list[0].publicPath).toMatch(/^\/portfolio\//);
  });

  it("revalidate-public DYNAMIC_REVALIDATE_PAGES에 /u/ 경로가 없고 /portfolio/ 경로가 포함된다", () => {
    const hasLegacyPath = DYNAMIC_REVALIDATE_PAGES.some((path) => path.startsWith("/u/"));
    const hasCanonicalPath = DYNAMIC_REVALIDATE_PAGES.some((path) =>
      path.startsWith("/portfolio/"),
    );

    expect(hasLegacyPath).toBe(false);
    expect(hasCanonicalPath).toBe(true);
  });

  it("toPublicHomeViewModel의 featuredProject.publicPath 전체 형식이 /portfolio/[slug]/projects/[slug]이다", () => {
    const input = {
      profile: { publicSlug: "tester", isPublic: true },
      featuredProjects: [
        {
          id: "proj-1",
          slug: "my-project",
          title: "테스트 프로젝트",
          publicSlug: "tester",
        },
      ],
      featuredExperiences: [],
    };

    const vm = toPublicHomeViewModel(input);

    expect(vm.featuredProjects[0].publicPath).toBe("/portfolio/tester/projects/my-project");
  });
});
