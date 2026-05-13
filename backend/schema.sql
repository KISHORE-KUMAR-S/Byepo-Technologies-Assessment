CREATE DATABASE IF NOT EXISTS feature_flags_db;
USE feature_flags_db;

CREATE TABLE IF NOT EXISTS organizations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('org_admin') NOT NULL DEFAULT 'org_admin',
  org_id        INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  feature_key VARCHAR(255)    NOT NULL,
  is_enabled  TINYINT(1)      NOT NULL DEFAULT 0,
  org_id      INT UNSIGNED    NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_flag_per_org (feature_key, org_id),
  CONSTRAINT fk_flags_org FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE
);
