import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { IdentityWorkspace } from "../src/components/identity-workspace";
import { DemoRequestError, identityApi } from "../src/lib/identity";

vi.mock("../src/lib/identity", async (original) => ({
  ...(await original<typeof import("../src/lib/identity")>()),
  identityApi: vi.fn(),
}));

it("waits for private permission state before exposing signed-in controls", async () => {
  let release!: (value: unknown[]) => void;
  const permissions = new Promise<unknown[]>((resolve) => {
    release = resolve;
  });
  vi.mocked(identityApi).mockImplementation(async (path) => {
    if (path === "auth/session")
      throw new DemoRequestError("AUTHENTICATION_REQUIRED", "Sign in");
    if (path === "auth/csrf") return { csrf_token: "fictional-challenge" };
    if (path === "auth/login")
      return {
        user_id: "demo-user-a",
        username: "demo-a",
        role: "individual",
        display_name: "Fictional A",
        csrf_token: "fictional-csrf",
        demo_only: true,
        expires_at: "2026-12-01T12:00:00Z",
      };
    if (path === "me/consents") return permissions;
    if (path === "me/cases")
      return [
        {
          id: "syn-case-01",
          display_name: "Fictional A",
          scenario: "Synthetic only",
          input_version: 1,
          is_synthetic: true,
        },
      ];
    return [];
  });
  render(<IdentityWorkspace />);
  fireEvent.change(await screen.findByLabelText("Demo password"), {
    target: { value: "demo-a-only" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
  await waitFor(() => expect(identityApi).toHaveBeenCalledWith("me/consents"));
  expect(
    screen.queryByRole("button", { name: "Sign out" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Grant processing" }),
  ).not.toBeInTheDocument();
  release([]);
  expect(
    await screen.findByRole("button", { name: "Grant processing" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
});
