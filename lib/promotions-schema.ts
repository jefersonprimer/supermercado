import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensurePromotionsSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        ALTER TABLE public.promotions
          ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(20) NOT NULL DEFAULT 'discount',
          ADD COLUMN IF NOT EXISTS min_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0
      `);
      await query(`
        ALTER TABLE public.promotions
          DROP CONSTRAINT IF EXISTS promotions_discount_value_check
      `);
      await query(`
        ALTER TABLE public.promotions
          DROP CONSTRAINT IF EXISTS promotions_promotion_type_check
      `);
      await query(`
        ALTER TABLE public.promotions
          DROP CONSTRAINT IF EXISTS promotions_min_purchase_check
      `);
      await query(`
        ALTER TABLE public.promotions
          ADD CONSTRAINT promotions_promotion_type_check
          CHECK (promotion_type IN ('discount', 'free_shipping'))
      `);
      await query(`
        ALTER TABLE public.promotions
          ADD CONSTRAINT promotions_discount_value_check
          CHECK (
            (promotion_type = 'discount' AND discount_value > 0) OR
            (promotion_type = 'free_shipping' AND discount_value = 0)
          )
      `);
      await query(`
        ALTER TABLE public.promotions
          ADD CONSTRAINT promotions_min_purchase_check CHECK (min_purchase >= 0)
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
