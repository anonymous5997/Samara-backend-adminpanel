'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ProductDetailsAccordionProps {
  description: string | null;
  fabric?: string | null;
  work?: string | null;
  occasion?: string | null;
  careInstructions?: string | null;
  shippingTime?: string | null;
  whyWomenLove?: string | null;
}

const item = 'border-b border-samara-line';
const trigger =
  'min-h-[3.5rem] py-4 text-left font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-ivory hover:no-underline hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-samara-gold [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-samara-mute [&>svg]:duration-500';
const content = 'pb-6 font-sans text-[0.875rem] leading-[1.75] text-samara-mute';

function Row({ term, value }: { term: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-samara-line py-3 first:border-t-0 first:pt-0">
      <dt className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-samara-mute">{term}</dt>
      <dd className="text-samara-ivory">{value}</dd>
    </div>
  );
}

/** Description · Fabric & Care · Shipping & Returns · Why women love it. */
export function ProductDetailsAccordion({
  description,
  fabric,
  work,
  occasion,
  careInstructions,
  shippingTime,
  whyWomenLove,
}: ProductDetailsAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={description ? ['description'] : ['fabric']} className="border-t border-samara-line">
      {description && (
        <AccordionItem value="description" className={item}>
          <AccordionTrigger className={trigger}>Description</AccordionTrigger>
          <AccordionContent className={content}>
            <p className="whitespace-pre-line">{description}</p>
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="fabric" className={item}>
        <AccordionTrigger className={trigger}>Fabric &amp; Care</AccordionTrigger>
        <AccordionContent className={content}>
          <dl>
            <Row term="Fabric" value={fabric || '—'} />
            {work && <Row term="Work" value={work} />}
            <Row term="Occasion" value={occasion || '—'} />
            <Row term="Wash Care" value={careInstructions || '—'} />
          </dl>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="shipping" className={item}>
        <AccordionTrigger className={trigger}>Shipping &amp; Returns</AccordionTrigger>
        <AccordionContent className={content}>
          <dl>
            <Row term="Shipping" value={shippingTime || '—'} />
          </dl>
          <Link
            href="/return-policy"
            className="sm-link mt-4 font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-gold"
          >
            Read our return policy
          </Link>
        </AccordionContent>
      </AccordionItem>

      {whyWomenLove && (
        <AccordionItem value="love" className={item}>
          <AccordionTrigger className={trigger}>Why women love it</AccordionTrigger>
          <AccordionContent className={content}>
            <p className="whitespace-pre-line font-serif text-[1.25rem] font-light italic leading-snug text-samara-ivory">
              {whyWomenLove}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
