import { query } from "@/lib/db";

let shippingColumnReady: Promise<void> | null = null;

export function ensureCouponShippingColumn() {
  if (!shippingColumnReady) {
    shippingColumnReady = (async () => {
      await query(
        "ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE",
      );
      await query(
        "ALTER TABLE public.coupons ALTER COLUMN discount_value SET DEFAULT 0",
      );
      await query(
        "ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_value_check",
      );
      await query(
        "ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_value_check CHECK (discount_value > 0 OR free_shipping = TRUE)",
      ).catch(async (error: { code?: string }) => {
        if (error.code !== "42710") throw error;
      });
    })()
      .then(() => undefined)
      .catch((error) => {
        shippingColumnReady = null;
        throw error;
      });
  }
  return shippingColumnReady;
}
