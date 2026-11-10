import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está configurada.");

async function init() {
  console.log("Conectando ao banco Supabase PostgreSQL...");
  const client = new Client({
    connectionString,
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log("Conectado com sucesso!");

  console.log("Criando tabelas...");

  // Extensão pgcrypto para UUID caso não exista
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

  // Tabela de Usuários
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Tabela de Produtos
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      original_price NUMERIC(10, 2),
      image_url TEXT,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      stock INTEGER DEFAULT 100,
      is_featured BOOLEAN DEFAULT false,
      is_new BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);`);
  await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);`);
  await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;`);

  // Acelera a busca parcial (ILIKE '%termo%') usada no autocomplete.
  await client.query(`
    CREATE INDEX IF NOT EXISTS products_name_trgm_idx
      ON public.products USING GIN (name gin_trgm_ops);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS products_description_trgm_idx
      ON public.products USING GIN (description gin_trgm_ops);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS products_brand_trgm_idx
      ON public.products USING GIN (brand gin_trgm_ops);
  `);

  // Tabela de Sessões
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Tabela de Cupons
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

  // Tabela de Promoções
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      description TEXT,
      promotion_type VARCHAR(20) NOT NULL DEFAULT 'discount'
        CHECK (promotion_type IN ('discount', 'free_shipping')),
      min_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_purchase >= 0),
      scope_type VARCHAR(20) NOT NULL DEFAULT 'store'
        CHECK (scope_type IN ('store', 'department', 'category', 'brand', 'product')),
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage'
        CHECK (discount_type IN ('percentage', 'fixed', 'fixed_price')),
      discount_value NUMERIC(10, 2) NOT NULL
        CHECK ((promotion_type = 'discount' AND discount_value > 0) OR
               (promotion_type = 'free_shipping' AND discount_value = 0)),
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

  // Alvos das promoções (departamento, categoria, marca ou produto)
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

  console.log("Tabelas criadas com sucesso no Supabase!");
  await client.end();
}

init().catch((err) => {
  console.error("Erro ao inicializar o banco de dados:", err);
  process.exit(1);
});
