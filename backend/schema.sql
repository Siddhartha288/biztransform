-- DigitalReady database schema + seed data
-- Run against a MySQL database you've already created, e.g.:
--   CREATE DATABASE digitalready CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE digitalready;
--   SOURCE schema.sql;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS roadmaps;
DROP TABLE IF EXISTS responses;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('business', 'advisor') NOT NULL DEFAULT 'business',
  business_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_categories_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  text VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_questions_category (category_id),
  CONSTRAINT fk_questions_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  level VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_assessments_user_created (user_id, created_at),
  CONSTRAINT fk_assessments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE responses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  answer TINYINT NOT NULL,
  KEY idx_responses_assessment (assessment_id),
  KEY idx_responses_question (question_id),
  CONSTRAINT fk_responses_assessment
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_responses_question
    FOREIGN KEY (question_id) REFERENCES questions(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_responses_answer CHECK (answer IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roadmaps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roadmaps_assessment (assessment_id),
  CONSTRAINT fk_roadmaps_assessment
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories
INSERT INTO categories (`key`, label) VALUES
  ('online_presence', 'Online Presence'),
  ('digital_payments', 'Digital Payments'),
  ('marketing', 'Marketing'),
  ('operations', 'Operations'),
  ('data_use', 'Data Use');

-- Seed questions (3 per category, 15 total)
INSERT INTO questions (category_id, text, sort_order)
SELECT c.id, q.text, q.sort_order
FROM (
  SELECT 'online_presence' AS cat_key, 'Do you have a mobile-friendly website that clearly explains what you offer?' AS text, 1 AS sort_order
  UNION ALL SELECT 'online_presence', 'Can customers find your business on Google Maps or a local directory listing?', 2
  UNION ALL SELECT 'online_presence', 'Do you update your online profiles (website or social) at least monthly?', 3
  UNION ALL SELECT 'digital_payments', 'Can customers pay you online (card, PayPal, Stripe, or similar)?', 1
  UNION ALL SELECT 'digital_payments', 'Do you send digital invoices or receipts instead of paper-only?', 2
  UNION ALL SELECT 'digital_payments', 'Do you reconcile payments digitally (accounting software or spreadsheet)?', 3
  UNION ALL SELECT 'marketing', 'Do you use email or SMS to stay in touch with customers?', 1
  UNION ALL SELECT 'marketing', 'Do you run any paid digital ads (Google, Meta, or similar)?', 2
  UNION ALL SELECT 'marketing', 'Do you collect customer reviews online and respond to them?', 3
  UNION ALL SELECT 'operations', 'Do you use shared digital tools for scheduling, bookings, or task tracking?', 1
  UNION ALL SELECT 'operations', 'Can your team access key business files from anywhere (cloud storage)?', 2
  UNION ALL SELECT 'operations', 'Do you automate any routine tasks (reminders, order confirmations, etc.)?', 3
  UNION ALL SELECT 'data_use', 'Do you track basic sales or customer metrics in a spreadsheet or dashboard?', 1
  UNION ALL SELECT 'data_use', 'Do you review performance data at least monthly to guide decisions?', 2
  UNION ALL SELECT 'data_use', 'Do you store customer contact details securely in a digital system (CRM or list)?', 3
) AS q
JOIN categories c ON c.`key` = q.cat_key;
