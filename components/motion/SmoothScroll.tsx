'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/**
 * Storefront scroll feel (Zara / Nike style):
 *  - Lenis inertial smooth scrolling for mouse/trackpad on desktop. Native
 *    scroll stays underneath (sticky, anchors, a11y keep working); touch
 *    devices keep their own native momentum.
 *  - Scroll-linked image parallax: every card/panel frame tagged
 *    `data-img-reveal` gets a small offset (CSS vars) so its photo drifts
 *    inside the frame — the "alive" editorial feel. Desktop only.
 * Both are off with prefers-reduced-motion. Lenis pauses while a dialog /
 * drawer locks the page, and never hijacks scrolling inside overlays.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!desktop.matches || reduced.matches) return;

    const root = document.documentElement;
    const lenis = new Lenis({
      lerp: 0.11,
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: { offset: -80 },
      // Let drawers, menus, search and lightboxes scroll natively.
      prevent: (node: HTMLElement) =>
        !!node.closest?.('[role="dialog"], [data-radix-popper-content-wrapper], [data-lenis-prevent]'),
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Pause while Radix/react-remove-scroll locks the body (dialog open).
    const lockObserver = new MutationObserver(() => {
      if (document.body.hasAttribute('data-scroll-locked')) lenis.stop();
      else lenis.start();
    });
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });

    /* ---------------- image parallax ---------------- */
    root.classList.add('sm-parallax');
    const SPEED = 0.045;
    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) visible.add(el);
          else visible.delete(el);
        }
      },
      { rootMargin: '15% 0px 15% 0px' },
    );
    const observeAll = () =>
      document.querySelectorAll<HTMLElement>('[data-img-reveal]').forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    const update = () => {
      const vh = window.innerHeight;
      visible.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height === 0) return;
        const offset = -((r.top + r.height / 2) - vh / 2) * SPEED;
        const max = (vh / 2 + r.height / 2) * SPEED;
        const scale = Math.min(1.16, Math.max(1.04, 1 + (2 * max) / r.height));
        el.style.setProperty('--sm-py', `${offset.toFixed(1)}px`);
        el.style.setProperty('--sm-ps', scale.toFixed(3));
      });
    };

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lockObserver.disconnect();
      io.disconnect();
      mo.disconnect();
      lenis.destroy();
      root.classList.remove('sm-parallax');
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  // New page: start at the top instantly (Next resets native scroll; keep Lenis in sync).
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis && !window.location.hash) lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
