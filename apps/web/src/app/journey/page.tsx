import type { Metadata } from "next";
import Link from "next/link";
import { JourneyStudio } from "../../components/journey-studio";

export const metadata: Metadata = { title: "Journey Studio | AMAN Genome" };

export default function JourneyPage() {
  return (
    <main id="main" tabIndex={-1} className="identity-workspace">
      <nav aria-label="Main navigation" className="choice-buttons">
        <Link href="/">Home</Link>
        <Link href="/workspace">Workspace</Link>
        <Link href="/care-atlas">Care Atlas</Link>
        <Link href="/learn">Learn</Link>
      </nav>
      <JourneyStudio />
    </main>
  );
}
