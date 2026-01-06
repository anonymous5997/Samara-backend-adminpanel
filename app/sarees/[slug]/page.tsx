import { cookies } from 'next/headers'

const region =
  cookies().get('region')?.value || 'IN'

const { data: product } = await supabase
  .from('products')
  .select(`
    *,
    product_prices!inner(price, currency)
  `)
  .eq('slug', params.slug)
  .eq('product_prices.region', region)
  .single()
