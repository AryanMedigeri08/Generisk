import { DemoDashboard } from "../../components/demo-dashboard";
import { getDemoSnapshot } from "../../lib/demo";
export const dynamic = "force-dynamic";
export default async function StatusPage() {
  return <DemoDashboard initialSnapshot={await getDemoSnapshot()} />;
}
