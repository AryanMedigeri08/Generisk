import { IdentityWorkspace } from "../../components/identity-workspace";

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  const origin = new URL(
    process.env.DEMO_WEB_ORIGIN ?? "http://localhost:13000",
  );
  const hosted =
    process.env.VERCEL === "1" ||
    !["localhost", "127.0.0.1"].includes(origin.hostname);
  return <IdentityWorkspace hosted={hosted} />;
}
