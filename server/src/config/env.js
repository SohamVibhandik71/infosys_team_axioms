import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('meetingos_dev_secret_key_change_in_prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  QUALCOMM_AI_BASE_URL: z.string().optional(),
  QUALCOMM_AI_API_KEY: z.string().optional(),
  QUALCOMM_AI_MODEL: z.string().default('llama-3.3-70b-instruct'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_WHISPER_MODEL: z.string().default('whisper-large-v3'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Environment configuration error:', parsedEnv.error.format());
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
export default env;
