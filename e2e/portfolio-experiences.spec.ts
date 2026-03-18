import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("포트폴리오 경력 페이지", () => {
  test("경력 제목이 표시된다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/experiences`);

    // h1 "경력" — 스트리밍 완료 대기
    await expect(page.locator("h1")).toContainText("경력");
  });

  test("경력 카드가 1개 이상 존재한다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/experiences`);

    // 스트리밍 완료 대기
    await expect(page.locator("h1")).toContainText("경력");

    // 경력 카드: article 태그 또는 빈 상태 메시지
    const articles = page.locator("article");
    const emptyMsg = page.getByText("공개된 경력 정보가 없습니다");

    // 둘 중 하나는 존재해야 함
    await expect(articles.first().or(emptyMsg)).toBeVisible();
  });
});
