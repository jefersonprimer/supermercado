import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está configurada.");

async function init() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Conectado ao banco. Criando tabelas de promoções...");

  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      description TEXT,
      scope_type VARCHAR(20) NOT NULL DEFAULT 'store'
        CHECK (scope_type IN ('store', 'department', 'category', 'brand', 'product')),
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage'
        CHECK (discount_type IN ('percentage', 'fixed', 'fixed_price')),
      discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
      min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
      max_discount NUMERIC(10, 2),
      badge_label VARCHAR(40),
      priority INTEGER NOT NULL DEFAULT 0,
      stackable BOOLEAN NOT NULL DEFAULT FALSE,
      combinable_with_coupon BOOLEAN NOT NULL DEFAULT TRUE,
      starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.promotion_targets (
      promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
      target_type VARCHAR(20) NOT NULL
        CHECK (target_type IN ('department', 'category', 'brand', 'product')),
      target_value TEXT NOT NULL,
      PRIMARY KEY (promotion_id, target_type, target_value)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS promotions_active_idx
      ON public.promotions (active, starts_at, expires_at);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS promotion_targets_lookup_idx
      ON public.promotion_targets (target_type, target_value);
  `);

  console.log("Tabelas de promoções criadas com sucesso!");
  await client.end();
}

init().catch((error) => {
  console.error("Erro ao criar tabelas de promoções:", error);
  process.exit(1);
});
