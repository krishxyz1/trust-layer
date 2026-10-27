'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

const MAIN = [
  { href: '/', label: 'Home', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { href: '/claims', label: 'Quality claims', icon: 'M9 12l2 2 4-4M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z' },
  { href: '/batches', label: 'Batches', icon: 'M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4' },
  { href: '/preview', label: 'Customer preview', icon: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2' },
];
const DOCS = [
  { href: '/docs/prd', label: 'PRD' },
  { href: '/docs/metric-tree', label: 'Metric tree' },
  { href: '/docs/experiment', label: 'Experiment plan' },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <nav aria-label="Main">
      <ul className="nav">
        {MAIN.map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined} onClick={onNavigate}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d={n.icon} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="nav-group">Product docs</p>
      <ul className="nav">
        {DOCS.map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined} onClick={onNavigate}>
              <span className="nav-bullet" aria-hidden="true" />
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="var(--accent)" />
      <path d="M8 13.5l3.2 3.2L18 9.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [path]);

  return (
    <div className="frame">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="account">
          <Logo />
          <span>
            <b>Trust layer</b>
            <small>Quality ops · Bengaluru</small>
          </span>
        </Link>
        <Nav />
        <p className="sidebar-foot">
          Prototype by Krish Gujral ·{' '}
          <a href="https://github.com/krishxyz1/trust-layer">GitHub</a>
        </p>
      </aside>

      <header className="mobile-bar">
        <details ref={menu} className="menu">
          <summary aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="menu-sheet">
            <Nav onNavigate={() => menu.current && (menu.current.open = false)} />
          </div>
        </details>
        <Link href="/" className="account">
          <Logo />
          <b>Trust layer</b>
        </Link>
      </header>

      <main id="content" className="main">
        {children}
      </main>
    </div>
  );
}
