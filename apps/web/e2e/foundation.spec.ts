import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("browser reaches API and PostgreSQL through the demo boundary", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Service status" }).click();
  await expect(page).toHaveTitle(/Synthetic demo/);
  await expect(
    page.getByRole("heading", { name: "Fictional participant A" }),
  ).toBeVisible();
  await expect(
    page.getByText("Database", { exact: false }).first(),
  ).toContainText("Ready");
  const response = await request.get("/api/demo");
  expect(response.status()).toBe(200);
  expect(
    (await response.json()).cases.map((item: { id: string }) => item.id),
  ).toEqual(["syn-case-01", "syn-case-02"]);
  await page.getByRole("button", { name: /Refresh demo status/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Demonstration status refreshed.",
  );
  await page.screenshot({
    path: testInfo.outputPath("foundation-desktop.png"),
    fullPage: true,
  });
});

test("foundation has no detected axe A/AA violations and a usable skip link", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  expect(page.url()).toContain("#main");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("mobile foundation stays within viewport and labels its limitations", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Start the guided example" }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic demonstration · Not for clinical use"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("foundation-mobile.png"),
    fullPage: true,
  });
});

test("fabricated credentials do not open protected API routes", async ({
  request,
}) => {
  const base = process.env.API_TEST_URL ?? "http://127.0.0.1:18000";
  const response = await request.get(
    `${base}/api/v1/private/cases/syn-case-01`,
    {
      headers: { Authorization: "Bearer fictional-admin", "X-Role": "admin" },
    },
  );
  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
});
