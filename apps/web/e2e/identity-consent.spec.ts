import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ trace: "off" }); // Never retain session/CSRF/invitation secrets in browser traces.

async function signIn(page: Page, username: string) {
  await page.goto("/workspace");
  await page.getByText("Sign in with a username instead").click();
  await page.getByLabel("Demo username").fill(username);
  await page.getByLabel("Demo password").fill(`${username}-only`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test.describe.serial("P03 independent synthetic identities and choices", () => {
  test("two isolated people invite, accept, grant independently and withdraw without disclosure", async ({
    browser,
  }, info) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:13000";
    const aContext = await browser.newContext({ baseURL });
    const bContext = await browser.newContext({ baseURL });
    try {
      const a = await aContext.newPage(),
        b = await bContext.newPage();
      await signIn(a, "demo-a");
      await signIn(b, "demo-b");
      await expect(a.locator(".private-case")).toContainText("syn-case-01");
      await expect(a.locator(".private-case")).not.toContainText("syn-case-02");
      await expect(b.locator(".private-case")).toContainText("syn-case-02");
      expect(
        await a.evaluate(() => document.cookie.includes("amanah_demo_session")),
      ).toBe(false);
      expect(await a.evaluate(() => Object.keys(localStorage))).toEqual([]);
      for (const page of [a, b]) {
        const grant = page.getByRole("button", {
          name: "Grant processing",
          exact: true,
        });
        if (await grant.isEnabled()) await grant.click();
        await expect(page.locator(".private-case")).toContainText(
          "Your processing choice: granted",
        );
      }
      await a.getByRole("button", { name: "Create invitation" }).click();
      const id = await a
        .getByLabel("Invitation ID", { exact: true })
        .inputValue();
      const code = await a
        .getByLabel("Recipient-bound invitation code")
        .inputValue();
      await b.getByRole("button", { name: "Refresh private state" }).click();
      const invitation = b.locator(`[data-invitation-id="${id}"]`);
      await invitation.getByLabel("Invitation code").fill(code);
      const acceptedResponse = b.waitForResponse(
        (response) =>
          response.url().endsWith(`/invitations/${id}/decision`) &&
          response.request().method() === "POST",
      );
      await invitation
        .getByRole("button", { name: "Accept invitation" })
        .click();
      await expect(invitation).toContainText("accepted");
      await a.getByRole("button", { name: "Refresh private state" }).click();
      const jointId = (await (await acceptedResponse).json())
        .joint_id as string;
      expect(jointId).toBeTruthy();
      const aJoint = a.locator(`[data-joint-id="${jointId}"]`);
      const bJoint = b.locator(`[data-joint-id="${jointId}"]`);
      await expect(aJoint).toContainText("Your assessment choice: not granted");
      await expect(bJoint).toContainText("Your assessment choice: not granted");
      await aJoint
        .getByRole("button", { name: "Grant assessment", exact: true })
        .click();
      await expect(aJoint).toContainText("Your assessment choice: granted");
      await expect(aJoint.locator(".joint-availability")).toHaveText(
        "Joint review unavailable",
      );
      await bJoint
        .getByRole("button", { name: "Grant assessment", exact: true })
        .click();
      await expect(bJoint.locator(".joint-availability")).toHaveText(
        "Joint review available for demo",
      );
      await expect(
        bJoint.getByRole("button", { name: /Disclosure unavailable/ }),
      ).toBeDisabled();
      await a.getByRole("button", { name: "Refresh private state" }).click();
      await expect(aJoint.locator(".joint-availability")).toHaveText(
        "Joint review available for demo",
      );
      await aJoint
        .getByRole("button", { name: "Withdraw assessment", exact: true })
        .click();
      await expect(aJoint).toContainText("Your assessment choice: withdrawn");
      await expect(aJoint.locator(".joint-availability")).toHaveText(
        "Joint review unavailable",
      );
      await b.getByRole("button", { name: "Refresh private state" }).click();
      await expect(bJoint.locator(".joint-availability")).toHaveText(
        "Joint review unavailable",
      );
      await expect(bJoint).not.toContainText("withdrawn");
      const blocked = await bContext.request.get(
        `/api/p03/joints/${jointId}/output`,
        { headers: { "X-Demo-Request": "1" } },
      );
      expect(blocked.status()).toBe(403);
      await a.screenshot({
        path: info.outputPath("p03-independent-consent.png"),
        fullPage: true,
        mask: [a.locator("[data-sensitive]")],
      });
    } finally {
      await aContext.close();
      await bContext.close();
    }
  });

  test("counsellor assignment is narrow and support has no private case bypass", async ({
    page,
  }) => {
    await signIn(page, "demo-counsellor");
    await expect(page.locator(".private-case")).toContainText("syn-case-01");
    await page
      .getByLabel("Fictional case", { exact: true })
      .selectOption("syn-case-02");
    await page.getByRole("button", { name: "Check case access" }).click();
    await expect(
      page.getByText("Access denied: resource unavailable."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "demo-support");
    await expect(
      page.getByText(
        "Support has no automatic access to private case information.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Check case access" }).click();
    await expect(
      page.getByText("Access denied: resource unavailable."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
  });

  test("browser cookie sessions reject missing CSRF and logout revokes access", async ({
    page,
  }) => {
    await signIn(page, "demo-b");
    const response = await page.evaluate(async () => {
      const result = await fetch("/api/p03/auth/logout", {
        method: "POST",
        headers: { "X-Demo-Request": "1", "Content-Type": "application/json" },
        body: "{}",
      });
      return result.status;
    });
    expect(response).toBe(403);
    await page.getByRole("button", { name: "Refresh private state" }).click();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(
      page.getByRole("heading", { name: "Choose a sample account" }),
    ).toBeVisible();
    const status = await page.evaluate(
      async () =>
        (
          await fetch("/api/p03/me/cases", {
            headers: { "X-Demo-Request": "1" },
          })
        ).status,
    );
    expect(status).toBe(401);
  });

  test("mobile sign-in has keyboard access, no horizontal overflow or detected axe violations", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/workspace");
    await expect(
      page.getByRole("button", { name: "Continue as partner A" }),
    ).toBeVisible();
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("p03-mobile-signin.png"),
      fullPage: true,
    });
  });
});
