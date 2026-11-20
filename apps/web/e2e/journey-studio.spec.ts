import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("bilingual journey retrieves public sources, exports fictional history and clears local choices", async ({
  page,
}) => {
  await page.goto("/journey");
  await page.getByRole("button", { name: "Explain this topic" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Test scope and uncertainty",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Include this question in my summary" })
    .first()
    .check();
  await page
    .getByRole("checkbox", { name: "Enable the fictional family graph" })
    .check();
  await page.getByRole("button", { name: /^Grandparent/ }).click();
  await page.getByLabel("Information status").selectOption("reported");
  await page.getByLabel("Fictional detail").selectOption("screening");
  const file = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download consultation summary" })
    .click();
  const summary = await file;
  const text = await readFile(await summary.path(), "utf8");
  expect(text).toContain("Grandparent");
  expect(text).toContain("fictional test cover");
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator(".journey-studio")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "خريطة صحة العائلة" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "امسح هذا العرض" }).click();
  await expect(
    page.getByRole("checkbox", { name: "فعّل خريطة العائلة الوهمية" }),
  ).not.toBeChecked();
  await expect(page.getByText("مُسحت اختيارات الصفحة.")).toBeVisible();
});

test("policy extends reach with multiple sites and virtual access and serves downloadable fixtures", async ({
  page,
  request,
}) => {
  await page.goto("/care-atlas");
  await page.getByRole("button", { name: "Policy", exact: true }).click();
  await page.getByRole("button", { name: "Place proposed site" }).click();
  await page.getByLabel("Proposed district").selectOption("north");
  await page.getByRole("button", { name: "Add another site" }).click();
  await expect(
    page.getByRole("img", { name: "Proposed site 2" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Expand simulated telehealth" })
    .check();
  await expect(page.getByText("+135,600 residents within reach")).toBeVisible();
  await expect(page.getByRole("row", { name: /^Garden/ })).toContainText(
    "Partial telehealth reach",
  );
  await page
    .getByRole("link", { name: "Explore the synthetic dataset" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Atlas dataset" }),
  ).toBeVisible();
  const response = await request.get("/api/atlas/dataset?format=geojson");
  expect(response.ok()).toBe(true);
  expect((await response.json()).features).toHaveLength(194);
});
