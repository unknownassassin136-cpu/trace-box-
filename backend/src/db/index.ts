import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL || 'postgresql://postgres.takqjthgdwuqavnvyoxb:ajrdigitalhub%40@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1');
export const db = drizzle(queryClient, { schema });
