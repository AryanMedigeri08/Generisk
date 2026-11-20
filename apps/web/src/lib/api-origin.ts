/** Server-side only. Vercel functions reach Render over its public HTTPS origin. */
export function apiOrigin(): string {
  const value = process.env.API_INTERNAL_URL;
  if (process.env.VERCEL !== "1") return value ?? "http://127.0.0.1:18000";
  const url = new URL(value ?? "");
  if (url.protocol !== "https:" || url.origin !== value) {
    throw new Error("Configure the HTTPS Render API origin in Vercel.");
  }
  return url.origin;
}
