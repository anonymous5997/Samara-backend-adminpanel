'use client'

import { useState } from 'react'
import { savePrices } from './actions'

const REGIONS = [
  { code: 'IN', label: 'India (INR)' },
  { code: 'US', label: 'USA (USD)' },
  { code: 'CA', label: 'Canada (CAD)' },
  { code: 'AE', label: 'UAE (AED)' },
  { code: 'GB', label: 'UK (GBP)' },
]

/* ✅ PROPS TYPE (this fixes the Vercel build error) */
type PricingFormProps = {
  productId: string
}

export default function PricingForm({ productId }: PricingFormProps) {
  const [prices, setPrices] = useState<Record<string, string>>({})

  function update(region: string, value: string) {
    setPrices(prev => ({ ...prev, [region]: value }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Regional Pricing</h2>

      {REGIONS.map(r => (
        <div key={r.code} className="flex gap-4 items-center">
          <label className="w-40">{r.label}</label>
          <input
            type="number"
            placeholder="Enter price"
            className="border p-2 w-full"
            onChange={e => update(r.code, e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={() => savePrices(productId, prices)}
        className="btn-primary"
      >
        Save Prices
      </button>

      <p className="text-xs text-gray-500">
        Prices must include shipping, customs & duties
      </p>
    </div>
  )
}
