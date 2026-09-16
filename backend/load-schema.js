/**
 * Loads schema.sql (tables + categories/sectors seed) into the configured
 * database, then seeds sector-specific questions. Reads DB connection info
 * from .env (same as db.js) — the account only needs access to its own
 * database, not CREATE DATABASE privileges.
 *
 * Usage (from backend folder): node load-schema.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digitalready',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log('Schema loaded successfully.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
