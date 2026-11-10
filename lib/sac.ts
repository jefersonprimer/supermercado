import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureSacSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS public.sac_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('Sugestão', 'Reclamação')),
          full_name VARCHAR(200) NOT NULL,
          email VARCHAR(254) NOT NULL,
          phone VARCHAR(40),
          order_number VARCHAR(100),
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS sac_messages_created_idx
        ON public.sac_messages (created_at DESC)
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
