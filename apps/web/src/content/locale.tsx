"use client";
import Link from "next/link";
import { createContext, useContext } from "react";
import { loadContent, type Language } from "./loader";
export type ContentBundle = ReturnType<typeof loadContent>;
const LocaleContext = createContext<ContentBundle>(loadContent());
export function ContentProvider({
  language = "en",
  bundle,
  children,
}: {
  language?: Language;
  bundle?: ContentBundle;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={bundle ?? loadContent(language)}>
      {children}
    </LocaleContext.Provider>
  );
}
export const useContent = () => useContext(LocaleContext);
export function StudioLink() {
  const { ui } = useContent();
  return <Link href="/learn">{ui.learn}</Link>;
}
export function ContentSkipLink() {
  const { ui } = useContent();
  return (
    <a className="skip-link" href="#main">
      {ui.skip}
    </a>
  );
}
