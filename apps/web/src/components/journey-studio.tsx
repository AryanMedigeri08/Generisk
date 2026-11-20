"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  downloadDemoFile,
  historyScenarios,
  historyStates,
  knowledgeCards,
  relatives,
  retrieveGuide,
  type DemoLanguage,
  type History,
  type HistoryState,
  type HistoryTopic,
  type Relative,
  type TopicId,
} from "../lib/journey-demo";
import type { DemoSession, Permission } from "../lib/identity";

function FamilyBranch({
  parent,
  history,
  relative,
  select,
  language,
}: {
  parent: Relative | null;
  history: History;
  relative: Relative;
  select: (value: Relative) => void;
  language: DemoLanguage;
}) {
  const branches = relatives.filter((node) => node.parent === parent);
  if (!branches.length) return null;
  return (
    <ul className={parent === null ? "journey-family" : undefined}>
      {branches.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            aria-pressed={relative === node.id}
            onClick={() => select(node.id)}
          >
            <strong>{node.label[language]}</strong>
            <small>
              {historyStates[history[node.id]?.status ?? "unknown"][language]}
            </small>
          </button>
          <FamilyBranch
            parent={node.id}
            history={history}
            relative={relative}
            select={select}
            language={language}
          />
        </li>
      ))}
    </ul>
  );
}

export function JourneyStudio({
  session,
  permissions = [],
}: {
  session?: DemoSession;
  permissions?: Permission[];
}) {
  const heading = useId();
  const [language, setLanguage] = useState<DemoLanguage>("en");
  const [historyEnabled, enableHistory] = useState(false);
  const [relative, selectRelative] = useState<Relative>("self");
  const [history, setHistory] = useState<History>({});
  const [topic, setTopic] = useState<TopicId>("scope");
  const [answer, setAnswer] = useState<TopicId[]>();
  const [assisted, setAssisted] = useState(false);
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [questions, setQuestions] = useState<TopicId[]>([]);
  const [notice, setNotice] = useState<"cleared" | "downloaded">();
  const tr = (en: string, ar: string) => (language === "en" ? en : ar);
  const entry = history[relative] ?? { status: "unknown", topic: "none" };

  const visitPreferences = [
    tr("Can I meet privately first?", "هل يمكنني التحدث على انفراد أولاً؟"),
    tr(
      "Can I request a counsellor of a preferred gender?",
      "هل يمكنني طلب مستشار أو مستشارة حسب تفضيلي؟",
    ),
    tr("Can I bring someone I trust?", "هل يمكنني اصطحاب شخص أثق به؟"),
  ];
  const [preferences, setPreferences] = useState<number[]>([]);
  function clear() {
    setPreferences([]);
    cancelAnswer();
    setHistory({});
    enableHistory(false);
    selectRelative("self");
    setTopic("scope");
    setQuestions([]);
    setNotice("cleared");
  }

  function cancelAnswer() {
    request.current?.abort();
    setPending(false);
    setAssisted(false);
    setAnswer(undefined);
  }

  async function explain() {
    cancelAnswer();
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const query = new URLSearchParams({ topic, locale: language });
      const response = await fetch("/api/atlas/guide?" + query, {
        credentials: "omit",
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        ids?: TopicId[];
        mode?: string;
      };
      if (controller.signal.aborted) return;
      setAnswer(
        Array.isArray(data.ids) && data.ids[0] === topic
          ? data.ids.slice(0, 2)
          : [topic],
      );
      setAssisted(data.mode === "assisted");
    } catch {
      if (!controller.signal.aborted) setAnswer([topic]);
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function updateEntry(status: HistoryState, topic: HistoryTopic) {
    if (!historyEnabled) return;
    setHistory((previous) => ({
      ...previous,
      [relative]: { status, topic: status === "unknown" ? "none" : topic },
    }));
  }

  function exportSummary() {
    const lines = [
      tr(
        "AMAN Genome — fictional consultation preparation",
        "أمان جينوم — تحضير لاستشارة وهمية",
      ),
      tr(
        "Synthetic demonstration. Not for clinical use.",
        "عرض ببيانات اصطناعية. غير مخصص للاستخدام السريري.",
      ),
      "",
      ...preferences.map((i) => "• " + visitPreferences[i]),
      ...retrieveGuide(questions).map((card) => "• " + card.prompt[language]),
      ...(historyEnabled
        ? relatives.flatMap((node) => {
            const fact = history[node.id];
            return fact && fact.status !== "unknown"
              ? [
                  node.label[language] +
                    " — " +
                    historyStates[fact.status][language] +
                    " — " +
                    historyScenarios[fact.topic][language],
                ]
              : [];
          })
        : []),
    ];
    downloadDemoFile("aman-fictional-consultation.txt", lines.join("\n"));
    setNotice("downloaded");
  }

  return (
    <section
      className="identity-card journey-studio"
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      aria-labelledby={heading}
    >
      <div className="journey-heading">
        <div>
          <p className="eyebrow">
            {tr(
              "Synthetic demonstration · Not for clinical use",
              "عرض ببيانات اصطناعية · غير مخصص للاستخدام السريري",
            )}
          </p>
          <h2 id={heading}>{tr("Journey Studio", "استوديو رحلة الرعاية")}</h2>
        </div>
        <div
          className="choice-buttons"
          role="group"
          aria-label={tr("Interface language", "لغة الواجهة")}
        >
          <button
            type="button"
            lang="en"
            aria-pressed={language === "en"}
            onClick={() => {
              cancelAnswer();
              setLanguage("en");
            }}
          >
            English
          </button>
          <button
            type="button"
            lang="ar"
            aria-pressed={language === "ar"}
            onClick={() => {
              cancelAnswer();
              setLanguage("ar");
            }}
          >
            العربية
          </button>
        </div>
      </div>
      <div className="journey-grid">
        <section>
          <h3>{tr("Understand a topic", "شرح مستند إلى المصادر")}</h3>
          <p>
            {tr(
              "Choose a topic to read a short explanation. Tick the question underneath to add it to your visit notes.",
              "اختر موضوعاً لاسترجاع ملخص وسؤال من المكتبة التعليمية العامة.",
            )}
          </p>
          <label className="journey-field">
            {tr("Topic", "الموضوع")}
            <select
              value={topic}
              onChange={(event) => {
                cancelAnswer();
                setTopic(event.target.value as TopicId);
              }}
            >
              {knowledgeCards.map((card) => (
                <option value={card.id} key={card.id}>
                  {card.title[language]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={explain} disabled={pending}>
            {pending
              ? tr("Retrieving sources…", "جارٍ استرجاع المصادر…")
              : tr("Explain this topic", "اشرح هذا الموضوع")}
          </button>
          <div aria-live="polite">
            {answer && (
              <p>
                {assisted
                  ? tr(
                      "Curated sources · Suggested further reading",
                      "مصادر منتقاة · قراءة إضافية مقترحة",
                    )
                  : tr("Curated sources", "مصادر منتقاة")}
              </p>
            )}
            {answer &&
              retrieveGuide(answer).map((card) => (
                <article className="journey-note" key={card.id}>
                  <h4>{card.title[language]}</h4>
                  <p>{card.summary[language]}</p>
                  <p>
                    <strong>{card.prompt[language]}</strong>
                  </p>
                  <p>
                    <a href={card.source} target="_blank" rel="noreferrer">
                      MedlinePlus Genetics ↗
                    </a>
                  </p>
                  <label className="journey-choice">
                    <input
                      type="checkbox"
                      checked={questions.includes(card.id)}
                      onChange={(event) =>
                        setQuestions((current) =>
                          event.target.checked
                            ? [...current, card.id]
                            : current.filter((id) => id !== card.id),
                        )
                      }
                    />
                    {tr(
                      "Include this question in my summary",
                      "أضف هذا السؤال إلى ملخصي",
                    )}
                  </label>
                </article>
              ))}
          </div>
        </section>
        <section>
          <h3>{tr("Family Health Graph", "خريطة صحة العائلة")}</h3>
          <p>
            {tr(
              "Choose a relative, then mark a detail as reported, documented, or unknown. Use the sample choices provided.",
              "استخدم أدواراً وهمية وميّز بين التفاصيل المتداولة والأمثلة الموثقة.",
            )}
          </p>
          <label className="journey-choice">
            <input
              type="checkbox"
              checked={historyEnabled}
              onChange={(event) => {
                enableHistory(event.target.checked);
                if (!event.target.checked) {
                  setHistory({});
                  selectRelative("self");
                }
              }}
            />
            {tr("Add a sample family history", "فعّل خريطة العائلة الوهمية")}
          </label>
          {historyEnabled && (
            <>
              <FamilyBranch
                parent={null}
                history={history}
                relative={relative}
                select={selectRelative}
                language={language}
              />
              <p>
                <strong>
                  {
                    relatives.find((node) => node.id === relative)?.label[
                      language
                    ]
                  }
                </strong>
              </p>
              <label className="journey-field">
                {tr("Information status", "حالة المعلومات")}
                <select
                  value={entry.status}
                  onChange={(event) =>
                    updateEntry(event.target.value as HistoryState, entry.topic)
                  }
                >
                  {Object.entries(historyStates).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label[language]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="journey-field">
                {tr("Sample detail", "تفصيل وهمي")}
                <select
                  disabled={entry.status === "unknown"}
                  value={entry.topic}
                  onChange={(event) =>
                    updateEntry(
                      entry.status,
                      event.target.value as HistoryTopic,
                    )
                  }
                >
                  {Object.entries(historyScenarios).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label[language]}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </section>
        <section>
          <h3>{tr("Explore your options", "استكشف الخيارات")}</h3>
          <p>
            {tr(
              "Use the same questions for any path you want to discuss. Your preferences guide the conversation.",
              "استخدم الأسئلة نفسها لأي مسار ترغب في مناقشته. تفضيلاتك توجه الحوار.",
            )}
          </p>
          <fieldset className="guide-check">
            <legend>
              {tr("Questions about the visit", "أسئلة حول الزيارة")}
            </legend>
            {visitPreferences.map((label, i) => (
              <label key={i} className="journey-choice">
                <input
                  type="checkbox"
                  checked={preferences.includes(i)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setPreferences((old) =>
                      on ? [...old, i] : old.filter((value) => value !== i),
                    );
                    setNotice(undefined);
                  }}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <ul className="journey-options">
            <li>{tr("Genetic counselling", "الاستشارة الوراثية")}</li>
            <li>{tr("Ask about further testing", "السؤال عن فحوص إضافية")}</li>
            <li>
              {tr(
                "Discuss family-building options",
                "مناقشة خيارات تكوين الأسرة",
              )}
            </li>
            <li>
              {tr("Continue at your own pace", "المتابعة بالوتيرة التي تناسبك")}
            </li>
          </ul>
          <details>
            <summary>
              {tr(
                "Questions about testing and family planning",
                "أسئلة عن الفحوص وتكوين الأسرة",
              )}
            </summary>
            <p>
              {tr(
                "During pregnancy, screening and diagnostic tests answer different questions. Ask what a particular test could clarify and whether you want that information.",
                "أثناء الحمل تجيب فحوص التحري والفحوص التشخيصية عن أسئلة مختلفة. اسأل عمّا يمكن لفحص معين توضيحه وما إذا كنت ترغب في تلك المعلومة.",
              )}{" "}
              <a href="https://medlineplus.gov/lab-tests/prenatal-cell-free-dna-screening/">
                MedlinePlus ↗
              </a>
            </p>
            <p>
              {tr(
                "With IVF, PGT-M can test embryos for a specific inherited condition. A specialist can explain its limits, suitability and local availability. Taking time or choosing no testing are also options.",
                "مع الإخصاب خارج الجسم يمكن فحص الأجنة لحالة وراثية محددة باستخدام PGT-M. يشرح المختص حدود الفحص وملاءمته وتوفره محلياً. ويمكن أيضاً التريث أو اختيار عدم إجراء الفحص.",
              )}{" "}
              <a href="https://www.hfea.gov.uk/treatments/embryo-testing-and-treatments-for-disease/pre-implantation-genetic-testing-for-monogenic-disorders-pgt-m-and-pre-implantation-genetic-testing-for-chromosomal-structural-rearrangements-pgt-sr/">
                HFEA ↗
              </a>
            </p>
          </details>
          <p>
            <Link href="/learn/carriers">
              {tr("Explore the inheritance simulator", "استكشف محاكي الوراثة")}{" "}
              ↗
            </Link>
          </p>
          <p>
            <Link href="/care-atlas">
              {tr(
                "Find fictional services in Care Atlas",
                "اعثر على خدمات وهمية في أطلس الرعاية",
              )}{" "}
              ↗
            </Link>
          </p>
        </section>
        <section>
          <h3>{tr("Privacy and summary", "الخصوصية والملخص")}</h3>
          <p>
            {tr(
              "Family entries and selected questions are held in this open page. Downloading a summary creates a local file you control.",
              "تبقى تفاصيل العائلة والأسئلة المختارة في هذه الصفحة المفتوحة. ينشئ تنزيل الملخص ملفاً محلياً تتحكم فيه.",
            )}
          </p>
          {session && (
            <>
              <p>
                {tr("Fictional signed-in account", "الحساب الوهمي المسجل")}:{" "}
                <bdi>{session.display_name}</bdi>
              </p>
              <p>
                {tr(
                  "Your recorded choices are shown below. Use the workspace permission controls to grant or withdraw each scope.",
                  "تظهر اختياراتك المسجلة أدناه. استخدم عناصر التحكم في مساحة العمل لمنح كل إذن أو سحبه.",
                )}
              </p>
              <p>
                <a href="#workspace-permissions">
                  {tr(
                    "Review workspace permissions",
                    "راجع أذونات مساحة العمل",
                  )}
                </a>
              </p>
              <ul>
                {permissions.map((permission) => (
                  <li key={permission.id}>
                    <bdi>
                      {permission.scope} · {permission.state} · v
                      {permission.version}
                    </bdi>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>
            {questions.length + preferences.length}{" "}
            {tr("selected questions", "أسئلة مختارة")}
          </p>
          <div className="choice-buttons">
            <button type="button" onClick={exportSummary}>
              {tr("Download consultation summary", "نزّل ملخص الاستشارة")}
            </button>
            <button type="button" onClick={clear}>
              {tr("Clear this demo", "امسح هذا العرض")}
            </button>
          </div>
          <p role="status">
            {notice === "cleared"
              ? tr("Page selections cleared.", "مُسحت اختيارات الصفحة.")
              : notice === "downloaded"
                ? tr("Your summary is ready.", "تم إعداد الملخص الوهمي.")
                : ""}
          </p>
        </section>
      </div>
    </section>
  );
}
