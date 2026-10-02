'use client';

import { useEffect } from 'react';

const SELECTOR = '[data-img-reveal]';

/**
 * One observer for every card image frame tagged `data-img-reveal`
 * (product, collection and category cards). Frames already on screen when
 * this mounts are marked revealed immediately — nothing above the fold is
 * hidden or delayed. Frames that scroll in later, or that client-side data
 * adds, unveil with the CSS in globals.css. Without JS (or with reduced
 * motion) images simply show.
 */
export function ImageRevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const root = document.documentElement;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-inview', '');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    );

    const inViewport = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    const track = (el: Element, initial: boolean) => {
      if (el.hasAttribute('data-inview')) return;
      if (initial && inViewport(el)) el.setAttribute('data-inview', '');
      else io.observe(el);
    };

    document.querySelectorAll(SELECTOR).forEach((el) => track(el, true));
    root.classList.add('sm-img-reveal-ready');

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR)) track(n, false);
          n.querySelectorAll?.(SELECTOR).forEach((el) => track(el, false));
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove('sm-img-reveal-ready');
    };
  }, []);

  return null;
}
