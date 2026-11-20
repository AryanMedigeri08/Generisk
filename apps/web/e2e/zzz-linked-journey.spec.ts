import { expect, test } from "@playwright/test";

test.use({ trace: "off" });

test("an authorized result opens a fictional itinerary and withdrawing permission closes it", async ({
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
    .getByRole("button", { name: "Allow my report summary", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show my report summary", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "My report summary" }),
  ).toBeVisible();
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
    .getByRole("button", { name: "Plan a visit from this result" })
    .click();
  expect((await pinned).method()).toBe("GET");
  await expect(
    page.getByRole("region", { name: "Personal services" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Plan this sample visit" }).click();
  await page.getByRole("button", { name: "Mark visit completed" }).click();
  await expect(page.getByText(/· Completed$/)).toBeVisible();
  expect(privateGuideCalls).toEqual([]);
  await page
    .getByRole("button", {
      name: "Withdraw my summary permission",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Personal services" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a sample account" }),
  ).toBeVisible();
});
