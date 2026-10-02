import type { ReactNode } from 'react';
import { PageHero } from '@/components/content/PageHero';

export interface LegalSection {
  id: string;
  title?: string;
  /** Use a muted warm red heading for a section that must not be missed. */
  tone?: 'default' | 'warning';
  body: ReactNode;
}

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  accent: string;
  intro?: ReactNode;
  sections: LegalSection[];
  /** Optional closing block rendered after the section list. */
  footer?: ReactNode;
}

/**
 * Long-form reading layout for policy pages: editorial hero band, then a
 * cream reading surface with a ~68ch column of hairline-separated sections.
 * A sticky table of contents appears on desktop when there are several
 * titled sections.
 */
export function LegalLayout({ eyebrow, title, accent, intro, sections, footer }: LegalLayoutProps) {
  const titled = sections.filter((s) => s.title);
  const showToc = titled.length > 2;

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} accent={accent} intro={intro} />

      <div className="bg-samara-cream text-samara-cream-ink">
        <div className="sm-container py-16 sm:py-20 lg:py-28">
          <div className={showToc ? 'lg:grid lg:grid-cols-12 lg:gap-16' : ''}>
            {showToc && (
              <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
                <div className="sticky top-[calc(var(--sm-header-h)+2.5rem)]">
                  <p className="sm-eyebrow text-samara-cream-mute">On this page</p>
                  <ol className="mt-6 border-t border-samara-cream-2">
                    {titled.map((s, i) => (
                      <li key={s.id} className="border-b border-samara-cream-2">
                        <a
                          href={`#${s.id}`}
                          className="group flex items-baseline gap-4 py-3.5 font-sans text-[0.8125rem] leading-snug text-samara-cream-mute transition-colors duration-300 hover:text-samara-cream-ink focus-visible:text-samara-cream-ink focus-visible:outline-none"
                        >
                          <span className="font-serif text-sm italic text-samara-gold-deep">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="sm-link">{s.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            )}

            <article
              className={
                showToc
                  ? 'max-w-[68ch] lg:col-span-9 lg:col-start-4 xl:col-span-7 xl:col-start-5'
                  : 'mx-auto max-w-[68ch]'
              }
            >
              <ol className="border-t border-samara-cream-2">
                {sections.map((s) => {
                  const number = s.title ? titled.indexOf(s) + 1 : 0;
                  return (
                    <li
                      key={s.id}
                      id={s.id}
                      className="scroll-mt-[calc(var(--sm-header-h)+1.5rem)] border-b border-samara-cream-2 py-10 sm:py-12"
                    >
                      {s.title && (
                        <div className="mb-5 flex items-baseline gap-5">
                          <span
                            aria-hidden
                            className="font-serif text-lg italic text-samara-gold-deep"
                          >
                            {String(number).padStart(2, '0')}
                          </span>
                          <h2
                            className={`font-serif text-[1.75rem] font-normal leading-tight sm:text-[2rem] ${
                              s.tone === 'warning' ? 'text-[#9E3F2A]' : 'text-samara-cream-ink'
                            }`}
                          >
                            {s.title}
                          </h2>
                        </div>
                      )}
                      <div className="space-y-4 font-sans text-[0.9375rem] leading-[1.8] text-samara-cream-ink/[0.82]">
                        {s.body}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {footer}
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
