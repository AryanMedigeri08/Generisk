"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  comparison,
  sampleChoices,
  type SampleStatus,
} from "../lib/guided-examples";
import {
  downloadDemoFile,
  knowledgeCards,
  type DemoLanguage,
} from "../lib/journey-demo";
import { pairTable } from "../lib/learn/mendelian";
import { PersonalMode } from "./care-atlas/care-atlas";

type Translate = (en: string, ar: string) => string;
const labels: Record<SampleStatus, [string, string]> = {
  carrier: ["Carrier finding", "نتيجة تشير إلى حمل صفة وراثية"],
  no_finding: ["No change detected", "لم يُكتشف تغير"],
  not_tested: ["Gene was not tested", "لم يُفحص الجين"],
  uncertain: ["Uncertain finding", "نتيجة غير مؤكدة"],
};
const titles = [
  ["Before you begin", "قبل أن تبدأ"],
  ["Choose two sample reports", "اختر تقريرين للتجربة"],
  ["Read the comparison", "اقرأ المقارنة"],
  ["Try it together", "جرّبا معاً"],
  ["Prepare your next step", "حضّر خطوتك التالية"],
] as const;

function LearningActivity({ shared, t }: { shared: boolean; t: Translate }) {
  const [cell, setCell] = useState<number>();
  const [answer, setAnswer] = useState<boolean>();
  const pairs = pairTable("both_carriers");
  const copy = (value: string) =>
    value === "working" ? t("Usual", "معتادة") : t("Changed", "متغيرة");
  return (
    <>
      {shared && (
        <section className="learning-board">
          <h2>{t("Build a possible combination", "كوّن تركيبة محتملة")}</h2>
          <p>
            {t(
              "Imagine each parent has one usual copy and one changed copy for the same recessive condition. Each passes on one copy. Tap a tile to see one possible pairing.",
              "تخيّل أن كل والد يحمل نسخة معتادة ونسخة متغيرة للحالة المتنحية نفسها. ينقل كل منهما نسخة واحدة. اختر مربعاً لرؤية إحدى التركيبات الممكنة.",
            )}
          </p>
          <div className="pair-grid">
            {pairs.map((pair, i) => (
              <button
                key={pair.id}
                aria-pressed={cell === i}
                onClick={() => setCell(i)}
              >
                <span>
                  {t("Pair", "تركيبة")} {i + 1}
                </span>
                <span className="copy-pair" aria-hidden="true">
                  <i className={pair.fromA} />
                  <i className={pair.fromB} />
                </span>
                <strong>
                  {copy(pair.fromA)} + {copy(pair.fromB)}
                </strong>
              </button>
            ))}
          </div>
          <p className="guide-feedback" role="status">
            {cell === undefined
              ? t(
                  "Each of the four tiles is equally likely in this model.",
                  "لكل مربع من المربعات الأربعة الاحتمال نفسه في هذا النموذج.",
                )
              : pairs[cell].outcome === "affected"
                ? t(
                    "Two changed copies. This is the one pairing out of four that represents the condition in this simplified model.",
                    "نسختان متغيرتان. هذه واحدة من أربع تركيبات وتمثّل الحالة في هذا النموذج المبسّط.",
                  )
                : pairs[cell].outcome === "carrier"
                  ? t(
                      "One changed copy. Two of the four tiles represent a carrier in this model.",
                      "نسخة متغيرة واحدة. يمثّل مربعان من الأربعة حمل الصفة في هذا النموذج.",
                    )
                  : t(
                      "Two usual copies. One tile out of four has this combination.",
                      "نسختان معتادتان. هذه التركيبة موجودة في مربع واحد من أربعة.",
                    )}
          </p>
        </section>
      )}
      <fieldset className="guide-check">
        <legend>
          {shared
            ? t(
                "If the first child inherits two changed copies, what happens to the next pregnancy’s chances?",
                "إذا ورث الطفل الأول نسختين متغيرتين، ماذا يحدث لاحتمالات الحمل التالي؟",
              )
            : t(
                "A test leaves a question open. What would you ask first?",
                "بقي سؤال بعد الفحص. ماذا تسأل أولاً؟",
              )}
        </legend>
        <div className="guide-actions">
          {[true, false].map((correct) => (
            <button
              key={String(correct)}
              aria-pressed={answer === correct}
              onClick={() => setAnswer(correct)}
            >
              {shared
                ? correct
                  ? t("The chances stay the same", "تبقى الاحتمالات كما هي")
                  : t("The chances change", "تتغير الاحتمالات")
                : correct
                  ? t(
                      "What could this test detect?",
                      "ما الذي يستطيع هذا الفحص كشفه؟",
                    )
                  : t(
                      "Can I assume there is no risk?",
                      "هل أفترض أن الاحتمال معدوم؟",
                    )}
            </button>
          ))}
        </div>
        {answer !== undefined && (
          <p role="status" className="guide-feedback">
            {answer
              ? t("Yes. ", "نعم. ")
              : t("Try the other answer. ", "جرّب الإجابة الأخرى. ")}
            {shared
              ? t(
                  "Each pregnancy starts a new pairing. Earlier outcomes do not use up the tiles.",
                  "يبدأ كل حمل بتركيبة جديدة ولا تُستنفد المربعات بنتائج الحمل السابق.",
                )
              : t(
                  "A report can only describe what its test covered. An unclear or missing finding cannot establish zero risk.",
                  "يصف التقرير ما شمله الفحص فقط. ولا تعني النتيجة المفقودة أو غير الواضحة انعدام الاحتمال.",
                )}
          </p>
        )}
      </fieldset>
      <a
        href={knowledgeCards[shared ? 1 : 0].source}
        target="_blank"
        rel="noreferrer"
      >
        {t(
          "Read the source at MedlinePlus Genetics",
          "اقرأ المصدر في ميدلاين بلس للوراثة",
        )}{" "}
        ↗
      </a>
    </>
  );
}

export function GuidedJourney() {
  const [language, setLanguage] = useState<DemoLanguage>("en");
  const [step, setStep] = useState(0);
  const [first, setFirst] = useState<SampleStatus>("carrier");
  const [second, setSecond] = useState<SampleStatus>("carrier");
  const [questions, setQuestions] = useState<string[]>([]);
  const [map, setMap] = useState(false);
  const [mapStarted, setMapStarted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const previous = useRef(0);
  useEffect(() => {
    if (previous.current !== step) {
      title.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
      previous.current = step;
    }
  }, [step]);
  const t: Translate = (en, ar) => (language === "en" ? en : ar);
  const result = comparison(first, second);
  const resultTitle =
    result === "shared"
      ? t(
          "Both samples have a carrier finding in CFTR",
          "تشير كلتا العينتين إلى حمل صفة مرتبطة بجين CFTR",
        )
      : result === "incomplete"
        ? t("These samples leave a question open", "تترك العينتان سؤالاً مفتوحاً")
        : t(
            "These samples show no shared carrier finding in CFTR",
            "لا تظهر العينتان حملاً مشتركاً للصفة في جين CFTR",
          );
  const explanation =
    result === "shared"
      ? t(
          "CFTR is a gene associated with cystic fibrosis. These sample reports each record a carrier finding. They give no variant details. Next, use a simplified model to see why two gene copies matter.",
          "يرتبط جين CFTR بالتليف الكيسي. يسجّل كلا التقريرين حمل الصفة دون تفاصيل التغيرات. في الخطوة التالية ستجرّب نموذجاً مبسّطاً يوضّح أهمية نسختَي الجين.",
        )
      : result === "incomplete"
        ? t(
            "At least one report has an uncertain finding or did not test this gene. There is too little information for a shared conclusion. The next activity explores what to ask about that gap.",
            "توجد نتيجة غير مؤكدة في تقرير واحد على الأقل أو لم يُفحص فيه الجين. لا تكفي المعلومات لاستنتاج مشترك. يوضّح النشاط التالي ما يمكنك سؤاله عن هذه الفجوة.",
          )
        : t(
            "At least one sample has no change detected in CFTR. Tests have limits, so this does not rule out every change. The next activity shows how to ask about those limits.",
            "لم يُكتشف تغير في جين CFTR في عينة واحدة على الأقل. لكل فحص حدود، لذا لا تستبعد النتيجة كل تغير محتمل. يوضّح النشاط التالي كيف تسأل عن هذه الحدود.",
          );
  const next = [
    t("Choose sample reports", "اختر تقارير التجربة"),
    t("Compare these samples", "قارن العينتين"),
    t("Try the learning activity", "جرّب النشاط التعليمي"),
    t("Prepare a visit", "حضّر للزيارة"),
  ];
  function resetPlan() {
    setQuestions([]);
    setMap(false);
    setMapStarted(false);
    setDownloaded(false);
  }
  function restart() {
    resetPlan();
    setFirst("carrier");
    setSecond("carrier");
    setStep(0);
  }
  const firstQuestion = result === "shared" ? "inheritance" : "scope";
  const orderedCards = [...knowledgeCards].sort(
    (a, b) => Number(b.id === firstQuestion) - Number(a.id === firstQuestion),
  );
  const chosen = knowledgeCards.filter((card) => questions.includes(card.id));
  return (
    <main
      id="main"
      tabIndex={-1}
      className="guide-main"
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="guide-top">
        <span>
          {t(
            "Guided example · Synthetic data only",
            "مثال إرشادي · بيانات اصطناعية فقط",
          )}
        </span>
        <div role="group" aria-label={t("Guide language", "لغة الدليل")}>
          {(["en", "ar"] as const).map((l) => (
            <button
              key={l}
              lang={l}
              aria-pressed={language === l}
              onClick={() => setLanguage(l)}
            >
              {l === "en" ? "English" : "العربية"}
            </button>
          ))}
        </div>
      </div>
      <ol className="guide-steps" aria-label={t("Your progress", "تقدّمك")}>
        {[
          t("Welcome", "البداية"),
          t("Reports", "التقارير"),
          t("Result", "النتيجة"),
          t("Learn", "التعلّم"),
          t("Plan", "الخطة"),
        ].map((s, i) => (
          <li key={i} aria-current={i === step ? "step" : undefined}>
            <span>{i + 1}</span> {s}
          </li>
        ))}
      </ol>
      <section className="guide-page">
        <p className="eyebrow">
          {t("STEP", "الخطوة")} {step + 1} / 5
        </p>
        <h1 ref={title} tabIndex={-1}>
          {t(titles[step][0], titles[step][1])}
        </h1>
        {step === 0 && (
          <>
            <p className="guide-lede">
              {t(
                "Try this on your own or sit together. All you need to do is choose from prepared examples. You won’t need a genetic report or a sign-in.",
                "يمكنك التجربة بمفردك أو مع الشريك. يكفي الاختيار من الأمثلة الجاهزة، دون تقرير وراثي أو تسجيل دخول.",
              )}
            </p>
            <ol className="guide-outline">
              <li>
                {t(
                  "Pick two sample reports about the same gene.",
                  "اختر تقريرين عن الجين نفسه.",
                )}
              </li>
              <li>
                {t(
                  "Read what the two findings can tell you and try a hands-on lesson.",
                  "اقرأ ما توضحه النتيجتان وجرّب نشاطاً عملياً.",
                )}
              </li>
              <li>
                {t(
                  "Choose questions to keep and explore care on a sample map.",
                  "اختر أسئلة للاحتفاظ بها واستكشف الرعاية على خريطة تجريبية.",
                )}
              </li>
            </ol>
            <aside className="guide-feedback">
              {t(
                "This public exercise uses prepared samples. Nothing you select here changes either partner’s permissions. In the private workspace, each person signs in and chooses separately.",
                "يستخدم التمرين العام عينات جاهزة. لا يغيّر اختيارك أذونات أي شريك. في المساحة الخاصة يسجّل كل شخص دخوله ويتخذ قراره بشكل مستقل.",
              )}{" "}
              <Link href="/workspace">
                {t("Explore private consent", "استكشف الأذونات الخاصة")}
              </Link>
            </aside>
          </>
        )}
        {step === 1 && (
          <>
            <p>
              {t(
                "Start with the two carrier samples below, or change either report to see how the explanation changes. CFTR is the gene we will follow.",
                "ابدأ بالعينتين المحددتين، أو غيّر أحد التقريرين لترى كيف يتغيّر الشرح. سنتابع جين CFTR في المثال.",
              )}
            </p>
            <div className="report-picks">
              {(["first", "second"] as const).map((key, i) => (
                <label key={key}>
                  {i === 0
                    ? t("First sample report", "تقرير العينة الأولى")
                    : t("Second sample report", "تقرير العينة الثانية")}
                  <select
                    value={i === 0 ? first : second}
                    onChange={(e) => {
                      (i === 0 ? setFirst : setSecond)(
                        e.target.value as SampleStatus,
                      );
                      resetPlan();
                    }}
                  >
                    {sampleChoices[key].map((s) => (
                      <option key={s} value={s}>
                        {t(...labels[s])}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p>
              {t(
                "A carrier has a change in one of the two copies of a gene in this recessive example.",
                "يحمل الشخص الصفة في هذا المثال المتنحي عندما تكون إحدى نسختَي الجين متغيرة.",
              )}
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <div className="guide-result">
              <h2>{resultTitle}</h2>
              <p>{explanation}</p>
            </div>
            <p>
              {t(
                "This comparison describes the selected teaching samples only.",
                "تصف المقارنة العينتين التعليميتين المختارتين فقط.",
              )}
            </p>
            <Link href="/panel#gene-CFTR" target="_blank">
              {t(
                "About CFTR and the panel sources",
                "عن جين CFTR ومصادر القائمة",
              )}{" "}
              ↗
            </Link>
          </>
        )}
        {step === 3 && <LearningActivity shared={result === "shared"} t={t} />}
        {step === 4 && (
          <>
            <p>
              {t(
                "You’ve finished the example. Choose a question to take away, then try planning a visit if you like.",
                "أكملت المثال. اختر سؤالاً للاحتفاظ به ثم جرّب التخطيط لزيارة إذا رغبت.",
              )}
            </p>
            <fieldset className="guide-check">
              <legend>
                {t(
                  "What would you like to ask a counsellor?",
                  "ماذا ترغب في سؤال المستشار؟",
                )}
              </legend>
              {orderedCards.map((c) => (
                <label className="question-option" key={c.id}>
                  <input
                    type="checkbox"
                    checked={questions.includes(c.id)}
                    onChange={(e) => {
                      setDownloaded(false);
                      setQuestions((old) =>
                        e.target.checked
                          ? [...old, c.id]
                          : old.filter((id) => id !== c.id),
                      );
                    }}
                  />
                  {c.prompt[language]}
                </label>
              ))}
            </fieldset>
            <div className="guide-actions">
              <button
                disabled={!chosen.length}
                onClick={() => {
                  downloadDemoFile(
                    "aman-visit-questions.txt",
                    [
                      t(
                        "Sample exercise · Not for clinical use",
                        "تمرين تجريبي · غير مخصص للاستخدام السريري",
                      ),
                      resultTitle,
                      ...chosen.map((c) => "• " + c.prompt[language]),
                    ].join("\n"),
                  );
                  setDownloaded(true);
                }}
              >
                {t("Download my questions", "نزّل أسئلتي")} ({chosen.length})
              </button>
              <button
                aria-expanded={map}
                onClick={() => {
                  setMapStarted(true);
                  setMap(!map);
                  requestAnimationFrame(() =>
                    document
                      .querySelector("#guided-care-map")
                      ?.scrollIntoView({ block: "start" }),
                  );
                }}
              >
                {t(
                  map ? "Hide care map" : "Find a counselling service",
                  map ? "أخفِ خريطة الرعاية" : "ابحث عن خدمة استشارة",
                )}
              </button>
            </div>
            {downloaded && (
              <p role="status">
                {t(
                  "Your question sheet is ready to keep.",
                  "ورقة أسئلتك جاهزة للاحتفاظ بها.",
                )}
              </p>
            )}
            <p>
              <Link href="/journey">
                {t(
                  "Add family history or explore counselling options",
                  "أضف التاريخ العائلي أو استكشف خيارات الاستشارة",
                )}
              </Link>
            </p>
          </>
        )}
        <div className="guide-bottom">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}>
              {t("Back", "رجوع")}
            </button>
          )}
          {step < 4 ? (
            <button className="primary-guide" onClick={() => setStep(step + 1)}>
              {next[step]} →
            </button>
          ) : (
            <button onClick={restart}>
              {t("Start a new example", "ابدأ مثالاً جديداً")}
            </button>
          )}
        </div>
      </section>
      {mapStarted && (
        <section
          id="guided-care-map"
          hidden={step !== 4 || !map}
          className="care-atlas guided-map"
          lang="en"
          dir="ltr"
          aria-label="Sample care map"
        >
          <PersonalMode initialJourney="result" />
        </section>
      )}
      <p className="guide-foot">
        {t(
          "Synthetic demonstration. Not for clinical use. Leaving the guide clears your selections.",
          "عرض ببيانات اصطناعية غير مخصص للاستخدام السريري. تُمسح اختياراتك عند مغادرة الدليل.",
        )}
      </p>
    </main>
  );
}
