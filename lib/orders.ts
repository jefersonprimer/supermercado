import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureOrdersSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id),
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
          payment_id VARCHAR(100),
          payment_preference_id VARCHAR(100),
          payment_order_id VARCHAR(100),
          payment_url TEXT,
          items JSONB NOT NULL,
          address JSONB NOT NULL,
          scheduled_for TIMESTAMPTZ NOT NULL,
          subtotal NUMERIC(10,2) NOT NULL,
          total NUMERIC(10,2) NOT NULL,
          history JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders(user_id, created_at DESC)`);
      await query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'pending'`);
      await query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100)`);
      await query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_preference_id VARCHAR(100)`);
      await query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(100)`);
      await query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_url TEXT`);
      await query(`UPDATE public.orders SET payment_status='not_required' WHERE status <> 'pending_payment' AND payment_status='pending' AND payment_id IS NULL AND payment_preference_id IS NULL AND payment_order_id IS NULL`);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
