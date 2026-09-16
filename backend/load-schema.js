/**
 * Load schema.sql into MySQL.
 * Usage (from backend folder):
 *   node load-schema.js your_mysql_password
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const password = process.argv[2];
  if (password === undefined) {
    console.error('Usage: node load-schema.js your_mysql_password');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS digitalready CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    await connection.query('USE digitalready');
    await connection.query(sql);

    const [tables] = await connection.query('SHOW TABLES');
    const [[{ questions }]] = await connection.query(
      'SELECT COUNT(*) AS questions FROM questions'
    );

    console.log('Schema loaded successfully.');
    console.log(
      'Tables:',
      tables.map((t) => Object.values(t)[0]).join(', ')
    );
    console.log('Questions seeded:', questions);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
