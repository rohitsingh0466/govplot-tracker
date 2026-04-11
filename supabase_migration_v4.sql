-- ============================================================
-- GovPlot Tracker — Supabase Migration v4.0
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- 
-- WHAT THIS MIGRATION DOES:
--   1. Adds admin-editable fields to schemes table
--   2. Creates admin RLS policies (service_role can update)
--   3. Creates alert_dispatch_view (for notification system)
--   4. Creates alert_dispatch_blocked_view (for dashboard warnings)
--   5. Creates sync_user_subscription() function (for Razorpay)
--   6. Adds city validation constraint (only 20 allowed cities)
--   7. Creates admin audit log table
--
-- NOTE: Run sections one at a time if you hit errors.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- SECTION 1: Admin-editable fields on schemes table
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.schemes
    ADD COLUMN IF NOT EXISTS is_manually_edited    BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS manual_notes          TEXT,
    ADD COLUMN IF NOT EXISTS admin_last_updated    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_override_status VARCHAR(32),  -- If set, overrides scraped status
    ADD COLUMN IF NOT EXISTS data_source           VARCHAR(10)  NOT NULL DEFAULT 'STATIC',
    ADD COLUMN IF NOT EXISTS scraper_status        VARCHAR(20)  NOT NULL DEFAULT 'fallback',
    ADD COLUMN IF NOT EXISTS verification_score    SMALLINT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified              BOOLEAN      NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.schemes.is_manually_edited    IS 'True if an admin has manually edited this scheme via dashboard';
COMMENT ON COLUMN public.schemes.manual_notes          IS 'Admin notes about this scheme (not shown to users)';
COMMENT ON COLUMN public.schemes.admin_last_updated    IS 'Timestamp of last admin edit';
COMMENT ON COLUMN public.schemes.admin_override_status IS 'If set by admin, overrides scraped status (OPEN/CLOSED/UPCOMING/ACTIVE)';
COMMENT ON COLUMN public.schemes.data_source           IS 'LIVE = scraped from authority/aggregator, STATIC = hardcoded fallback';
COMMENT ON COLUMN public.schemes.scraper_status        IS 'ok = live scraped, fallback = static used, aggregator = from aggregator';


-- ─────────────────────────────────────────────────────────────
-- SECTION 2: City validation — only 20 allowed cities
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'schemes_city_check' AND conrelid = 'public.schemes'::regclass
    ) THEN
        ALTER TABLE public.schemes ADD CONSTRAINT schemes_city_check
        CHECK (city IN (
            'Greater Noida', 'Lucknow', 'Jaipur', 'Agra', 'Prayagraj',
            'Chandigarh', 'Navi Mumbai', 'Hyderabad', 'Pune', 'Bengaluru',
            'Raipur', 'Varanasi', 'Bhubaneswar', 'Nagpur', 'Ahmedabad',
            'Delhi', 'Bhopal', 'Udaipur', 'Dehradun', 'Meerut'
        ));
        RAISE NOTICE 'City constraint added';
    ELSE
        RAISE NOTICE 'City constraint already exists — skipping';
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- SECTION 3: Admin audit log
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_scheme_edits (
    id              SERIAL PRIMARY KEY,
    scheme_id       VARCHAR(64) NOT NULL,
    edited_by       VARCHAR(256),           -- admin email
    action          VARCHAR(50),            -- 'update_status', 'add_notes', 'manual_edit', etc.
    old_values      JSONB,
    new_values      JSONB,
    edited_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_scheme_edits IS 'Audit log of all manual admin edits to schemes';

-- RLS: only service_role can read audit log
ALTER TABLE public.admin_scheme_edits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_audit" ON public.admin_scheme_edits;
CREATE POLICY "service_role_all_audit" ON public.admin_scheme_edits
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- SECTION 4: RLS Policies for schemes table
-- ─────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Public can read active schemes
DROP POLICY IF EXISTS "public_read_schemes" ON public.schemes;
CREATE POLICY "public_read_schemes" ON public.schemes
    FOR SELECT USING (is_active = TRUE);

-- Service role (backend) can do everything including admin edits
DROP POLICY IF EXISTS "service_role_all_schemes" ON public.schemes;
CREATE POLICY "service_role_all_schemes" ON public.schemes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read all active schemes (for signed-in users)
DROP POLICY IF EXISTS "auth_read_schemes" ON public.schemes;
CREATE POLICY "auth_read_schemes" ON public.schemes
    FOR SELECT TO authenticated USING (is_active = TRUE);


-- ─────────────────────────────────────────────────────────────
-- SECTION 5: Admin API function — update scheme manually
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_scheme(
    p_scheme_id         VARCHAR(64),
    p_admin_email       VARCHAR(256),
    p_name              VARCHAR(512)    DEFAULT NULL,
    p_status            VARCHAR(32)     DEFAULT NULL,
    p_open_date         VARCHAR(32)     DEFAULT NULL,
    p_close_date        VARCHAR(32)     DEFAULT NULL,
    p_total_plots       INTEGER         DEFAULT NULL,
    p_price_min         FLOAT           DEFAULT NULL,
    p_price_max         FLOAT           DEFAULT NULL,
    p_location_details  TEXT            DEFAULT NULL,
    p_apply_url         VARCHAR(1024)   DEFAULT NULL,
    p_manual_notes      TEXT            DEFAULT NULL,
    p_admin_override_status VARCHAR(32) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_scheme_id_actual VARCHAR(64);
BEGIN
    -- Get existing record
    SELECT to_jsonb(s) INTO v_old 
    FROM public.schemes s 
    WHERE s.scheme_id = p_scheme_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Scheme not found: ' || p_scheme_id);
    END IF;
    
    -- Apply updates (only non-null params)
    UPDATE public.schemes SET
        name                 = COALESCE(p_name, name),
        status               = COALESCE(p_status, status),
        open_date            = COALESCE(p_open_date, open_date),
        close_date           = COALESCE(p_close_date, close_date),
        total_plots          = COALESCE(p_total_plots, total_plots),
        price_min            = COALESCE(p_price_min, price_min),
        price_max            = COALESCE(p_price_max, price_max),
        location_details     = COALESCE(p_location_details, location_details),
        apply_url            = COALESCE(p_apply_url, apply_url),
        manual_notes         = COALESCE(p_manual_notes, manual_notes),
        admin_override_status = COALESCE(p_admin_override_status, admin_override_status),
        is_manually_edited   = TRUE,
        admin_last_updated   = NOW(),
        last_updated         = NOW()
    WHERE scheme_id = p_scheme_id;
    
    -- Get updated record for audit log
    SELECT to_jsonb(s) INTO v_new 
    FROM public.schemes s 
    WHERE s.scheme_id = p_scheme_id;
    
    -- Write audit log
    INSERT INTO public.admin_scheme_edits (scheme_id, edited_by, action, old_values, new_values)
    VALUES (p_scheme_id, p_admin_email, 'manual_edit', v_old, v_new);
    
    RETURN jsonb_build_object('success', true, 'scheme_id', p_scheme_id, 'updated_at', NOW());
END;
$$;

COMMENT ON FUNCTION public.admin_update_scheme IS 
'Admin function to manually update scheme data. Called from backend admin API. Writes audit log automatically.';


-- ─────────────────────────────────────────────────────────────
-- SECTION 6: Alert dispatch views (for notification system)
-- ─────────────────────────────────────────────────────────────

-- Main dispatch view: resolves recipient contact for each alert
CREATE OR REPLACE VIEW public.alert_dispatch_view AS
SELECT
    a.id                AS alert_id,
    a.user_email,
    a.user_id,
    a.city,
    a.authority,
    a.channel,
    a.is_active,
    -- Resolve actual recipient based on channel
    CASE
        WHEN a.channel = 'email'    THEN a.user_email
        WHEN a.channel = 'telegram' THEN CAST(u.telegram_chat_id AS TEXT)
        WHEN a.channel = 'whatsapp' THEN u.phone
        ELSE NULL
    END AS recipient,
    -- Is this alert actually dispatchable?
    CASE
        WHEN a.channel = 'email'    THEN (a.user_email IS NOT NULL AND a.is_active = TRUE)
        WHEN a.channel = 'telegram' THEN (u.telegram_chat_id IS NOT NULL AND a.is_active = TRUE)
        WHEN a.channel = 'whatsapp' THEN (u.phone IS NOT NULL AND a.is_active = TRUE)
        ELSE FALSE
    END AS is_dispatchable,
    -- Why blocked?
    CASE
        WHEN NOT a.is_active THEN 'subscription_inactive'
        WHEN a.channel = 'telegram' AND u.telegram_chat_id IS NULL THEN 'telegram_not_linked'
        WHEN a.channel = 'whatsapp' AND u.phone IS NULL THEN 'phone_not_set'
        WHEN a.channel = 'email' AND a.user_email IS NULL THEN 'no_email'
        ELSE NULL
    END AS blocked_reason,
    u.subscription_tier,
    u.subscription_status
FROM public.alert_subscriptions a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.is_active = TRUE;

COMMENT ON VIEW public.alert_dispatch_view IS 
'Resolved alert dispatch view. Used by notifier.py to send alerts. Shows recipient contact info per channel.';


-- Blocked alerts view (for dashboard warnings)
CREATE OR REPLACE VIEW public.alert_dispatch_blocked_view AS
SELECT *
FROM public.alert_dispatch_view
WHERE is_dispatchable = FALSE;

COMMENT ON VIEW public.alert_dispatch_blocked_view IS 
'Alerts that cannot be dispatched (telegram not linked, no phone, etc.). Shown as warnings in user dashboard.';


-- ─────────────────────────────────────────────────────────────
-- SECTION 7: sync_user_subscription() for Razorpay
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_user_subscription(
    p_user_id           INTEGER,
    p_plan              VARCHAR(20),
    p_razorpay_sub_id   VARCHAR(64),
    p_razorpay_pay_id   VARCHAR(64),
    p_razorpay_sig      VARCHAR(256),
    p_amount_paise      INTEGER,
    p_sub_status        VARCHAR(20)
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_tier VARCHAR(32);
    v_limit INTEGER;
    v_expires TIMESTAMPTZ;
BEGIN
    -- Determine tier from plan code
    IF p_plan LIKE '%premium%' THEN
        v_tier  := 'premium';
        v_limit := 999;
    ELSE
        v_tier  := 'pro';
        v_limit := 2;
    END IF;
    
    v_expires := NOW() + INTERVAL '32 days';

    -- Update user tier
    UPDATE public.users SET
        subscription_tier        = v_tier,
        subscription_status      = p_sub_status,
        is_premium               = TRUE,
        alert_cities_limit       = v_limit,
        razorpay_subscription_id = p_razorpay_sub_id,
        subscription_expires_at  = v_expires
    WHERE id = p_user_id;

    -- Upsert subscription record
    INSERT INTO public.subscriptions (
        user_id, razorpay_sub_id, razorpay_payment_id, razorpay_signature,
        plan, amount_paise, status, expires_at
    ) VALUES (
        p_user_id, p_razorpay_sub_id, p_razorpay_pay_id, p_razorpay_sig,
        p_plan, p_amount_paise, p_sub_status, v_expires
    )
    ON CONFLICT (razorpay_sub_id) DO UPDATE SET
        status      = EXCLUDED.status,
        expires_at  = EXCLUDED.expires_at;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- SECTION 8: Indexes for performance
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_schemes_city     ON public.schemes(city);
CREATE INDEX IF NOT EXISTS idx_schemes_status   ON public.schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_authority ON public.schemes(authority);
CREATE INDEX IF NOT EXISTS idx_schemes_active   ON public.schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_schemes_manually_edited ON public.schemes(is_manually_edited);
CREATE INDEX IF NOT EXISTS idx_alert_subs_user  ON public.alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_subs_city  ON public.alert_subscriptions(city);


-- ─────────────────────────────────────────────────────────────
-- SECTION 9: Seed static schemes into DB
-- Run AFTER deploying backend (backend seeds from static_schemes.py on first start)
-- But you can also manually seed with this query:
-- ─────────────────────────────────────────────────────────────

-- SELECT COUNT(*) FROM public.schemes; 
-- If 0, trigger seed: POST /api/v1/schemes/sync


-- ─────────────────────────────────────────────────────────────
-- SECTION 10: Verify migration
-- ─────────────────────────────────────────────────────────────

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'schemes' 
  AND table_schema = 'public'
  AND column_name IN (
    'is_manually_edited', 'manual_notes', 'admin_last_updated',
    'admin_override_status', 'data_source', 'scraper_status'
  )
ORDER BY column_name;

-- Expected output: 6 rows with the above column names
