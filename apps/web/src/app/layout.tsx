import type { Metadata } from "next";
import "./globals.css";

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
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
