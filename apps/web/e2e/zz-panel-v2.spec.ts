import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ trace: "off" });
test.describe.configure({ retries: 0 });
async function processing(page: Page) {
  const grant = page.getByRole("button", {
    name: "Grant processing",
    exact: true,
  });
  if (await grant.isEnabled()) await grant.click();
  await expect(page.locator(".private-case")).toContainText(
    "Your processing choice: granted",
  );
}

test("public panel and synthetic v2 scenario statuses work without clinical interpretation", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/panel");
  await expect(
    page.getByRole("heading", { name: "CFTR", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cystic fibrosis", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical panel.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Unavailable — no number", { exact: false }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/workspace");
  await page.getByLabel("Demo username").fill("demo-a");
  await page.getByLabel("Demo password").fill("demo-a-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await processing(page);
  const section = page.locator(".report-workspace");
  async function choose(id: string) {
    await section.getByLabel("Gene-level synthetic scenario").selectOption(id);
    await section
      .getByRole("button", { name: "Select gene-level scenario", exact: true })
      .click();
    await expect(section.locator(".report-permission")).toBeVisible();
    await processing(page);
  }
  await choose("fixture-a-v2-none");
  const none = section.locator('[data-report-source="syn-report-a-v2-none"]');
  await none.getByRole("button", { name: "View revision 1" }).click();
  await expect(
    section.locator(".gene-observation").filter({ hasText: "CFTR" }),
  ).toContainText("no pathogenic variant detected");
  await choose("fixture-a-v2-carrier-cftr");
  await section
    .locator('[data-report-source="syn-report-a-v2-carrier-cftr"]')
    .getByRole("button", { name: "View revision 1" })
    .click();
  await expect(
    section.locator(".gene-observation").filter({ hasText: "CFTR" }),
  ).toContainText("CFTR: carrier");
  await expect(section.locator(".report-detail")).toContainText(
    "Cystic fibrosis",
  );
  await expect(section.locator(".report-detail")).toContainText("illustrative");
  await choose("fixture-a-v2-none");
  await none
    .getByRole("button", { name: "Apply gene-level correction" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(section.locator(".report-permission")).toBeVisible();
  await processing(page);
  await expect(none).toContainText("Revision 1: superseded");
  await none.getByRole("button", { name: "View revision 2" }).click();
  await expect(
    section.locator(".gene-observation").filter({ hasText: "CFTR" }),
  ).toContainText("CFTR: carrier");
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
