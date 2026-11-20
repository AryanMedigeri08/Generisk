"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { ReportWorkspace } from "./report-workspace";
import { RiskCard } from "./risk-card";
import { JourneyStudio } from "./journey-studio";
import {
  identityApi,
  DemoRequestError,
  type DemoSession,
  type PrivateCase,
  type Permission,
  type Invitation,
  type Joint,
  type Audit,
} from "../lib/identity";

export function IdentityWorkspace({ hosted = false }: { hosted?: boolean }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("demo-a");
  const [password, setPassword] = useState("");
  const [cases, setCases] = useState<PrivateCase[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [joints, setJoints] = useState<Joint[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [recipient, setRecipient] = useState("demo-b");
  const [delivery, setDelivery] = useState<Invitation | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [checkId, setCheckId] = useState("syn-case-01");
  const [accessResult, setAccessResult] = useState("");

  function clear() {
    setCases([]);
    setPermissions([]);
    setInvitations([]);
    setJoints([]);
    setAudit([]);
    setDelivery(null);
    setCodes({});
    setAccessResult("");
  }

  async function load(current: DemoSession) {
    const [privateCases, choices, invites, requests, history] =
      await Promise.all([
        identityApi<PrivateCase[]>(
          current.role === "counsellor" ? "professional/cases" : "me/cases",
        ),
        identityApi<Permission[]>("me/consents"),
        identityApi<Invitation[]>("me/invitations"),
        identityApi<Joint[]>("me/joints"),
        identityApi<Audit[]>("me/audit"),
      ]);
    setCases(privateCases);
    setPermissions(choices);
    setInvitations(invites);
    setJoints(requests);
    setAudit(history);
  }

  useEffect(() => {
    let cancelled = false;
    identityApi<DemoSession>("auth/session")
      .then(async (current) => {
        if (!cancelled) {
          setSession(current);
          await load(current);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          clear();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function action(operation: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await operation();
    } catch (error) {
      if (
        error instanceof DemoRequestError &&
        error.code === "AUTHENTICATION_REQUIRED"
      ) {
        setSession(null);
        clear();
        setMessage("Your demonstration session ended. Sign in again.");
      } else
        setMessage(
          error instanceof DemoRequestError
            ? error.message
            : "The demonstration action is unavailable.",
        );
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    await login(username, password);
  }

  async function login(account: string, passphrase: string) {
    await action(async () => {
      const challenge = await identityApi<{ csrf_token: string }>("auth/csrf");
      const current = await identityApi<DemoSession>(
        "auth/login",
        challenge.csrf_token,
        { username: account, password: passphrase },
      );
      setPassword("");
      clear();
      setRecipient(current.username === "demo-a" ? "demo-b" : "demo-a");
      await load(current);
      // Expose authenticated controls only after their current permission state is ready.
      setSession(current);
      setMessage("Signed in. Start with your permission choice below.");
    });
  }

  async function choose(
    scope: Permission["scope"],
    target: PrivateCase | Joint,
    decision: "grant" | "refuse" | "withdraw",
  ) {
    if (!session) return;
    const caseId = scope === "processing" ? target.id : null;
    const jointId = scope === "processing" ? null : target.id;
    const targetVersion =
      "input_version" in target
        ? target.input_version
        : scope === "assessment"
          ? target.version
          : target.output_version;
    const own = permissions.find(
      (item) =>
        item.scope === scope &&
        item.case_id === caseId &&
        item.joint_id === jointId &&
        item.target_version === targetVersion,
    );
    await action(async () => {
      await identityApi("me/consents", session.csrf_token, {
        scope,
        case_id: caseId,
        joint_id: jointId,
        target_version: targetVersion,
        audience: "participants",
        decision,
        expected_version: own?.version ?? 0,
        idempotency_key: crypto.randomUUID(),
      });
      await load(session);
      setMessage(
        decision === "withdraw"
          ? "Permission withdrawn. Future dependent access is blocked; prior viewing cannot be undone."
          : "Your own scoped choice was recorded.",
      );
    });
  }

  function controls(scope: Permission["scope"], target: PrivateCase | Joint) {
    const version =
      "input_version" in target
        ? target.input_version
        : scope === "assessment"
          ? target.version
          : target.output_version;
    const own = permissions.find(
      (item) =>
        item.scope === scope &&
        (scope === "processing" ? item.case_id : item.joint_id) === target.id &&
        item.target_version === version,
    );
    return (
      <div className="choice-group">
        <p className="permission-state">
          Your {scope} choice: <strong>{own?.state ?? "not granted"}</strong>
          <span>
            {" "}
            · scope v{version}, decision v{own?.version ?? 0}
          </span>
        </p>
        <div className="choice-buttons">
          <button
            disabled={busy || own?.state === "granted"}
            onClick={() => choose(scope, target, "grant")}
          >
            Grant {scope}
          </button>
          <button
            disabled={busy || own?.state === "refused"}
            onClick={() => choose(scope, target, "refuse")}
          >
            Refuse {scope}
          </button>
          <button
            disabled={busy || !own || own.state === "withdrawn"}
            onClick={() => choose(scope, target, "withdraw")}
          >
            Withdraw {scope}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="demo-notice">SYNTHETIC DEMO — NOT FOR CLINICAL USE</div>
      <main id="main" tabIndex={-1} className="identity-workspace">
        <h1>Your private workspace</h1>
        <p className="workspace-intro">
          Use a sample account to explore a report. You control whether it can
          be used, compared with a partner’s, or shared.
        </p>
        <div role="status" aria-live="polite" className="workspace-message">
          {message}
        </div>
        {loading ? (
          <p>Checking your local demonstration session…</p>
        ) : !session ? (
          <section className="identity-card" aria-labelledby="signin-title">
            <h2 id="signin-title">
              {hosted
                ? "Sign in to the hosted demo"
                : "Choose a sample account"}
            </h2>
            <p>
              {hosted
                ? "Use the sample username and password provided by the demo organizer. Each partner signs in separately."
                : "Each partner has a separate sign-in. Choose one to begin. No registration or personal details are needed."}
            </p>
            {!hosted && (
              <div className="guide-actions">
                {(["a", "b"] as const).map((person) => (
                  <button
                    key={person}
                    disabled={busy}
                    onClick={() =>
                      void login("demo-" + person, "demo-" + person + "-only")
                    }
                  >
                    Continue as partner {person.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <details className="demo-credentials" open={hosted || undefined}>
              <summary>
                {hosted
                  ? "Demo account sign-in"
                  : "Sign in with a username instead"}
              </summary>
              <form onSubmit={signIn} className="identity-form">
                <label htmlFor="username">Demo username</label>
                <input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  maxLength={64}
                />
                <label htmlFor="password">Demo password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={128}
                />
                <button
                  className="primary-choice"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </details>
            {!hosted && (
              <details className="demo-credentials">
                <summary>Public fictional demo credentials</summary>
                <p>
                  These known local-only credentials are unsuitable for an
                  internet-facing service. Use separate browser contexts to act
                  independently.
                </p>
                <ul>
                  {["demo-a", "demo-b", "demo-counsellor", "demo-support"].map(
                    (name) => (
                      <li key={name}>
                        <code>{name}</code> / <code>{name}-only</code>
                      </li>
                    ),
                  )}
                </ul>
              </details>
            )}
          </section>
        ) : (
          <>
            <section
              className="identity-card session-card"
              aria-labelledby="session-title"
            >
              <div>
                <h2 id="session-title">
                  {session.username === "demo-a"
                    ? "Partner A"
                    : session.username === "demo-b"
                      ? "Partner B"
                      : session.display_name}
                </h2>
                <p>
                  Sample account · <strong>{session.role}</strong> · Session
                  expires {new Date(session.expires_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="choice-buttons">
                <button
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await load(session);
                      setMessage(
                        "Your private demonstration state was refreshed.",
                      );
                    })
                  }
                >
                  Refresh private state
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await identityApi("auth/logout", session.csrf_token, {});
                      setSession(null);
                      clear();
                      setMessage("Signed out. The server session is revoked.");
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </section>
            {session.role === "individual" && (
              <nav
                className="workspace-guide"
                aria-label="Private workspace steps"
              >
                <h2>Work through your report</h2>
                <ol>
                  <li>
                    <a href="#workspace-permissions">
                      Choose whether to allow processing
                    </a>
                  </li>
                  <li>
                    <a href="#reports-title">
                      Select a gene-level sample report
                    </a>
                  </li>
                  <li>
                    <a href="#risk-title">
                      Review permission and calculate your result
                    </a>
                  </li>
                  <li>
                    <a href="#invite-title">
                      Invite a partner if you want a joint review
                    </a>
                  </li>
                </ol>
                <p>
                  Changing reports asks for fresh permission. Each partner makes
                  their own choices.
                </p>
              </nav>
            )}
            <section
              id="workspace-permissions"
              className="identity-card"
              aria-labelledby="private-title"
            >
              <h2 id="private-title">Your report permissions</h2>
              {cases.length ? (
                cases.map((record) => (
                  <article className="private-case" key={record.id}>
                    <h3>Use this sample report</h3>
                    <details className="demo-credentials">
                      <summary>Sample record details</summary>
                      <strong>{record.display_name}</strong>
                      <p>
                        {record.id} · Input version {record.input_version} ·
                        Synthetic only
                      </p>
                      <p>{record.scenario}</p>
                    </details>
                    {session.role === "individual" && (
                      <p>
                        Allow processing to open and use the sample report. An
                        assigned demo counsellor can then see basic case
                        details. Your partner still needs separate permission
                        for a comparison and for sharing the result.
                      </p>
                    )}
                    {session.role === "individual" &&
                      controls("processing", record)}
                  </article>
                ))
              ) : (
                <p>
                  No private cases are authorized for this role and current
                  permissions.
                </p>
              )}
              {session.role === "counsellor" && (
                <p>
                  Only assigned metadata with current owner processing
                  permission is shown. This fictional role is not a verified
                  professional.
                </p>
              )}
              {session.role === "support" && (
                <p>
                  Support has no automatic access to private case information.
                </p>
              )}
            </section>
            {session.role === "individual" && (
              <>
                <ReportWorkspace
                  session={session}
                  currentCase={cases[0]}
                  permissions={permissions}
                  refresh={() => load(session)}
                  perform={action}
                />
                <RiskCard
                  parentBusy={busy}
                  session={session}
                  currentCase={cases[0]}
                  permissions={permissions}
                  joints={joints}
                  refresh={() => load(session)}
                  perform={action}
                />
                <JourneyStudio
                  key={session.user_id}
                  session={session}
                  permissions={permissions}
                />
                <section
                  className="identity-card"
                  aria-labelledby="invite-title"
                >
                  <h2 id="invite-title">Invite independently</h2>
                  <p>
                    An invitation contains no genetic findings. Acceptance
                    creates no processing, assessment or disclosure permission.
                  </p>
                  <form
                    className="inline-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      action(async () => {
                        const created = await identityApi<Invitation>(
                          "invitations",
                          session.csrf_token,
                          { recipient_username: recipient },
                        );
                        setDelivery(created);
                        await load(session);
                        setMessage(
                          "Fictional invitation created. Deliver its code privately to the intended participant.",
                        );
                      });
                    }}
                  >
                    <label htmlFor="recipient">Fictional recipient</label>
                    <select
                      id="recipient"
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                    >
                      {["demo-a", "demo-b"]
                        .filter((name) => name !== session.username)
                        .map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                    </select>
                    <button disabled={busy} type="submit">
                      Create invitation
                    </button>
                  </form>
                  {delivery && (
                    <div className="delivery-code" data-sensitive>
                      <p>
                        Copy the one-time code before switching accounts. It is
                        not stored in browser storage.
                      </p>
                      <label htmlFor="delivery-id">Invitation ID</label>
                      <input id="delivery-id" readOnly value={delivery.id} />
                      <label htmlFor="delivery-token">
                        Recipient-bound invitation code
                      </label>
                      <input
                        id="delivery-token"
                        readOnly
                        value={delivery.delivery_token ?? ""}
                      />
                    </div>
                  )}
                  <div className="invitation-list">
                    {invitations.map((invite) => (
                      <article
                        key={invite.id}
                        className="invitation-row"
                        data-invitation-id={invite.id}
                      >
                        <h3>
                          Invitation <bdi>{invite.id.slice(0, 8)}</bdi>
                        </h3>
                        <p>Status: {invite.status}</p>
                        {invite.status === "pending" && (
                          <>
                            <label htmlFor={`code-${invite.id}`}>
                              Invitation code
                            </label>
                            <input
                              data-sensitive
                              id={`code-${invite.id}`}
                              value={codes[invite.id] ?? ""}
                              onChange={(event) =>
                                setCodes({
                                  ...codes,
                                  [invite.id]: event.target.value,
                                })
                              }
                              autoComplete="off"
                            />
                            <div className="choice-buttons">
                              {["accept", "decline"].map((decision) => (
                                <button
                                  key={decision}
                                  disabled={busy || !codes[invite.id]}
                                  onClick={() =>
                                    action(async () => {
                                      await identityApi(
                                        `invitations/${invite.id}/decision`,
                                        session.csrf_token,
                                        { token: codes[invite.id], decision },
                                      );
                                      setCodes({});
                                      await load(session);
                                      setMessage(
                                        "Your independent invitation decision was recorded.",
                                      );
                                    })
                                  }
                                >
                                  {decision === "accept"
                                    ? "Accept invitation"
                                    : "Decline invitation"}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
                <section
                  className="identity-card"
                  aria-labelledby="joint-title"
                >
                  <h2 id="joint-title">Joint demonstration requests</h2>
                  <p>
                    Only a neutral availability state is shared. Your partner
                    cannot view your private choice or a refusal reason.
                  </p>
                  {!joints.length && (
                    <p>No accepted joint invitation exists.</p>
                  )}
                  {joints.map((joint) => (
                    <article
                      className="joint-row"
                      key={joint.id}
                      data-joint-id={joint.id}
                    >
                      <h3>
                        Joint request <bdi>{joint.id.slice(0, 8)}</bdi>
                      </h3>
                      <p className="joint-availability">
                        {joint.status === "available_for_demo_review"
                          ? "Joint review available for demo"
                          : "Joint review unavailable"}
                      </p>
                      {controls("assessment", joint)}
                      <div className="disclosure-boundary">
                        <h4>Separate result disclosure</h4>
                        <p>
                          Both partners decide whether a reviewed sample outcome
                          can be shared. Permission to compare reports is a
                          separate choice.
                        </p>
                        {joint.placeholder_reviewed ? (
                          controls("disclosure", joint)
                        ) : (
                          <button disabled>
                            Disclosure unavailable — no reviewed output
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </section>
              </>
            )}
            <section className="identity-card" aria-labelledby="access-title">
              <h2 id="access-title">Check the access boundary</h2>
              <p>
                Owner, role, current permission and professional assignment are
                checked on the server. No browser role switch grants access.
              </p>
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setAccessResult("");
                  action(async () => {
                    try {
                      const result = await identityApi<PrivateCase>(
                        `private/cases/${checkId}`,
                      );
                      setAccessResult(
                        `Authorized synthetic case: ${result.id}`,
                      );
                    } catch (error) {
                      if (
                        error instanceof DemoRequestError &&
                        error.code === "AUTHENTICATION_REQUIRED"
                      )
                        throw error;
                      setAccessResult("Access denied: resource unavailable.");
                    }
                  });
                }}
              >
                <label htmlFor="case-check">Fictional case</label>
                <select
                  id="case-check"
                  value={checkId}
                  onChange={(event) => setCheckId(event.target.value)}
                >
                  <option>syn-case-01</option>
                  <option>syn-case-02</option>
                </select>
                <button disabled={busy}>Check case access</button>
              </form>
              <p role="status">{accessResult}</p>
            </section>
            <section className="identity-card" aria-labelledby="history-title">
              <h2 id="history-title">Your minimal activity history</h2>
              <p>
                Only your own audit events are visible. Passwords, session
                tokens, invitation codes and clinical content are excluded.
              </p>
              <ul className="audit-list">
                {audit.slice(0, 12).map((event) => (
                  <li key={event.id}>
                    <span>{event.action.replaceAll("_", " ")}</span>
                    <strong>{event.decision}</strong>
                    {event.version !== null && <span>v{event.version}</span>}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
      <footer>
        <Link href="/">Return home</Link>
        <p>
          Synthetic demo only. No medical advice or real-world clinical
          authorization.
        </p>
      </footer>
    </>
  );
}
