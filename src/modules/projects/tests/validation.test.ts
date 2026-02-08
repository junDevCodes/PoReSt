import { Visibility } from "@prisma/client";
import {
  buildProjectSlug,
  parseProjectCreateInput,
  parseProjectUpdateInput,
  ProjectServiceError,
} from "@/modules/projects";

describe("projects validation", () => {
  it("제목으로 슬러그를 자동 생성해야 한다", () => {
    // 준비: 슬러그 없이 생성 입력
    const input = {
      title: "My First Project",
      contentMd: "본문",
    };

    // 실행: 생성 입력 검증
    const parsed = parseProjectCreateInput(input);

    // 검증: 슬러그 자동 생성 확인
    expect(parsed.slug).toBe("my-first-project");
  });

  it("isFeatured가 true면 visibility가 PUBLIC이어야 한다", () => {
    // 준비: 비공개 + 대표 노출 입력
    const input = {
      title: "대표 비공개 프로젝트",
      slug: "featured-private-case",
      contentMd: "본문",
      visibility: Visibility.PRIVATE,
      isFeatured: true,
    };

    // 실행 및 검증: 검증 에러 확인
    expect(() => parseProjectCreateInput(input)).toThrow(ProjectServiceError);
    expect(() => parseProjectCreateInput(input)).toThrow("대표 프로젝트는 공개 상태여야 합니다.");
  });

  it("수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    // 준비: 빈 수정 입력
    const input = {};

    // 실행 및 검증: 검증 에러 확인
    expect(() => parseProjectUpdateInput(input)).toThrow(ProjectServiceError);
  });

  it("슬러그 생성 시 허용되지 않은 문자를 제거해야 한다", () => {
    // 준비: 특수문자가 포함된 문자열
    const raw = "Project! @2026 ###";

    // 실행: 슬러그 생성
    const slug = buildProjectSlug(raw);

    // 검증: 정규화 결과 확인
    expect(slug).toBe("project-2026");
  });
});
