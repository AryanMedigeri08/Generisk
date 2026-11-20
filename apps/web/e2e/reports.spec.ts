import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ trace: "off" }); // Do not retain authenticated session/CSRF/invitation values.
test.describe.configure({ retries: 0 }); // This full journey requires a fresh disposable Compose volume.

async function signIn(page: Page, username: string) {
  await page.goto("/workspace");
  await page.getByText("Sign in with a username instead").click();
  await page.getByLabel("Demo username").fill(username);
  await page.getByLabel("Demo password").fill(`${username}-only`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

async function grantProcessing(page: Page) {
  const button = page.getByRole("button", {
    name: "Grant processing",
    exact: true,
  });
  if (await button.isEnabled()) await button.click();
  await expect(page.locator(".private-case")).toContainText(
    "Your processing choice: granted",
  );
}

test("P04 fixture validation, provenance, independent access and correction work through PostgreSQL", async ({
  browser,
}, info) => {
  test.setTimeout(120000);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:13000";
  const aContext = await browser.newContext({ baseURL });
  const bContext = await browser.newContext({ baseURL });
  const reportURLs: string[] = [];
  try {
    const a = await aContext.newPage(),
      b = await bContext.newPage();
    a.on("request", (request) => {
      if (request.url().includes("/api/p03/reports"))
        reportURLs.push(request.url());
    });
    await signIn(a, "demo-a");
    await grantProcessing(a);
    const section = a.locator(".report-workspace");
    await section.getByText("Other samples and validation tools").click();
    await section
      .getByLabel("Allowlisted synthetic fixture")
      .selectOption("fixture-a-unsupported");
    await section
      .getByRole("button", { name: "Import selected fixture" })
      .click();
    await expect(
      section.getByRole("heading", { name: "Validation outcome: unsupported" }),
    ).toBeVisible();
    await section
      .getByLabel("Allowlisted synthetic fixture")
      .selectOption("fixture-a-incomplete");
    await section
      .getByRole("button", { name: "Import selected fixture" })
      .click();
    await expect(
      section.getByRole("heading", {
        name: "Validation outcome: review required",
      }),
    ).toBeVisible();
    await expect(section.locator(".report-permission")).toBeVisible();
    await grantProcessing(a);
    const incomplete = section.locator(
      '[data-report-source="syn-report-a-incomplete"]',
    );
    await incomplete.getByRole("button", { name: "View revision 1" }).click();
    await expect(section.locator(".report-detail")).toContainText(
      "Coverage missing",
    );
    await expect(section.locator(".report-detail")).toContainText(
      "Non-interpretable review required",
    );

    await section
      .getByLabel("Allowlisted synthetic fixture")
      .selectOption("fixture-a-complete");
    const importedResponse = a.waitForResponse(
      (r) =>
        r.url().endsWith("/reports/import") && r.request().method() === "POST",
    );
    await section
      .getByRole("button", { name: "Import selected fixture" })
      .click();
    const imported = await (await importedResponse).json();
    expect(imported.category).toBe("accepted");
    await expect(section.locator(".report-permission")).toBeVisible();
    await grantProcessing(a);
    const report = section.locator(
      '[data-report-source="syn-report-a-complete"]',
    );
    await report.getByRole("button", { name: "View revision 1" }).click();
    await expect(section.locator(".report-detail")).toContainText(
      "demo-token-amber",
    );
    await expect(section.locator(".report-detail")).toContainText(
      "Excluded fictional markers: syn-marker-kite",
    );
    const originalHash = await section.locator(".source-digest").innerText();

    await signIn(b, "demo-b");
    await grantProcessing(b);
    await a.getByRole("button", { name: "Create invitation" }).click();
    const invitationId = await a
      .getByLabel("Invitation ID", { exact: true })
      .inputValue();
    const invitationCode = await a
      .getByLabel("Recipient-bound invitation code")
      .inputValue();
    await b.getByRole("button", { name: "Refresh private state" }).click();
    const invitation = b.locator(`[data-invitation-id="${invitationId}"]`);
    await invitation.getByLabel("Invitation code").fill(invitationCode);
    const acceptedResponse = b.waitForResponse(
      (r) =>
        r.url().endsWith(`/invitations/${invitationId}/decision`) &&
        r.request().method() === "POST",
    );
    await invitation.getByRole("button", { name: "Accept invitation" }).click();
    const jointId = (await (await acceptedResponse).json()).joint_id as string;
    await a.getByRole("button", { name: "Refresh private state" }).click();
    const aJoint = a.locator(`[data-joint-id="${jointId}"]`),
      bJoint = b.locator(`[data-joint-id="${jointId}"]`);
    await aJoint
      .getByRole("button", { name: "Grant assessment", exact: true })
      .click();
    await bJoint
      .getByRole("button", { name: "Grant assessment", exact: true })
      .click();
    await expect(bJoint.locator(".joint-availability")).toHaveText(
      "Joint review available for demo",
    );
    await report
      .getByRole("button", { name: "Apply predefined correction" })
      .click();
    await expect(section.locator(".report-permission")).toBeVisible();
    await b.getByRole("button", { name: "Refresh private state" }).click();
    await expect(bJoint.locator(".joint-availability")).toHaveText(
      "Joint review unavailable",
    );
    await expect(bJoint).not.toContainText("superseded");
    await grantProcessing(a);
    await expect(report).toContainText("Revision 1: superseded");
    await expect(report).toContainText("Revision 2: active");
    await report.getByRole("button", { name: "View revision 1" }).click();
    await expect(section.locator(".report-detail")).toContainText(
      "demo-token-amber",
    );
    expect(await section.locator(".source-digest").innerText()).toBe(
      originalHash,
    );
    await report.getByRole("button", { name: "View revision 2" }).focus();
    await a.keyboard.press("Enter");
    await expect(section.locator(".report-detail")).toContainText(
      "demo-token-blue",
    );
    await expect(section.locator(".report-detail")).toContainText(
      "synthetic field correction",
    );
    expect(await section.locator(".source-digest").innerText()).not.toBe(
      originalHash,
    );

    const session = await (
      await bContext.request.get("/api/p03/auth/session", {
        headers: { "X-Demo-Request": "1" },
      })
    ).json();
    const denied = await bContext.request.post("/api/p03/reports/view", {
      headers: {
        "X-Demo-Request": "1",
        "X-CSRF-Token": session.csrf_token,
        Origin: new URL(baseURL).origin,
      },
      data: { report_handle: imported.report_handle },
    });
    expect(denied.status()).toBe(404);
    expect(await denied.text()).not.toContain("syn-marker");
    expect(await a.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(
      reportURLs.every(
        (url) => !url.includes(imported.report_handle) && !new URL(url).search,
      ),
    ).toBe(true);
    await section.screenshot({
      path: info.outputPath("p04-report-correction-desktop.png"),
    });
    await a.setViewportSize({ width: 375, height: 812 });
    const axe = await new AxeBuilder({ page: a })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await a.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await section.screenshot({
      path: info.outputPath("p04-report-correction-mobile.png"),
    });
    await a
      .getByRole("button", { name: "Withdraw processing", exact: true })
      .click();
    await expect(section.locator(".report-permission")).toBeVisible();
    await expect(section.locator(".report-detail")).toHaveCount(0);
    await expect(section.locator(".report-record")).toHaveCount(0);
  } finally {
    await aContext.close();
    await bContext.close();
  }
});
