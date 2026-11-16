import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityWorkspace } from "../src/components/identity-workspace";
import { DemoRequestError, identityApi } from "../src/lib/identity";

vi.mock("../src/lib/identity", async (original) => ({
  ...(await original<typeof import("../src/lib/identity")>()),
  identityApi: vi.fn(),
}));

const current = {
  user_id: "demo-user-a",
  username: "demo-a",
  display_name: "Fictional participant A",
  role: "individual",
  csrf_token: "fictional-csrf-only",
  expires_at: "2026-12-01T12:00:00Z",
  demo_only: true,
};
const privateCase = {
  id: "syn-case-01",
  display_name: "Fictional participant A",
  scenario: "Fictional private metadata",
  input_version: 1,
  is_synthetic: true,
};
const api = vi.mocked(identityApi);

beforeEach(() => {
  api.mockReset();
});

describe("independent identity workspace", () => {
  it("signs in with a prelogin CSRF challenge and no browser role flag", async () => {
    api.mockImplementation(async (path) => {
      if (path === "auth/session")
        throw new DemoRequestError("AUTHENTICATION_REQUIRED", "Sign in");
      if (path === "auth/csrf")
        return { csrf_token: "fictional-prelogin-csrf" };
      if (path === "auth/login") return current;
      return path === "me/cases" ? [privateCase] : [];
    });
    render(<IdentityWorkspace />);
    fireEvent.change(await screen.findByLabelText("Demo password"), {
      target: { value: "demo-a-only" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", {
        name: "Your authorized case metadata",
      }),
    ).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith("auth/login", "fictional-prelogin-csrf", {
      username: "demo-a",
      password: "demo-a-only",
    });
    expect(screen.queryByLabelText("Demo password")).not.toBeInTheDocument();
  });

  it("records only the current user's own scoped choice with optimistic version", async () => {
    api.mockImplementation(async (path) =>
      path === "auth/session"
        ? current
        : path === "me/cases"
          ? [privateCase]
          : [],
    );
    render(<IdentityWorkspace />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Grant processing" }),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "me/consents",
        current.csrf_token,
        expect.objectContaining({
          scope: "processing",
          case_id: "syn-case-01",
          decision: "grant",
          expected_version: 0,
          target_version: 1,
        }),
      ),
    );
    const body = api.mock.calls.find(
      (call) => call[0] === "me/consents" && call[2],
    )?.[2];
    expect(body).not.toHaveProperty("user_id");
  });

  it("clears stale private data on session expiration", async () => {
    let expired = false;
    api.mockImplementation(async (path) => {
      if (path === "auth/session") return current;
      if (expired)
        throw new DemoRequestError("AUTHENTICATION_REQUIRED", "Expired");
      return path === "me/cases" ? [privateCase] : [];
    });
    render(<IdentityWorkspace />);
    const refresh = await screen.findByRole("button", {
      name: "Refresh private state",
    });
    await screen.findByText("Fictional private metadata");
    expired = true;
    fireEvent.click(refresh);
    expect(
      await screen.findByText(
        "Your demonstration session ended. Sign in again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Fictional private metadata"),
    ).not.toBeInTheDocument();
  });

  it("does not give support automatic case access", async () => {
    api.mockImplementation(async (path) => {
      if (path === "auth/session")
        return {
          ...current,
          role: "support",
          display_name: "Fictional support administrator",
        };
      if (path.startsWith("private/cases/"))
        throw new DemoRequestError(
          "RESOURCE_UNAVAILABLE",
          "Resource unavailable.",
        );
      return [];
    });
    render(<IdentityWorkspace />);
    expect(
      await screen.findByText(
        "Support has no automatic access to private case information.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Check case access" }));
    expect(
      await screen.findByText("Access denied: resource unavailable."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Grant processing" }),
    ).not.toBeInTheDocument();
  });
});
