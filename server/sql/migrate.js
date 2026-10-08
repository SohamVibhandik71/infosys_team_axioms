import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.trim() === '' || databaseUrl.includes('[YOUR-')) {
  console.error('❌ Error: DATABASE_URL is not configured in server/.env');
  console.error('Please add your PostgreSQL connection string (e.g. Supabase, Neon, or local Postgres) to server/.env:');
  console.error('DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres');
  process.exit(1);
}

const sslConfig = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`🚀 Connecting to PostgreSQL at ${databaseUrl.split('@')[1] || 'database'}...`);

  const client = await pool.connect();

  try {
    console.log(`📦 Running ${files.length} migration script(s)...`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Executing ${file}...`);
      await client.query(sql);
      console.log(`✅ Completed ${file}`);
    }

    console.log('🎉 All PostgreSQL database tables and indexes created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
