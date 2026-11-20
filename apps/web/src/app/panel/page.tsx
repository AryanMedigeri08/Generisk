import { PanelCatalog } from "../../components/panel-catalog";
import { apiOrigin } from "../../lib/api-origin";
import type { PanelData } from "../../lib/panel";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  let data: PanelData | null = null;
  try {
    const response = await fetch(`${apiOrigin()}/api/v1/panel`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (response.ok) {
      const value = await response.json();
      if (
        typeof value?.panel_version === "string" &&
        Array.isArray(value?.panel?.genes) &&
        Array.isArray(value?.panel?.sources)
      )
        data = value as PanelData;
    }
  } catch {
    /* Public source outage displays unavailable; no inferred reference values. */
  }
  return <PanelCatalog data={data} />;
}
