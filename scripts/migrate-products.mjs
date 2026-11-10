import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está configurada.");

async function migrate() {
  console.log("Conectando ao banco Supabase PostgreSQL para migração de produtos...");
  const client = new Client({
    connectionString,
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  console.log("Adicionando novos campos na tabela public.products...");

  await client.query(`
    -- Adicionar array de imagens se não existir
    ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
    ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
    ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS installment_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 3;

    -- Se já existia image_url mas images está vazio, migrar image_url para o array images
    UPDATE public.products 
    SET images = ARRAY[image_url] 
    WHERE (images IS NULL OR array_length(images, 1) IS NULL) 
      AND image_url IS NOT NULL 
      AND image_url != '';
  `);

  console.log("Migração concluída com sucesso!");
  await client.end();
}

migrate().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
