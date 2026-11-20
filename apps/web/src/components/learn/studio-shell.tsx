"use client";
import { useContent } from "../../content/locale";
import Link from "next/link";

import { createContext, useCallback, useContext, useState } from "react";
import { interpolate } from "../../content/loader";
const ProgressContext = createContext<{
  visited: string[];
  visit: (id: string) => void;
}>({
  visited: [] as string[],
  visit: () => {},
});
export const useVisited = () => useContext(ProgressContext);
export function StudioShell({ children }: { children: React.ReactNode }) {
  const content = useContent();
  const { ui, lessons } = content;
  const [visited, setVisited] = useState<string[]>([]);
  const visit = useCallback(
    (id: string) => {
      if (lessons.some((m) => m.module_id === id))
        setVisited((old) => (old.includes(id) ? old : [...old, id]));
    },
    [lessons],
  );
  return (
    <ProgressContext.Provider value={{ visited, visit }}>
      <div className="learn-studio">
        <div className="learn-banner">{ui.banner}</div>
        <div className="learn-progress">
          <span>{ui.visited}</span>
          <progress
            value={visited.length}
            max={lessons.length}
            aria-label={ui.visited}
          />
          <span aria-live="polite">
            {interpolate(ui.visited_template, {
              count: visited.length,
              total: lessons.length,
            })}
          </span>
          <button onClick={() => setVisited([])}>{ui.clear_progress}</button>
        </div>
        {children}
        <footer className="learn-footer">
          <p>{ui.progress_note}</p>
          <p>{ui.unreviewed}</p>
          <Link href="/panel">{ui.panel}</Link>
        </footer>
      </div>
    </ProgressContext.Provider>
  );
}
