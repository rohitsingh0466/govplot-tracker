-- ============================================================
-- GovPlot Tracker — Supabase Migration v1.2
-- Run this in Supabase SQL Editor
-- Adds: first_name, last_name, google_id, avatar_url,
--       phone_verified, otp_code, otp_expires_at
-- Safe to run multiple times (IF NOT EXISTS / idempotent)
-- ============================================================

-- Users table — v1.2 new columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name            VARCHAR(64),
  ADD COLUMN IF NOT EXISTS last_name             VARCHAR(64),
  ADD COLUMN IF NOT EXISTS google_id             VARCHAR(128),
  ADD COLUMN IF NOT EXISTS avatar_url            VARCHAR(512),
  ADD COLUMN IF NOT EXISTS phone_verified        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS otp_code              VARCHAR(10),
  ADD COLUMN IF NOT EXISTS otp_expires_at        TIMESTAMP WITH TIME ZONE;

-- Make sure all v1.1 columns exist too (idempotent safety net)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_tier       VARCHAR(32)  DEFAULT 'free'     NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status     VARCHAR(32)  DEFAULT 'inactive' NOT NULL,
  ADD COLUMN IF NOT EXISTS is_active               BOOLEAN      DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login_at           TIMESTAMP WITH TIME ZONE;

-- Make email nullable (for phone-only / Google users without email)
ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

-- Make hashed_password nullable (for Google / OTP users)
ALTER TABLE public.users
  ALTER COLUMN hashed_password DROP NOT NULL;

-- Index on google_id for fast OAuth lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON public.users (google_id)
  WHERE google_id IS NOT NULL;

-- Index on phone for OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone)
  WHERE phone IS NOT NULL;

-- ============================================================
-- Verify
-- ============================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'users'
ORDER BY ordinal_position;
