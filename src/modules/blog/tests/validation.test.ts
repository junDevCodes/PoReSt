import { parseBlogPostCreateInput, parseBlogPostUpdateInput } from "@/modules/blog/implementation";
import { BlogServiceError } from "@/modules/blog/interface";

describe("blog validation", () => {
  it("블로그 글 생성 입력에서 제목은 필수여야 한다", () => {
    const input = {
      contentMd: "본문",
    };

    expect(() => parseBlogPostCreateInput(input)).toThrow(BlogServiceError);
    expect(() => parseBlogPostCreateInput(input)).toThrow("블로그 글 입력값이 올바르지 않습니다.");
  });

  it("블로그 글 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    expect(() => parseBlogPostUpdateInput({})).toThrow(BlogServiceError);
    expect(() => parseBlogPostUpdateInput({})).toThrow("블로그 글 수정 입력값이 올바르지 않습니다.");
  });

  it("태그 입력은 소문자 중복 제거로 정규화되어야 한다", () => {
    const parsed = parseBlogPostCreateInput({
      title: "제목",
      contentMd: "본문",
      tags: ["Prisma", "prisma", "Database"],
    });

    expect(parsed.tags).toEqual(["prisma", "database"]);
  });
});
