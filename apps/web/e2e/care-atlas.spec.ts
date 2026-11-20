import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Care Atlas connects personal choices, referral layers and a calculated policy scenario", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
      writes.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Open Care Atlas" }).click();
  await expect(page).toHaveURL(/\/care-atlas$/);
  await expect(
    page.getByRole("heading", { name: "Care Atlas", exact: true }),
  ).toBeVisible();

  await expect(page.getByLabel("Matching facility")).toHaveValue(
    "central-counsel",
  );
  await page.getByLabel("Service language").selectOption("Hindi");
  await expect(page.getByLabel("Matching facility")).toHaveValue(
    "canal-counsel",
  );
  await page
    .getByLabel("What are you planning for?")
    .selectOption({ label: "Learning about screening" });
  await expect(
    page.getByText("No fictional facility matches these filters."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Ecosystem", exact: true }).click();
  await expect(page.getByText("12 facilities", { exact: true })).toBeVisible();
  await page.getByText("Visible referrals (10)", { exact: true }).click();
  await expect(
    page.getByText("Discuss a screening result", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Screening", exact: true })
    .uncheck();
  await expect(page.getByText("9 facilities", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Canal Specialist Hub", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Canal Specialist Hub" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Policy", exact: true }).click();
  const south = page.getByRole("row", { name: /^South Ridge/ });
  await expect(south).toContainText("Access gap");
  await page.getByRole("button", { name: "Place proposed site" }).focus();
  await page.keyboard.press("Enter");
  await expect(south).toContainText("Newly within reach");
  await expect(page.getByText("+59,000 residents within reach")).toBeVisible();
  await page.getByRole("button", { name: "Reset to baseline" }).click();
  await expect(south).toContainText("Access gap");

  const map = page.locator(".atlas-cartography");
  await map.click({ position: { x: 16, y: 12 } });
  await expect(page.getByRole("img", { name: "Proposed site" })).toHaveCount(0);
  const bounds = (await map.boundingBox())!;
  await map.click({
    position: { x: bounds.width * 0.77, y: bounds.height * 0.76 },
  });
  await expect(page.getByRole("img", { name: "Proposed site" })).toBeVisible();
  await expect(south).toContainText("Newly within reach");
  await page.reload();
  await page.getByRole("button", { name: "Policy", exact: true }).click();
  await expect(south).toContainText("Access gap");
  expect(writes).toEqual([]);
});

test("Care Atlas reflows and reports no automated accessibility violations for all three modes", async ({
  page,
}) => {
  await page.goto("/care-atlas");
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Personal", "Ecosystem", "Policy"]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const report = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(report.violations, name + " at " + width).toEqual([]);
    }
  }
});
