import { expect, test } from "@playwright/test";

test.use({ trace: "off" });

test("an authorized result opens a fictional itinerary and withdrawing permission closes it", async ({
  page,
}) => {
  await page.goto("/workspace");
  await page.getByLabel("Demo username").fill("demo-a");
  await page.getByLabel("Demo password").fill("demo-a-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const processing = page.getByRole("button", {
    name: "Grant processing",
    exact: true,
  });
  await expect(processing).toBeVisible();
  if (await processing.isEnabled()) await processing.click();
  await expect(page.locator(".private-case")).toContainText(
    "Your processing choice: granted",
  );
  await page
    .getByRole("button", { name: "Grant own demo assessment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Calculate own demo summary", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Own demo" })).toBeVisible();
  const privateGuideCalls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/atlas/"))
      privateGuideCalls.push(request.url());
  });
  const pinned = page.waitForRequest(
    (request) =>
      request.url().endsWith("/risk/my-assessment") &&
      Boolean(request.headers()["x-risk-binding"]),
  );
  await page
    .getByRole("button", { name: "Open linked fictional care journey" })
    .click();
  expect((await pinned).method()).toBe("GET");
  await expect(
    page.getByRole("region", { name: "Personal services" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Plan this fictional visit" }).click();
  await page.getByRole("button", { name: "Mark visit completed" }).click();
  await expect(page.getByText(/· Completed$/)).toBeVisible();
  expect(privateGuideCalls).toEqual([]);
  await page
    .getByRole("button", { name: "Withdraw own demo assessment", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Personal services" }),
  ).toHaveCount(0);
});
