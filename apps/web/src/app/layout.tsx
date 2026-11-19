import type { Metadata } from "next";
import "./globals.css";
import { ContentProvider, ContentSkipLink } from "../content/locale";

export const metadata: Metadata = {
  title: "Amanah Genetics | Synthetic demo",
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
          {children}
        </ContentProvider>
      </body>
    </html>
  );
}
