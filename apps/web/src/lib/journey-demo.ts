export type DemoLanguage = "en" | "ar";
type Localized = Record<DemoLanguage, string>;

type Topic = {
  id: string;
  title: Localized;
  summary: Localized;
  prompt: Localized;
  source: string;
};

export const knowledgeCards = [
  {
    id: "scope",
    title: { en: "Test scope and uncertainty", ar: "نطاق الفحص وعدم اليقين" },
    summary: {
      en: "The meaning of a result depends on the test and its scope. A negative finding can leave questions open. An uncertain finding does not establish a diagnosis.",
      ar: "يعتمد معنى النتيجة على نوع الفحص ونطاقه. قد تبقى أسئلة بعد نتيجة سلبية، والنتيجة غير المؤكدة لا تثبت التشخيص.",
    },
    prompt: {
      en: "What did this fictional test cover, and what remains unknown?",
      ar: "ما الذي شمله هذا الفحص الوهمي، وما الذي لا يزال مجهولاً؟",
    },
    source:
      "https://medlineplus.gov/genetics/understanding/testing/interpretingresults/",
  },
  {
    id: "inheritance",
    title: { en: "Inheritance patterns", ar: "أنماط الوراثة" },
    summary: {
      en: "Inheritance depends on the condition and the relevant genetic changes. In a simple recessive teaching model, the chances apply separately to each pregnancy.",
      ar: "تعتمد الوراثة على الحالة والتغيرات الجينية ذات الصلة. في النموذج التعليمي البسيط للوراثة المتنحية، ينطبق الاحتمال على كل حمل بشكل مستقل.",
    },
    prompt: {
      en: "Which assumptions does this educational example make?",
      ar: "ما الافتراضات التي يستند إليها هذا المثال التعليمي؟",
    },
    source:
      "https://medlineplus.gov/genetics/understanding/inheritance/riskassessment/",
  },
  {
    id: "counselling",
    title: {
      en: "Preparing for counselling",
      ar: "الاستعداد للاستشارة الوراثية",
    },
    summary: {
      en: "A genetics professional can discuss results, questions and options. The discussion can take your priorities and preferences into account.",
      ar: "يمكن لاختصاصي الوراثة مناقشة النتائج والأسئلة والخيارات معك. ويمكن أن تراعي المناقشة أولوياتك وتفضيلاتك.",
    },
    prompt: {
      en: "What information would help me understand my options?",
      ar: "ما المعلومات التي تساعدني على فهم الخيارات؟",
    },
    source:
      "https://medlineplus.gov/genetics/understanding/consult/expectations/",
  },
  {
    id: "family",
    title: { en: "Family health history", ar: "التاريخ الصحي العائلي" },
    summary: {
      en: "A consultation may include a family health history. Record which details are known and which are uncertain so the discussion can take both into account.",
      ar: "قد تشمل الاستشارة التاريخ الصحي للعائلة. يساعد تمييز المعلومات المعروفة من غير المؤكدة على مناقشة كل منها بشكل مناسب.",
    },
    prompt: {
      en: "What fictional family history details could I clarify before a consultation?",
      ar: "ما تفاصيل التاريخ الصحي العائلي الوهمي التي يمكنني توضيحها قبل الاستشارة؟",
    },
    source:
      "https://medlineplus.gov/genetics/understanding/consult/expectations/",
  },
] as const satisfies readonly Topic[];

export type TopicId = (typeof knowledgeCards)[number]["id"];

export function retrieveGuide(topics: readonly TopicId[]) {
  return topics.flatMap((id) => {
    const card = knowledgeCards.find((item) => item.id === id);
    return card ? [card] : [];
  });
}

export const relatives = [
  {
    id: "grandparent",
    label: { en: "Grandparent", ar: "جد أو جدة" },
    parent: null,
  },
  {
    id: "parent",
    label: { en: "Parent", ar: "أحد الوالدين" },
    parent: "grandparent",
  },
  {
    id: "relative",
    label: { en: "Aunt or uncle", ar: "عم أو عمة أو خال أو خالة" },
    parent: "grandparent",
  },
  {
    id: "self",
    label: { en: "Fictional participant", ar: "المشارك الوهمي" },
    parent: "parent",
  },
  {
    id: "sibling",
    label: { en: "Sibling", ar: "أخ أو أخت" },
    parent: "parent",
  },
] as const;

export type Relative = (typeof relatives)[number]["id"];
export const historyStates = {
  unknown: { en: "Unknown", ar: "غير معروف" },
  reported: {
    en: "Reported in the fictional family",
    ar: "ورد في رواية العائلة الوهمية",
  },
  documented: {
    en: "Documented in the fictional example",
    ar: "موثق في المثال الوهمي",
  },
} as const;
export type HistoryState = keyof typeof historyStates;

export const historyScenarios = {
  none: { en: "No topic selected", ar: "لم يُحدد موضوع" },
  followup: {
    en: "Follow-up for an invented condition",
    ar: "متابعة حالة وهمية",
  },
  screening: {
    en: "A previous fictional screening visit",
    ar: "زيارة فحص وهمية سابقة",
  },
} as const;
export type HistoryTopic = keyof typeof historyScenarios;
export type HistoryEntry = { status: HistoryState; topic: HistoryTopic };
export type History = Partial<Record<Relative, HistoryEntry>>;

export function downloadDemoFile(
  filename: string,
  text: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
