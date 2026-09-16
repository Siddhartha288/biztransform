const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sector_id: user.sector_id || null,
      sector_key: user.sector_key || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    business_name: row.business_name,
    sector_id: row.sector_id || null,
    sector_key: row.sector_key || null,
    sector_label: row.sector_label || null,
    created_at: row.created_at,
  };
}

const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.password_hash, u.role, u.business_name, u.created_at,
         u.sector_id, s.\`key\` AS sector_key, s.label AS sector_label
  FROM users u
  LEFT JOIN sectors s ON s.id = u.sector_id
`;

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, business_name, sector } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedRole = role === 'advisor' ? 'advisor' : 'business';
    if (role && role !== 'business' && role !== 'advisor') {
      return res.status(400).json({ message: "Role must be 'business' or 'advisor'" });
    }

    let sectorId = null;
    if (normalizedRole === 'business') {
      if (!sector || typeof sector !== 'string' || !sector.trim()) {
        return res.status(400).json({ message: 'Business sector is required' });
      }
      const sectorRows = await query('SELECT id FROM sectors WHERE `key` = :key LIMIT 1', {
        key: sector.trim(),
      });
      if (!sectorRows.length) {
        return res.status(400).json({ message: 'Unknown business sector' });
      }
      sectorId = sectorRows[0].id;
    }

    const existing = await query('SELECT id FROM users WHERE email = :email LIMIT 1', {
      email: email.trim().toLowerCase(),
    });
    if (existing.length) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, business_name, sector_id)
       VALUES (:name, :email, :password_hash, :role, :business_name, :sector_id)`,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        role: normalizedRole,
        business_name:
          normalizedRole === 'business' && business_name
            ? String(business_name).trim()
            : null,
        sector_id: sectorId,
      }
    );

    const rows = await query(`${USER_SELECT} WHERE u.id = :id`, { id: result.insertId });
    const user = rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const rows = await query(`${USER_SELECT} WHERE u.email = :email LIMIT 1`, {
      email: email.trim().toLowerCase(),
    });

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
