-- =============================================================
-- Social Media Content Planner - Database Schema
-- Run this on: MySQL server 163.223.227.37, DB: iqdyjeaz_papunda
-- =============================================================

-- -------------------------------------------------------
-- Table: sm_accounts
-- Akun sosial media terkoneksi (Instagram / TikTok)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_accounts` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`           INT UNSIGNED NOT NULL,
  `platform`          ENUM('instagram','tiktok') NOT NULL,
  `platform_user_id`  VARCHAR(255) NOT NULL COMMENT 'IG user ID or TikTok open_id',
  `username`          VARCHAR(255) NOT NULL,
  `display_name`      VARCHAR(255) NULL,
  `profile_picture`   TEXT NULL,
  `access_token`      TEXT NOT NULL COMMENT 'Platform access token',
  `refresh_token`     TEXT NULL,
  `token_expires_at`  DATETIME NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `connected_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  INDEX idx_platform (`platform`),
  INDEX idx_active (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users_legal` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_posts
-- Konten utama (satu post bisa di-publish ke banyak akun)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_posts` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT UNSIGNED NOT NULL,
  `caption`         TEXT NULL,
  `post_type`       ENUM('image','carousel','video','reel') NOT NULL DEFAULT 'image',
  `status`          ENUM('draft','scheduled','publishing','published','failed') NOT NULL DEFAULT 'draft',
  `scheduled_at`    DATETIME NULL COMMENT 'Waktu dijadwalkan untuk publish',
  `published_at`    DATETIME NULL,
  `error_message`   TEXT NULL COMMENT 'Pesan error jika gagal publish',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  INDEX idx_status (`status`),
  INDEX idx_scheduled (`scheduled_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users_legal` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_post_media
-- Media files per post (gambar/video, support carousel)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_post_media` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id`         INT UNSIGNED NOT NULL,
  `media_url`       TEXT NOT NULL COMMENT 'URL/path ke file media',
  `media_type`      ENUM('image','video') NOT NULL DEFAULT 'image',
  `original_name`   VARCHAR(255) NULL COMMENT 'Nama file asli',
  `sort_order`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `thumbnail_url`   TEXT NULL COMMENT 'Thumbnail untuk video',
  `file_size`       INT UNSIGNED NULL COMMENT 'Ukuran file dalam bytes',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post_id (`post_id`),
  FOREIGN KEY (`post_id`) REFERENCES `sm_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_post_targets
-- Akun target publish (satu post -> banyak akun)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_post_targets` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id`           INT UNSIGNED NOT NULL,
  `account_id`        INT UNSIGNED NOT NULL,
  `platform_post_id`  VARCHAR(255) NULL COMMENT 'ID post di platform setelah publish',
  `status`            ENUM('pending','publishing','published','failed') NOT NULL DEFAULT 'pending',
  `error_message`     TEXT NULL,
  `published_at`      DATETIME NULL,
  INDEX idx_post_id (`post_id`),
  INDEX idx_account_id (`account_id`),
  FOREIGN KEY (`post_id`) REFERENCES `sm_posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `sm_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_post_platform_settings
-- Settings spesifik per platform (TikTok title, visibility, dll)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_post_platform_settings` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_target_id`  INT UNSIGNED NOT NULL,
  `setting_key`     VARCHAR(100) NOT NULL COMMENT 'e.g. tiktok_title, tiktok_visibility',
  `setting_value`   TEXT NULL,
  UNIQUE KEY uq_target_setting (`post_target_id`, `setting_key`),
  FOREIGN KEY (`post_target_id`) REFERENCES `sm_post_targets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_hashtags
-- Library hashtag yang bisa di-reuse
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_hashtags` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT UNSIGNED NOT NULL,
  `name`            VARCHAR(100) NOT NULL,
  `hashtags`        TEXT NOT NULL COMMENT 'Comma-separated hashtags',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users_legal` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: sm_publish_log
-- Log untuk tracking proses publish
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sm_publish_log` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_target_id`  INT UNSIGNED NOT NULL,
  `action`          VARCHAR(50) NOT NULL COMMENT 'e.g. publish_init, published, failed',
  `details`         JSON NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post_target (`post_target_id`),
  FOREIGN KEY (`post_target_id`) REFERENCES `sm_post_targets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
