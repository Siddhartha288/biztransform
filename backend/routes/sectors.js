const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT `key`, label FROM sectors ORDER BY id ASC');
    return res.json({ sectors: rows });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
