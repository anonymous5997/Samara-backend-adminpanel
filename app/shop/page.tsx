import { Suspense } from 'react'
import ShopClient from './ShopClient'
import { CatalogGridSkeleton } from '@/components/catalog/CatalogGrid'

function ShopFallback() {
  return (
    <div className="min-h-screen bg-samara-black text-samara-ivory" aria-busy="true">
      <div className="border-b border-samara-line">
        <div className="sm-container pb-10 pt-12 md:pb-14 md:pt-20 lg:pb-16 lg:pt-24">
          <p className="sm-eyebrow">Shop</p>
          <span className="sr-only">Loading shop…</span>
          <div aria-hidden className="mt-6 h-12 w-2/3 max-w-md bg-samara-char md:h-16" />
        </div>
      </div>
      <div className="h-14 border-b border-samara-line lg:h-16" />
      <div className="sm-container pt-8 md:pt-12">
        <CatalogGridSkeleton count={8} />
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopClient />
    </Suspense>
  )
}
