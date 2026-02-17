import { buildUsersPageHref, parsePublicUsersSearchParams } from "@/app/(public)/users/_lib/directory";

describe("public users directory helpers", () => {
  it("검색 파라미터의 기본값과 최대값을 정상화해야 한다", () => {
    const parsedDefault = parsePublicUsersSearchParams({});
    expect(parsedDefault.limit).toBe(20);

    const parsedMax = parsePublicUsersSearchParams({ limit: "999" });
    expect(parsedMax.limit).toBe(50);
  });

  it("빈 문자열은 undefined로 정리되어야 한다", () => {
    const parsed = parsePublicUsersSearchParams({
      q: "   ",
      cursor: "   ",
    });

    expect(parsed.q).toBeUndefined();
    expect(parsed.cursor).toBeUndefined();
  });

  it("다음 페이지 링크를 기존 필터와 함께 생성해야 한다", () => {
    const href = buildUsersPageHref(
      {
        q: "backend",
        limit: "10",
      },
      "cursor-token",
    );

    expect(href).toBe("/users?q=backend&limit=10&cursor=cursor-token");
  });
});
