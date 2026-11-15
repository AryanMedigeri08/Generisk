export type DemoSession = {
  user_id: string;
  username: string;
  display_name: string;
  role: "individual" | "counsellor" | "support";
  csrf_token: string;
  expires_at: string;
  demo_only: true;
};
export type PrivateCase = {
  id: string;
  display_name: string;
  scenario: string;
  input_version: number;
  is_synthetic: true;
};
export type Permission = {
  id: string;
  scope: "processing" | "assessment" | "disclosure";
  scope_key: string;
  state: string;
  version: number;
  target_version: number;
  case_id: string | null;
  joint_id: string | null;
  expires_at: string | null;
};
export type Invitation = {
  id: string;
  status: string;
  joint_id: string | null;
  delivery_token: string | null;
  expires_at: string | null;
};
export type Joint = {
  id: string;
  version: number;
  output_version: number;
  status: "available_for_demo_review" | "unavailable";
  can_disclose: boolean;
  placeholder_reviewed: boolean;
};
export type Audit = {
  id: string;
  action: string;
  purpose: string;
  resource_id: string | null;
  decision: string;
  version: number | null;
  created_at: string;
};

export class DemoRequestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function identityApi<T>(
  path: string,
  csrf?: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "X-Demo-Request": "1" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const response = await fetch(`/api/p03/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await response.json();
  if (!response.ok)
    throw new DemoRequestError(
      data.error?.code ?? "DEMO_UNAVAILABLE",
      data.error?.message ?? "The demonstration action is unavailable.",
    );
  return data as T;
}
