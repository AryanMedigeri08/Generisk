import type { Metadata } from "next";
import "./globals.css";
import "./journey-flow.css";
import { SiteHeader } from "../components/site-header";
import { ContentProvider, ContentSkipLink } from "../content/locale";

export const metadata: Metadata = {
  title: "AMAN Genome | Synthetic demo",
  description:
    "A fictional, non-clinical hackathon demonstration. No patient records or medical advice.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ContentProvider>
          <ContentSkipLink />
          <SiteHeader />
          {children}
        </ContentProvider>
      </body>
    </html>
  );
}
