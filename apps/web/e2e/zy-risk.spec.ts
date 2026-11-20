import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ trace: "off" });
test.describe.configure({ retries: 0 });

test("synthetic people select neither, one and shared carriers with consent and neutral withdrawal", async ({
  browser,
}) => {
  test.setTimeout(150000);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:13000";
  const ac = await browser.newContext({ baseURL }),
    bc = await browser.newContext({ baseURL });
  try {
    const a = await ac.newPage(),
      b = await bc.newPage();
    for (const [page, user] of [
      [a, "demo-a"],
      [b, "demo-b"],
    ] as const) {
      await page.goto("/workspace");
      await page.getByText("Sign in with a username instead").click();
      await page.getByLabel("Demo username").fill(user);
      await page.getByLabel("Demo password").fill(user + "-only");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Sign out" }),
      ).toBeVisible();
    }
    const jointId = await a
      .locator(".joint-row")
      .last()
      .getAttribute("data-joint-id");
    expect(jointId).toBeTruthy();
    for (const page of [a, b])
      await page
        .getByLabel("Shared demo request", { exact: true })
        .selectOption(jointId!);
    async function grantProcessing(page: Page) {
      await expect(
        page.getByRole("button", { name: "Refresh private state" }),
      ).toBeEnabled();
      const button = page.getByRole("button", {
        name: "Grant processing",
        exact: true,
      });
      if (await button.isEnabled()) await button.click();
      await expect(page.locator(".private-case")).toContainText(
        "Your processing choice: granted",
      );
    }
    async function choose(page: Page, id: string) {
      await grantProcessing(page);
      await page.getByLabel("Gene-level synthetic scenario").selectOption(id);
      await page
        .getByRole("button", {
          name: "Select gene-level scenario",
          exact: true,
        })
        .click();
      await expect(page.locator(".report-permission")).toBeVisible();
      await grantProcessing(page);
    }
    async function authorize() {
      for (const page of [a, b]) {
        await page
          .getByRole("button", { name: "Refresh private state" })
          .click();
        await expect(
          page.getByRole("button", { name: "Refresh private state" }),
        ).toBeEnabled();
        const assessment = page
          .locator(`[data-joint-id="${jointId}"]`)
          .getByRole("button", {
            name: "Grant assessment",
            exact: true,
          });
        if (await assessment.isEnabled()) await assessment.click();
        await page
          .getByRole("button", {
            name: "Allow my report summary",
            exact: true,
          })
          .click();
        await expect(
          page.getByRole("button", { name: "Refresh private state" }),
        ).toBeEnabled();
        await page
          .getByRole("button", {
            name: "Allow sharing this result",
            exact: true,
          })
          .click();
        await expect(
          page.getByRole("button", { name: "Refresh private state" }),
        ).toBeEnabled();
      }
    }
    async function shared(state: string) {
      await a
        .getByRole("button", { name: "Start a fresh calculation" })
        .click();
      await a.getByRole("button", { name: "Show the shared result" }).click();
      await expect(
        a.getByRole("region", { name: "Our shared result", exact: true }),
      ).toContainText(state);
    }
    await choose(a, "fixture-a-v2-none");
    await choose(b, "fixture-b-v2-none");
    await authorize();
    await shared("NO_SHARED_FINDING");
    await choose(a, "fixture-a-v2-carrier-cftr");
    await authorize();
    await a.getByRole("button", { name: "Start a fresh calculation" }).click();
    await a.getByRole("button", { name: "Show my report summary" }).click();
    await expect(
      a.getByRole("region", { name: "My report summary", exact: true }),
    ).toContainText("CFTR: OWN_CARRIER");
    await shared("NO_SHARED_FINDING");
    await choose(b, "fixture-b-v2-carrier-cftr");
    await authorize();
    await shared("SHARED_CARRIER");
    await expect(
      a.getByRole("region", { name: "Our shared result", exact: true }),
    ).toContainText("affected 1/4");
    await b.getByRole("button", { name: "Withdraw result sharing" }).click();
    await expect(
      b.getByRole("button", { name: "Refresh private state" }),
    ).toBeEnabled();
    await a.getByRole("button", { name: "Show the shared result" }).click();
    await expect(
      a.getByRole("region", { name: "Our shared result", exact: true }),
    ).toContainText("UNAVAILABLE");
    await a.setViewportSize({ width: 375, height: 812 });
    expect(
      (
        await new AxeBuilder({ page: a })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await a.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await a.getByRole("button", { name: "Start a fresh calculation" }).focus();
    await a.keyboard.press("Enter");
    expect(await a.evaluate(() => Object.keys(localStorage))).toEqual([]);
  } finally {
    await ac.close();
    await bc.close();
  }
});
