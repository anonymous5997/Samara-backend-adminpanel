import { Suspense } from 'react'
import ShopClient from './ShopClient'

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading shop…</div>}>
      <ShopClient />
    </Suspense>
  )
}
