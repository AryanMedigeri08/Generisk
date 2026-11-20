"use client";

import Link from "next/link";
import { StudioLink } from "../content/locale";
import { useState } from "react";
import { type DemoSnapshot, unavailableSnapshot } from "../lib/demo";

export function DemoDashboard({
  initialSnapshot,
}: {
  initialSnapshot: DemoSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/demo", { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      const next: DemoSnapshot = await response.json();
      setSnapshot(next);
      setAnnouncement("Demonstration status refreshed.");
    } catch {
      setSnapshot(unavailableSnapshot);
      setAnnouncement(
        "The demonstration service is unavailable. No results have been generated.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <div className="demo-notice">
        SYNTHETIC DEMONSTRATION <span aria-hidden="true">·</span> NOT FOR
        CLINICAL USE
      </div>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Amanah Genetics home">
          <span className="brand-symbol" aria-hidden="true">
            ✳
          </span>
          <span>
            Amanah<span className="brand-subtitle">GENETICS</span>
          </span>
        </Link>
        <StudioLink />
        <Link className="phase-badge" href="/workspace">
          P03 / PRIVATE DEMO
        </Link>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">UNDERSTANDING STARTS WITH TRUST</p>
            <h1 id="hero-title">
              A thoughtful foundation.
              <br />
              <span>A fictional beginning.</span>
            </h1>
            <p className="hero-description">
              Explore the building blocks of a privacy-first genetics education
              experience. Every person and scenario here is invented.
            </p>
            <a className="hero-link" href="#demo-workspace">
              Explore the demo <span aria-hidden="true">↗</span>
            </a>
            <Link className="atlas-entry" href="/care-atlas">
              Open Care Atlas <span aria-hidden="true">↗</span>
            </Link>
            <Link className="atlas-entry" href="/journey">
              Open Journey Studio <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-center">
              a<span>built with care</span>
            </div>
            <span className="art-label">INDIVIDUAL CHOICE</span>
          </div>
        </section>
        <section
          className="workspace"
          id="demo-workspace"
          aria-labelledby="workspace-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE DEMONSTRATION WORKSPACE</p>
              <h2 id="workspace-title">Small steps. Clear boundaries.</h2>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={refresh}
              disabled={refreshing}
            >
              <span aria-hidden="true">↻</span>{" "}
              {refreshing ? "Refreshing…" : "Refresh demo status"}
            </button>
          </div>
          <div className="status-strip" aria-label="Foundation service status">
            <p>
              <span
                className={`status-dot ${snapshot.api === "online" ? "ready" : ""}`}
                aria-hidden="true"
              />
              API{" "}
              <strong>
                {snapshot.api === "online" ? "Online" : "Unavailable"}
              </strong>
            </p>
            <p>
              <span
                className={`status-dot ${snapshot.database === "ready" ? "ready" : ""}`}
                aria-hidden="true"
              />
              Database{" "}
              <strong>
                {snapshot.database === "ready" ? "Ready" : "Unavailable"}
              </strong>
            </p>
            <p>
              <span className="status-dot" aria-hidden="true" />
              Clinical features <strong>Disabled</strong>
            </p>
          </div>
          <div role="status" aria-live="polite" className="announcement">
            {announcement}
          </div>
          <div className="workspace-grid">
            <section className="fixture-panel" aria-labelledby="fixtures-title">
              <div className="panel-heading">
                <h3 id="fixtures-title">Fictional journeys</h3>
                <span className="small-tag">SYNTHETIC ONLY</span>
              </div>
              <p className="panel-description">
                Read-only fixtures loaded from the demonstration database. No
                reports, findings or assessments.
              </p>
              {snapshot.cases.length ? (
                snapshot.cases.map((item, index) => (
                  <article className="case-card" key={item.id}>
                    <span className="case-avatar" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div>
                      <h4>{item.display_name}</h4>
                      <p>{item.scenario}</p>
                      <span className="case-label">
                        Fictional fixture · Foundation only
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-state">
                  Fictional fixtures are unavailable. Check the local API and
                  database; no clinical result is implied.
                </p>
              )}
            </section>
            <aside
              className="boundary-panel"
              aria-labelledby="boundaries-title"
            >
              <span className="boundary-icon" aria-hidden="true">
                ◇
              </span>
              <p className="eyebrow">PRIVATE BY DESIGN</p>
              <h3 id="boundaries-title">A boundary worth keeping.</h3>
              <p>
                Sign in independently with fictional accounts. Processing,
                assessment and disclosure are separate choices checked on the
                server.
              </p>
              <div className="locked-label">
                <span aria-hidden="true">⊘</span> Independent sign-in required
              </div>
              <p className="boundary-footnote">
                <Link href="/workspace">Open the private demo workspace</Link>
              </p>
            </aside>
          </div>
          <section
            className="knowledge-panel"
            aria-labelledby="knowledge-title"
          >
            <span className="knowledge-icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <p className="eyebrow">EDUCATION, WHEN IT IS READY</p>
              <h3 id="knowledge-title">
                Approved knowledge is not yet available.
              </h3>
              <p>
                The approved corpus is empty. This demo returns a safe
                unavailable state and does not generate medical answers.
              </p>
            </div>
            <span className="small-tag">NO MODEL CALLS</span>
          </section>
        </section>
      </main>
      <footer>
        <span>
          Amanah Genetics <span aria-hidden="true">/</span> Hackathon foundation
        </span>
        <p>
          Fictional examples only. No medical advice, diagnosis or real-world
          clinical authorization.
        </p>
      </footer>
    </>
  );
}
