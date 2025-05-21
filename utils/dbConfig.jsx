import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schemaa from './schema'

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });
