const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/businesses',
  authenticate,
  requireRole('advisor'),
  async (req, res, next) => {
    try {
      const rows = await query(
        `SELECT u.id, u.name, u.email, u.business_name, u.created_at,
                s.label AS sector_label,
                a.id AS assessment_id,
                a.total_score,
                a.level,
                a.created_at AS assessment_date
         FROM users u
         LEFT JOIN sectors s ON s.id = u.sector_id
         LEFT JOIN assessments a
           ON a.id = (
             SELECT a2.id
             FROM assessments a2
             WHERE a2.user_id = u.id
             ORDER BY a2.created_at DESC, a2.id DESC
             LIMIT 1
           )
         WHERE u.role = 'business'
         ORDER BY a.total_score IS NULL ASC, a.total_score DESC, u.name ASC`
      );

      return res.json({
        businesses: rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          business_name: r.business_name,
          sector_label: r.sector_label,
          created_at: r.created_at,
          latest_assessment: r.assessment_id
            ? {
                id: r.assessment_id,
                score: Number(r.total_score),
                level: r.level,
                date: r.assessment_date,
              }
            : null,
        })),
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
