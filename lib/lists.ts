import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureListsSchema() {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS public.user_list_items (
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id)
      )
    `).then(() => undefined).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
