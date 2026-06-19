-- =============================================================
-- backend-php/database/schema.sql
-- Run this on: MySQL server 163.223.227.37, DB: iqdyjeaz_papunda
-- =============================================================

-- -------------------------------------------------------
-- Table: users_legal
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users_legal` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`             VARCHAR(255)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL UNIQUE,
  `password_hash`    VARCHAR(255)  NULL COMMENT 'bcrypt hash, NULL for old Google OAuth users',
  `role`             ENUM('admin','user') NOT NULL DEFAULT 'user',
  `profile_pictures` TEXT          NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (`email`),
  INDEX idx_role  (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add password_hash column if table already exists without it
ALTER TABLE `users_legal` 
  ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NULL 
  COMMENT 'bcrypt hash' 
  AFTER `email`;

-- -------------------------------------------------------
-- Table: form_structures
-- Master template for each form type (NIB, PT, CV, etc.)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `form_structures` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_type`     VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique key, e.g. nib_pribadi',
  `label`         VARCHAR(255) NOT NULL COMMENT 'Display name, e.g. Pembuatan NIB Pribadi',
  `description`   TEXT         NULL,
  `form_structure` JSON        NOT NULL COMMENT 'JSON definition of form sections and fields',
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_form_type (`form_type`),
  INDEX idx_active    (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: form_configurations
-- Each row = one form instance generated for a client
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `form_configurations` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_type`      VARCHAR(100) NOT NULL,
  `assigned_wa`    VARCHAR(255) NOT NULL COMMENT 'Client WhatsApp number this form is for',
  `slug`           VARCHAR(64)  NOT NULL UNIQUE COMMENT 'URL-friendly unique identifier',
  `note`           TEXT         NULL COMMENT 'Admin notes',
  `created_by`     INT UNSIGNED NULL COMMENT 'Admin user ID who created this',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug      (`slug`),
  INDEX idx_assigned_wa (`assigned_wa`),
  INDEX idx_form_type (`form_type`),
  FOREIGN KEY (`form_type`) REFERENCES `form_structures` (`form_type`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: form_submissions
-- Stores draft and final submission data per form
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_config_id` INT UNSIGNED NOT NULL,
  `user_id`        INT UNSIGNED NULL COMMENT 'NULL for public submissions (no login)',
  `data`           JSON         NOT NULL DEFAULT ('{}') COMMENT 'Form field values as JSON',
  `status`         ENUM('draft','submitted','proses','review','selesai') NOT NULL DEFAULT 'draft',
  `submitted_at`   DATETIME     NULL,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_config (`form_config_id`),
  INDEX idx_status (`status`),
  FOREIGN KEY (`form_config_id`) REFERENCES `form_configurations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: form_folder (for file manager - keep existing)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `form_folder` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug`        VARCHAR(64)  NOT NULL UNIQUE,
  `nama_folder` VARCHAR(255) NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
