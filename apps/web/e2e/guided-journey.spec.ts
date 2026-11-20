import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("first visit leads from samples through an interactive lesson to questions and a care plan", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const privateTraffic: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/p03/")) privateTraffic.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Start the guided example" }).click();
  await page.getByRole("button", { name: "Choose sample reports" }).click();
  await expect(page.getByLabel("First sample report")).toHaveValue("carrier");
  await page.getByRole("button", { name: "Compare these samples" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Both samples have a carrier finding in CFTR",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the learning activity" }).click();
  await page.getByRole("button", { name: /Pair 4/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/Two changed copies. This is the one pairing/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "The chances change", exact: true })
    .click();
  await expect(page.getByText(/Try the other answer/)).toBeVisible();
  await page.getByRole("button", { name: "The chances stay the same" }).click();
  await expect(page.getByText(/Yes. Each pregnancy/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Prepare a visit" }).click();
  await page.getByRole("checkbox").first().check();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download my questions/ }).click();
  const file = await downloading;
  expect(await readFile(await file.path(), "utf8")).toContain("CFTR");
  await page
    .getByRole("button", { name: "Find a counselling service" })
    .click();
  await expect(page.getByLabel("Matching facility")).toBeVisible();
  await page.getByRole("button", { name: "Plan this sample visit" }).click();
  await expect(
    page.getByRole("button", { name: "Mark visit completed" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Start a new example" }).click();
  await expect(
    page.getByRole("heading", { name: "Before you begin" }),
  ).toBeFocused();
  expect(privateTraffic).toEqual([]);
});
test("missing coverage changes the lesson and Arabic preserves the selected samples", async ({
  page,
}) => {
  await page.goto("/start");
  await page.getByRole("button", { name: "Choose sample reports" }).click();
  await page.getByLabel("Second sample report").selectOption("not_tested");
  await page.getByRole("button", { name: "Compare these samples" }).click();
  await expect(
    page.getByText("These samples leave a question open"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the learning activity" }).click();
  await expect(page.getByRole("button", { name: /Pair 4/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "What could this test detect?" })
    .click();
  await expect(page.getByText(/Yes. A report can only describe/)).toBeVisible();
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: "رجوع" }).click();
  await page.getByRole("button", { name: "رجوع" }).click();
  await expect(page.getByLabel("تقرير العينة الثانية")).toHaveValue(
    "not_tested",
  );
});
test("home offers direct entry to the planner and service network", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Simulate service expansion" }).click();
  await expect(
    page.getByRole("button", { name: "Policy", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await page.getByRole("link", { name: "Explore the service network" }).click();
  await expect(
    page.getByRole("button", { name: "Ecosystem", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("one-click sample sign-in opens the real private workspace without granting any consent", async ({
  page,
}) => {
  const consentWrites: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/me/consents"))
      consentWrites.push(r.url());
  });
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Continue as partner A" }).click();
  await expect(
    page.getByRole("heading", { name: "Partner A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your report permissions" }),
  ).toBeVisible();
  expect(consentWrites).toEqual([]);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a sample account" }),
  ).toBeVisible();
});
