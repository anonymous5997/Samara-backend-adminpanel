import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function SareePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  const region =
    cookies().get('region')?.value || 'IN'

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_prices!inner(price, currency)
    `
    )
    .eq('slug', params.slug)
    .eq('product_prices.region', region)
    .single()

  if (error || !product) {
    return <div className="p-10">Product not found</div>
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="mt-4">{product.description}</p>

      <p className="mt-6 text-xl font-semibold">
        {product.product_prices.currency} {product.product_prices.price}
      </p>
    </div>
  )
}
