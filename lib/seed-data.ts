import { supabase } from './supabase/client';

export async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    const categories = [
      { name: 'Men', slug: 'men', description: 'Men\'s fashion and accessories' },
      { name: 'Women', slug: 'women', description: 'Women\'s fashion and accessories' },
      { name: 'Kids', slug: 'kids', description: 'Kids\' clothing and accessories' },
      { name: 'Accessories', slug: 'accessories', description: 'Fashion accessories' },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes and footwear' },
      { name: 'Electronics', slug: 'electronics', description: 'Electronic gadgets' },
    ];

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (categoryError) throw categoryError;
    console.log('Categories seeded successfully');

    const products = [
      {
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear',
        brand: 'Samara Basics',
        category_id: categoryData?.find(c => c.slug === 'men')?.id,
        base_price_inr: 799,
        is_active: true,
      },
      {
        name: 'Denim Jeans',
        slug: 'denim-jeans',
        description: 'Premium quality denim jeans with perfect fit',
        brand: 'Samara Denim',
        category_id: categoryData?.find(c => c.slug === 'men')?.id,
        base_price_inr: 2499,
        is_active: true,
      },
      {
        name: 'Floral Summer Dress',
        slug: 'floral-summer-dress',
        description: 'Beautiful floral print dress perfect for summer',
        brand: 'Samara Collection',
        category_id: categoryData?.find(c => c.slug === 'women')?.id,
        base_price_inr: 1999,
        is_active: true,
      },
      {
        name: 'Leather Wallet',
        slug: 'leather-wallet',
        description: 'Genuine leather wallet with multiple card slots',
        brand: 'Samara Leather',
        category_id: categoryData?.find(c => c.slug === 'accessories')?.id,
        base_price_inr: 1299,
        is_active: true,
      },
      {
        name: 'Running Shoes',
        slug: 'running-shoes',
        description: 'Lightweight running shoes with excellent cushioning',
        brand: 'Samara Sports',
        category_id: categoryData?.find(c => c.slug === 'footwear')?.id,
        base_price_inr: 3999,
        is_active: true,
      },
      {
        name: 'Wireless Earbuds',
        slug: 'wireless-earbuds',
        description: 'High-quality wireless earbuds with noise cancellation',
        brand: 'Samara Audio',
        category_id: categoryData?.find(c => c.slug === 'electronics')?.id,
        base_price_inr: 4999,
        is_active: true,
      },
    ];

    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'slug' })
      .select();

    if (productError) throw productError;
    console.log('Products seeded successfully');

    for (const product of productData || []) {
      const variants = [
        { product_id: product.id, size: 'S', stock: 10, additional_price_inr: 0 },
        { product_id: product.id, size: 'M', stock: 15, additional_price_inr: 0 },
        { product_id: product.id, size: 'L', stock: 12, additional_price_inr: 0 },
        { product_id: product.id, size: 'XL', stock: 8, additional_price_inr: 100 },
      ];

      await supabase
        .from('product_variants')
        .upsert(variants, { onConflict: 'product_id,size' });

      await supabase
        .from('product_images')
        .upsert(
          [{
            product_id: product.id,
            image_url: `https://images.pexels.com/photos/1972115/pexels-photo-1972115.jpeg?auto=compress&cs=tinysrgb&w=800`,
            is_primary: true,
            display_order: 0,
          }],
          { onConflict: 'product_id,display_order' }
        );
    }

    console.log('Product variants and images seeded successfully');

    const coupons = [
      {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        min_cart_value_inr: 500,
        max_discount_inr: 1000,
        valid_from: new Date().toISOString(),
        is_active: true,
      },
      {
        code: 'FLAT500',
        type: 'FLAT',
        value: 500,
        min_cart_value_inr: 2000,
        valid_from: new Date().toISOString(),
        is_active: true,
      },
    ];

    const { error: couponError } = await supabase
      .from('coupons')
      .upsert(coupons, { onConflict: 'code' });

    if (couponError) throw couponError;
    console.log('Coupons seeded successfully');

    console.log('Database seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}
