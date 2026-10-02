'use client';

import { useEffect, useState } from 'react';

/**
 * Brand intro (first visit to "/" per browser session).
 *
 * Fast by design (~1s) and CSS-driven: an inline script in app/layout.tsx
 * sets <html data-intro="play"> before paint when the intro should run, and
 * the CSS in globals.css (".sm-intro") animates the curtains and hides the
 * overlay at the end — so it disappears even if JS is slow. The hero renders
 * underneath the whole time (no LCP delay). Click/tap skips. Reduced motion,
 * repeat visits and no-JS never see it.
 */
export function IntroCurtain() {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== 'play') return;
    // Leave "play" in place until every hero entrance (which is offset by the
    // intro) has finished, then retire it so later visits to "/" in this SPA
    // session don't replay the curtain.
    const t = window.setTimeout(() => {
      root.dataset.intro = 'done';
    }, 2600);
    return () => window.clearTimeout(t);
  }, []);

  if (skipped) return null;

  return (
    <div
      aria-hidden
      className="sm-intro"
      onClick={() => setSkipped(true)}
    >
      <div className="sm-intro-panel sm-intro-left" />
      <div className="sm-intro-panel sm-intro-right" />
      <div className="sm-intro-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/samara-logo-transparent.png" alt="" width={717} height={214} decoding="async" />
      </div>
    </div>
  );
}
