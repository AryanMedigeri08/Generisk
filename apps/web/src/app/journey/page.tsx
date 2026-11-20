import type { Metadata } from "next";

import { JourneyStudio } from "../../components/journey-studio";

export const metadata: Metadata = { title: "Journey Studio | AMAN Genome" };

export default function JourneyPage() {
  return (
    <main id="main" tabIndex={-1} className="identity-workspace">
      <h1>Prepare for a counselling visit</h1>
      <p>
        Choose a question, add family history if you want, then download your
        notes. You can do this privately in English or Arabic.
      </p>
      <JourneyStudio />
    </main>
  );
}
