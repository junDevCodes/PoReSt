import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("SEO 메타 + Sitemap", () => {
  test("홈 페이지에 title과 og:title이 존재한다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    // <title> 비어있지 않음
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // og:title meta 존재
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
    const content = await ogTitle.getAttribute("content");
    expect(content).toBeTruthy();
  });

  test("sitemap.xml이 정상 응답한다", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>");
  });
});
