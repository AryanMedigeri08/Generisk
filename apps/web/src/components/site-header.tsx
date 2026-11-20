"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  ["/start", "Guided example"],
  ["/learn", "Learn together"],
  ["/journey", "Prepare for a visit"],
  ["/care-atlas", "Care Atlas"],
  ["/workspace", "Private workspace"],
] as const;

export function SiteHeader() {
  const path = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === path;
  return (
    <header className="product-header">
      <div className="product-nav">
        <Link href="/" className="wordmark" aria-label="AMAN Genome home">
          <span aria-hidden="true">✳</span> AMAN Genome
        </Link>
        <button
          className="product-menu"
          aria-controls="product-links"
          aria-expanded={open}
          onClick={() => setMenuPath(open ? null : path)}
        >
          Menu
        </button>
        <nav id="product-links" data-open={open} aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              href={href}
              key={href}
              onClick={() => setMenuPath(null)}
              aria-current={
                path === href || path.startsWith(href + "/")
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
