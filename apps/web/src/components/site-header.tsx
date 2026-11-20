"use client";
import Link from "next/link";
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
  return (
    <header className="product-header">
      <div className="product-nav">
        <Link href="/" className="wordmark" aria-label="AMAN Genome home">
          <span aria-hidden="true">✳</span> AMAN Genome
        </Link>
        <nav aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              href={href}
              key={href}
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
