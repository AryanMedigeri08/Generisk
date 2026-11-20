import type { Metadata } from "next";
import { CareAtlas } from "../../components/care-atlas/care-atlas";
import "./atlas.css";

export const metadata: Metadata = {
  title: "Care Atlas | AMAN Genome",
  description:
    "Explore fictional genetic care pathways and simulate service access.",
};

export default function CareAtlasPage() {
  return <CareAtlas />;
}
