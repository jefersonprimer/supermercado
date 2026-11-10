import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está configurada.");

async function init() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Conectado ao banco. Criando tabela de cupons...");

  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage'
        CHECK (discount_type IN ('percentage', 'fixed')),
      free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
      discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_value > 0 OR free_shipping = TRUE),
      min_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0,
      max_discount NUMERIC(10, 2),
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (UPPER(code));
  `);

  console.log("Tabela de cupons criada com sucesso!");
  await client.end();
}

init().catch((error) => {
  console.error("Erro ao criar tabela de cupons:", error);
  process.exit(1);
});
