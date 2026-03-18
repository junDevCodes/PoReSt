import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("포트폴리오 홈", () => {
  test("프로필 이름과 헤드라인이 표시된다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    // 스트리밍 완료 대기: h1이 나타나면 스켈레톤 종료
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test("주요 섹션 제목이 존재한다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    // 스트리밍 완료 대기
    await expect(page.locator("h1").first()).toBeVisible();

    // "대표 프로젝트"는 데이터 없어도 항상 렌더링됨
    await expect(
      page.getByText("대표 프로젝트", { exact: false })
    ).toBeVisible();
  });

  test("푸터에 PoReSt 크레딧이 표시된다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    await expect(
      page.getByText("이 포트폴리오는 PoReSt로 만들어졌습니다")
    ).toBeVisible();
  });
});
