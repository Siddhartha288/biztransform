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
    created_at: row.created_at,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, business_name } = req.body || {};

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

    const existing = await query('SELECT id FROM users WHERE email = :email LIMIT 1', {
      email: email.trim().toLowerCase(),
    });
    if (existing.length) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, business_name)
       VALUES (:name, :email, :password_hash, :role, :business_name)`,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        role: normalizedRole,
        business_name:
          normalizedRole === 'business' && business_name
            ? String(business_name).trim()
            : null,
      }
    );

    const rows = await query(
      'SELECT id, name, email, role, business_name, created_at FROM users WHERE id = :id',
      { id: result.insertId }
    );
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

    const rows = await query(
      `SELECT id, name, email, password_hash, role, business_name, created_at
       FROM users WHERE email = :email LIMIT 1`,
      { email: email.trim().toLowerCase() }
    );

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
