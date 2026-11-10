import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureCandidatesSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS public.job_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(200) NOT NULL,
          photo_url TEXT,
          birth_date DATE NOT NULL,
          current_address VARCHAR(500) NOT NULL,
          email VARCHAR(254) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          marital_status VARCHAR(30) NOT NULL
            CHECK (marital_status IN ('Casado(a)', 'Solteiro(a)', 'União estável')),
          has_children BOOLEAN NOT NULL,
          children_count INTEGER,
          previous_jobs TEXT NOT NULL,
          previous_dislikes TEXT NOT NULL,
          education VARCHAR(50) NOT NULL,
          teamwork_response TEXT NOT NULL,
          skills TEXT NOT NULL,
          interested_positions TEXT[] NOT NULL,
          other_position VARCHAR(120),
          work_shifts TEXT[] NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (
            (has_children = TRUE AND children_count IS NOT NULL AND children_count BETWEEN 1 AND 30) OR
            (has_children = FALSE AND children_count IS NULL)
          )
        )
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS job_applications_created_idx
        ON public.job_applications (created_at DESC)
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

