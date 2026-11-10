import { Client } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está configurada.");

const adminEmail = process.env.ADMIN_EMAIL || "fanfarfarmacia@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) throw new Error("ADMIN_PASSWORD não está configurada.");

async function createAdmin() {
  const client = new Client({
    connectionString,
    ssl:
      process.env.POSTGRES_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
  });
  await client.connect();

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(adminPassword, salt);

  const res = await client.query(
    `INSERT INTO public.users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) 
     DO UPDATE SET password_hash = $3, role = 'admin', updated_at = NOW()
     RETURNING id, name, email, role;`,
    ["Administrador Fanfar", adminEmail.toLowerCase(), hash, "admin"]
  );

  console.log("Admin configurado com sucesso:", res.rows[0]);
  await client.end();
}

createAdmin().catch((err) => {
  console.error("Erro ao criar admin:", err);
  process.exit(1);
});
