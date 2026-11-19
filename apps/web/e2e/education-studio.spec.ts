import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { ContentBundle } from "../src/content/locale";

const readContent = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/content/en/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const content = {
  ui: readContent("ui") as ContentBundle["ui"],
  risk: readContent("risk-messages") as ContentBundle["risk"],
  lessons: [
    "genes-and-copies",
    "carriers",
    "couple-chance",
    "relatives-share-genes",
    "test-limits",
    "options",
    "your-result",
  ].map(readContent) as ContentBundle["lessons"],
};

test.use({ trace: "off" });
test.describe.configure({ retries: 0 });
const ui = content.ui;
const screenshots = fileURLToPath(
  new URL("../../../docs/screenshots/", import.meta.url),
);

test("public Learn overview has accessible navigation and no sign-in requirement", async ({
  page,
}) => {
  await page.goto("/learn");
  await expect(
    page.getByRole("heading", { name: ui.overview_title }),
  ).toBeVisible();
  await expect(page.locator(".module-link")).toHaveCount(7);
  for (const viewport of [
    { width: 1280, height: 960 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
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
  }
});
for (const lesson of content.lessons)
  test(`${lesson.module_number} is public, accessible at desktop/mobile/320px and captured`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto(`/learn/${lesson.module_id}`);
    await expect(
      page.getByRole("heading", { name: lesson.title, exact: true }),
    ).toBeVisible();
    if (lesson.module_number === "M4" || lesson.module_number === "M5") {
      await page
        .getByRole("button", { name: ui.calculate, exact: true })
        .click();
      await expect(page.locator(".server-result")).toContainText(
        lesson.module_number === "M4" ? "8000" : "241",
      );
    }
    if (lesson.module_number === "M7")
      await page.getByLabel(ui.preview_kind).selectOption("couple");
    await mkdir(screenshots, { recursive: true });
    for (const [name, viewport] of [
      ["desktop", { width: 1280, height: 960 }],
      ["mobile", { width: 375, height: 812 }],
    ] as const) {
      await page.setViewportSize(viewport);
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
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({
        path: `${screenshots}/${lesson.module_number.toLowerCase()}-${name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.setViewportSize({ width: 320, height: 812 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(await page.context().cookies()).toEqual([]);
  });

test("GeneKeys completes through keyboard and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learn/carriers");
  const preset = page.getByLabel(ui.preset);
  await preset.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator(".child-state")).toHaveText(ui.two_changed);
  expect(
    await page
      .locator(".copy-shape")
      .first()
      .evaluate((e) => ({
        animation: getComputedStyle(e).animationName,
        transition: getComputedStyle(e).transitionDuration,
      })),
  ).toEqual({ animation: "none", transition: "0s" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});
test("family tree uses real what-if through the existing proxy and clears numbers for not-sure", async ({
  page,
}) => {
  await page.goto("/learn/relatives-share-genes");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/p03/risk/whatif") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: ui.calculate, exact: true }).click();
  const actual = await (await response).json();
  expect(actual.numbers.related.exact).toEqual({ num: 13, den: 8000 });
  expect(actual.numbers.unrelated.exact).toEqual({ num: 1, den: 2500 });
  await expect(page.locator(".absolute-comparison")).toContainText("8000");
  await page.getByLabel(ui.relationship).selectOption("not_sure");
  await expect(
    page.getByText(content.risk.messages["risk.counsellor_context"], {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".absolute-comparison")).toHaveCount(0);
  await page.getByRole("button", { name: ui.calculate, exact: true }).click();
  await expect(page.locator(".server-result")).toContainText(
    content.risk.messages["risk.counsellor_context"],
  );
});
test("negative bar renders real residual gold and no invented laboratory rate", async ({
  page,
}) => {
  await page.goto("/learn/test-limits");
  await page.getByRole("button", { name: ui.calculate, exact: true }).click();
  await expect(
    page.getByRole("meter", { name: `Model carrier chance: ${ui.after}` }),
  ).toHaveAttribute("max", "241");
  await expect(page.getByText(ui.detection_assumption)).toBeVisible();
  await expect(page.locator(".uncertain-note")).toContainText(
    ui.uncertain_note,
  );
});
test("ResultExplainer gives plain own/shared text and neutral unavailable without a private request", async ({
  page,
}) => {
  const privateRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/p03/risk/")) privateRequests.push(r.url());
  });
  await page.goto("/learn/your-result");
  await expect(page.getByText(content.risk.states.OWN_CARRIER)).toBeVisible();
  await page.getByLabel(ui.preview_kind).selectOption("couple");
  await expect(
    page.getByText(content.risk.caveats.GENE_LEVEL_ONLY),
  ).toBeVisible();
  await page.getByLabel(ui.preview_kind).selectOption("unavailable");
  await expect(page.locator(".plain-unavailable")).toHaveText(
    content.risk.messages["risk.unavailable"],
  );
  await expect(
    page.locator(".result-explainer .natural-frequency"),
  ).toHaveCount(0);
  expect(privateRequests).toEqual([]);
});
test("visited IDs and questions remain memory-only and clear without storage or server writes", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/learn");
  await page.locator('a[href="/learn/genes-and-copies"]').click();
  await expect(page.locator(".learn-progress")).toContainText("1 of 7");
  await page.getByRole("link", { name: new RegExp(ui.next + ":") }).click();
  await expect(page.locator(".learn-progress")).toContainText("2 of 7");
  await page.getByRole("button", { name: ui.clear_progress }).click();
  await expect(page.locator(".learn-progress")).toContainText("0 of 7");
  await page.goto("/learn/options");
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    })),
  ).toEqual({ local: [], session: [] });
  expect(posts).toEqual([]);
});
