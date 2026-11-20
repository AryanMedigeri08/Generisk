"use client";
import { useContent } from "../../content/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import { interpolate, type Card, type Lesson } from "../../content/loader";
import { CopyShape, CopiesReveal, GeneKeys } from "./gene-keys";
import { NextHundred, OnePregnancy } from "./chance-widgets";
import { FamilyTree, NegativeBar } from "./server-widgets";
import { ResultExplainer } from "./result-explainer";
import { preview, type Preview } from "../../lib/learn/previews";
import { useVisited } from "./studio-shell";
export function StudioOverview() {
  const content = useContent();
  const { ui, lessons } = content;
  const { visited } = useVisited();
  return (
    <main id="main" tabIndex={-1} className="learn-main">
      <section className="learn-hero">
        <div>
          <p className="learn-eyebrow">{ui.overview_eyebrow}</p>
          <h1>{ui.overview_title}</h1>
          <p className="learn-lede">{ui.overview_body}</p>
          <p className="learn-subtle">{ui.overview_note}</p>
        </div>
        <figure className="learn-hero-figure">
          <div>
            <CopyShape copy="working" />
            <CopyShape copy="changed" />
          </div>
          <figcaption>{ui.overview_art}</figcaption>
        </figure>
      </section>
      <div className="module-grid">
        {lessons.map((m) => (
          <Link
            href={`/learn/${m.module_id}`}
            key={m.module_id}
            className="module-link"
          >
            <span className="module-number">{m.module_number}</span>
            <span className="module-duration">{m.duration}</span>
            <h2>{m.title}</h2>
            <p>{m.summary}</p>
            <span className="module-cta">
              {visited.includes(m.module_id) ? ui.visited : ui.start_module}
              <span aria-hidden="true">↗</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
function Options() {
  const content = useContent();
  const { ui } = content;
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <div className="options-widget">
      <h3>{ui.options_heading}</h3>
      <div className="option-grid">
        {ui.options.map((option) => (
          <article key={option.id}>
            <h4>{option.title}</h4>
            <p>{option.body}</p>
            <p className="option-availability">{ui.availability}</p>
          </article>
        ))}
      </div>
      <fieldset className="counsellor-questions">
        <legend>{ui.checklist}</legend>
        <p>{ui.checklist_note}</p>
        {ui.questions.map((question) => (
          <label key={question}>
            <input
              type="checkbox"
              checked={checked.includes(question)}
              onChange={(e) =>
                setChecked((old) =>
                  e.target.checked
                    ? [...old, question]
                    : old.filter((q) => q !== question),
                )
              }
            />
            {question}
          </label>
        ))}
        <button onClick={() => setChecked([])}>{ui.clear_questions}</button>
      </fieldset>
    </div>
  );
}
export function ResultPreview() {
  const content = useContent();
  const { ui } = content;
  const [kind, setKind] = useState<Preview>("own");
  return (
    <section className="fictional-result-preview">
      <h3>{ui.result_preview}</h3>
      <p>{ui.preview_note}</p>
      <label htmlFor="preview-kind">{ui.preview_kind}</label>
      <select
        id="preview-kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as Preview)}
      >
        {(["own", "couple", "unavailable"] as const).map((k) => (
          <option key={k} value={k}>
            {ui[`preview_${k}`]}
          </option>
        ))}
      </select>
      <div aria-live="polite">
        <ResultExplainer output={preview(kind, ui.banner)} />
      </div>
      <Link href="/workspace">{ui.go_workspace}</Link>
    </section>
  );
}
function Widget({ card, lesson }: { card: Card; lesson: Lesson }) {
  const content = useContent();
  const { ui } = content;
  switch (card.widget) {
    case "gene-keys":
      return lesson.module_number === "M1" ? <CopiesReveal /> : <GeneKeys />;
    case "next-100":
      return <NextHundred />;
    case "one-pregnancy":
      return <OnePregnancy />;
    case "family-tree":
      return <FamilyTree />;
    case "negative-bar":
      return <NegativeBar />;
    case "options":
      return <Options />;
    case "uncertain-result":
      return (
        <aside className="uncertain-note">
          <h3>{ui.uncertain_heading}</h3>
          <p>{ui.uncertain_note}</p>
        </aside>
      );
    default:
      return lesson.module_number === "M7" ? <ResultPreview /> : null;
  }
}
export function LessonStudio({ moduleId }: { moduleId: string }) {
  const content = useContent();
  const { ui, lessons } = content;
  const lesson = lessons.find((m) => m.module_id === moduleId)!;
  const { visit } = useVisited();
  useEffect(() => {
    visit(lesson.module_id);
  }, [visit, lesson.module_id]);
  const index = lessons.findIndex((m) => m.module_id === lesson.module_id),
    terms = [...new Set(lesson.cards.flatMap((c) => c.glossary_terms))];
  const sources = [...new Set(lesson.cards.flatMap((c) => c.sources))];
  return (
    <main id="main" tabIndex={-1} className="learn-main lesson-page">
      <Link className="learn-back" href="/learn">
        {ui.back}
      </Link>
      <header className="lesson-heading">
        <div>
          <p className="learn-eyebrow">
            {lesson.module_number} · {lesson.eyebrow}
          </p>
          <h1>{lesson.title}</h1>
          <p className="learn-lede">{lesson.summary}</p>
        </div>
        <div className="lesson-review">
          <span>{ui.unreviewed}</span>
          <span>{interpolate(ui.minutes, { duration: lesson.duration })}</span>
        </div>
      </header>
      {lesson.cards.map((card) => (
        <section
          className="lesson-card"
          key={card.card_id}
          aria-labelledby={card.card_id}
        >
          <h2 id={card.card_id}>{card.title}</h2>
          <div className="lesson-body">
            {card.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <Widget card={card} lesson={lesson} />
        </section>
      ))}
      <aside className="lesson-glossary">
        <h2>{ui.glossary}</h2>
        <dl>
          {terms.map((term) => (
            <div key={term}>
              <dt>
                {ui.glossary_labels[term as keyof typeof ui.glossary_labels]}
              </dt>
              <dd>
                {ui.glossary_entries[term as keyof typeof ui.glossary_entries]}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
      <details className="lesson-sources">
        <summary>{ui.sources}</summary>
        <p>
          {lesson.cards.every((c) => c.source_check === "verified")
            ? ui.source_verified
            : ui.source_not_verified}
        </p>
        <ul>
          {sources.map((id) => {
            const source = content.sources[id as keyof typeof content.sources];
            return (
              <li key={id}>
                <a href={source.url}>{source.title}</a>
                <p>{source.license_note}</p>
                <p>{source.retrieved_on}</p>
              </li>
            );
          })}
        </ul>
      </details>
      <nav className="lesson-navigation" aria-label={ui.module_navigation}>
        {index > 0 && (
          <Link href={`/learn/${lessons[index - 1].module_id}`}>
            {ui.previous}: {lessons[index - 1].title}
          </Link>
        )}
        {index < lessons.length - 1 && (
          <Link href={`/learn/${lessons[index + 1].module_id}`}>
            {ui.next}: {lessons[index + 1].title}
          </Link>
        )}
      </nav>
    </main>
  );
}
