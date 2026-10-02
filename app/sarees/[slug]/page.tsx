import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingEmpty } from "@/components/listing/ListingEmpty";

/* -----------------------------------------------------------
   ✅ REGION & PRICING UTILS
----------------------------------------------------------- */
import { getCurrentRegion } from "@/lib/region/server";
import { resolveFinalPrice } from "@/lib/resolve-product-price";
import { getCurrencyRates } from "@/lib/currency-utils"; // ✅ Added: Fetch rates on server
import { formatPriceSync, type SupportedCurrency } from "@/lib/currency-utils";

export default async function SareePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // 1. GET REGION & RATES (Server-Side)
  // ---------------------------------------------------------
  // We fetch rates here so we can pass them to the resolver.
  // This ensures server rendering matches client math exactly.
  const region = await getCurrentRegion();
  const rates = await getCurrencyRates(); // ✅ Fetch latest rates

  // ---------------------------------------------------------
  // 2. FETCH PRODUCT (Fetch ALL prices, don't filter in SQL)
  // ---------------------------------------------------------
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (
        image_url,
        is_primary
      ),
      product_prices (
        region,
        currency,
        price,
        mrp
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (error || !product) {
    return notFound();
  }

  // ---------------------------------------------------------
  // 3. RESOLVE PRICE (Logic handles fallback/conversion)
  // ---------------------------------------------------------
  // ✅ FIX: Pass 'rates' to ensure conversion uses cached/live data.
  // We pass 'undefined' for currency preference so it defaults
  // to the region's native currency (e.g. US -> USD, IN -> INR).
  const resolved = await resolveFinalPrice(product, region, undefined, rates);

  if (!resolved) {
    // Safety net: if no price exists for this region/product
    return (
      <div className="min-h-[60vh] bg-samara-black">
        <div className="sm-container py-24">
          <ListingEmpty
            eyebrow="The Saree Edit"
            title="Price not available"
            actions={[{ label: "Browse All Sarees", href: "/sarees", variant: "ghost" }]}
          />
        </div>
      </div>
    );
  }

  // Presentation only: the product's own photo (placeholder URLs skipped).
  const images: Array<{ image_url: string; is_primary: boolean }> = product.product_images ?? [];
  const realImages = images.filter((img) => img.image_url && !img.image_url.includes("placeholder.com"));
  const image = (realImages.find((img) => img.is_primary) ?? realImages[0])?.image_url ?? null;
  const showMrp = typeof resolved.mrp === "number" && resolved.mrp > resolved.displayPrice;

  return (
    <div className="min-h-screen bg-samara-black text-samara-ivory">
      <section className="border-b border-samara-line bg-samara-forest">
        <div className="sm-container grid gap-10 pb-14 pt-8 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:items-center md:gap-14 md:pb-20 md:pt-12 lg:gap-20">
          {/* Copy */}
          <div>
            <nav aria-label="Breadcrumb" className="mb-10 md:mb-14">
              <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">
                <li>
                  <Link href="/" className="sm-link inline-flex min-h-[44px] items-center hover:text-samara-ivory sm:min-h-0">
                    Home
                  </Link>
                </li>
                <li aria-hidden className="h-px w-4 bg-samara-mute/40" />
                <li>
                  <Link href="/sarees" className="sm-link inline-flex min-h-[44px] items-center hover:text-samara-ivory sm:min-h-0">
                    Sarees
                  </Link>
                </li>
              </ol>
            </nav>

            <p className="sm-eyebrow mb-5 flex items-center gap-4 text-samara-gold">
              <span>The Saree Edit</span>
              <span aria-hidden className="h-px w-10 bg-samara-gold/50" />
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.75rem)] font-light capitalize leading-[1.02] text-samara-ivory">
              {product.name}
            </h1>
            {product.description && (
              <p className="sm-body mt-6 max-w-lg whitespace-pre-line">{product.description}</p>
            )}

            {/* ✅ DISPLAY RESOLVED PRICE */}
            <div className="mt-8 flex items-baseline gap-3 border-t border-samara-line pt-6 font-sans tabular-nums">
              <p className="text-xl text-samara-ivory">
                {formatPriceSync(resolved.displayPrice, resolved.currency as SupportedCurrency)}
              </p>
              {showMrp && (
                <s className="text-sm text-samara-mute">
                  <span className="sr-only">MRP </span>
                  {formatPriceSync(resolved.mrp as number, resolved.currency as SupportedCurrency)}
                </s>
              )}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/products/${product.slug}`}
                className="sm-btn bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
              >
                View the Piece
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
              </Link>
              <Link href="/sarees" className="sm-btn sm-btn-ghost">
                All Sarees
              </Link>
            </div>
          </div>

          {/* Image (the product's own photo) */}
          <div className="sm-zoom relative order-first aspect-[4/5] w-full bg-samara-forest-2 md:order-none">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                unoptimized={!image.startsWith("https://wrsrobuicquzpfgnfnmh.supabase.co/")}
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center font-serif text-8xl font-light text-samara-mute"
              >
                {String(product.name ?? "").trim().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
