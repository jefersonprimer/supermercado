import { cache } from "react";
import { cacheLife } from "next/cache";
import { query } from "@/lib/db";
import { withProductPromotions } from "@/lib/promotions-server";
import type { Product } from "@/types/product";

export const getAllProducts = cache(async (): Promise<Product[]> => {
  "use cache";
  cacheLife("minutes");
  const products = await query<Product>(
    `SELECT
      id, name, slug, department, category, subcategory, brand,
      COALESCE(images, ARRAY[image_url]) as images,
      COALESCE(options, '[]'::jsonb) as options,
      description, COALESCE(specifications, '{}'::jsonb) as specifications,
      price, original_price, installment_price,
      COALESCE(installments, 3) as installments,
      stock, is_featured, is_new, created_at, updated_at
    FROM public.products
    ORDER BY created_at DESC, id DESC`,
  );
  return withProductPromotions(products);
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  "use cache";
  cacheLife("minutes");
  const products = await query<Product>(
    `SELECT
      id, name, slug, department, category, subcategory, brand,
      COALESCE(images, ARRAY[image_url]) as images,
      COALESCE(options, '[]'::jsonb) as options,
      description, COALESCE(specifications, '{}'::jsonb) as specifications,
      price, original_price, installment_price,
      COALESCE(installments, 3) as installments,
      stock, is_featured, is_new, created_at, updated_at
    FROM public.products
    WHERE slug = $1
    LIMIT 1`,
    [slug],
  );

  if (products.length === 0) return null;
  const [product] = await withProductPromotions(products);
  return product;
});
