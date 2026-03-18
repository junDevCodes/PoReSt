import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("포트폴리오 프로젝트", () => {
  test("목록 페이지에 프로젝트 제목과 카드가 표시된다", async ({
    page,
  }) => {
    await page.goto(`/portfolio/${SLUG}/projects`);

    // h1 "프로젝트" — 스트리밍 완료 대기
    await expect(page.locator("h1")).toContainText("프로젝트");

    // 프로젝트 카드(Link) 또는 빈 상태 메시지
    const cards = page.locator(
      `a[href*="/portfolio/${SLUG}/projects/"]`
    );
    const emptyMsg = page.getByText("공개 프로젝트가 없습니다");

    await expect(cards.first().or(emptyMsg)).toBeVisible();
  });

  test("카드 클릭 시 상세 페이지로 이동한다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/projects`);
    await expect(page.locator("h1")).toContainText("프로젝트");

    const firstLink = page
      .locator(`a[href*="/portfolio/${SLUG}/projects/"]`)
      .first();

    if ((await firstLink.count()) === 0) {
      test.skip(true, "프로젝트 카드가 없어 스킵");
      return;
    }

    await firstLink.click();
    await page.waitForURL(`**/portfolio/${SLUG}/projects/**`);

    expect(page.url()).toContain(`/portfolio/${SLUG}/projects/`);
  });

  test("상세 페이지에 제목이 표시된다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/projects`);
    await expect(page.locator("h1")).toContainText("프로젝트");

    const firstLink = page
      .locator(`a[href*="/portfolio/${SLUG}/projects/"]`)
      .first();

    if ((await firstLink.count()) === 0) {
      test.skip(true, "프로젝트 카드가 없어 스킵");
      return;
    }

    await firstLink.click();
    await page.waitForURL(`**/portfolio/${SLUG}/projects/**`);

    // 상세 페이지 h1 (프로젝트 제목)
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });
});
