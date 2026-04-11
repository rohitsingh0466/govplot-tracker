# GovPlot Tracker v4.0 — Complete File-by-File Change Guide

## Overview
This document maps every file change, what to replace, and in what order to apply.

---

## STEP 1: Run Supabase Migration SQL

Run `supabase_migration_v4.sql` in Supabase Dashboard → SQL Editor.
Run each SECTION one at a time. Verify with the SELECT at the end.

**Expected result of verification query:**
- 6 rows returned: `is_manually_edited`, `manual_notes`, `admin_last_updated`, `admin_override_status`, `data_source`, `scraper_status`

---

## STEP 2: Scraper Files (Backend Python)

### NEW FILES — Create these (do not exist yet)

| File Path | What it does |
|---|---|
| `scraper/cities/city_config.py` | **Single source of truth** — 20 cities, all metadata, anti-scraping config |
| `scraper/cities/static_schemes.py` | Static scheme data for all 20 cities (initial dataset) |
| `scraper/cities/_city_mixin.py` | Shared mixin used by all 20 city scrapers |
| `scraper/cities/yeida.py` | YEIDA Greater Noida scraper (Rank 1) |
| `scraper/cities/lucknow.py` | LDA Lucknow scraper |
| `scraper/cities/jaipur.py` | JDA Jaipur scraper |
| `scraper/cities/agra.py` | ADA Agra scraper |
| `scraper/cities/prayagraj.py` | PDA Prayagraj scraper |
| `scraper/cities/chandigarh.py` | GMADA Chandigarh scraper |
| `scraper/cities/navi_mumbai.py` | CIDCO Navi Mumbai scraper |
| `scraper/cities/hyderabad.py` | HMDA Hyderabad scraper |
| `scraper/cities/pune.py` | PMRDA Pune scraper |
| `scraper/cities/bengaluru.py` | BDA Bengaluru scraper |
| `scraper/cities/raipur.py` | NRDA Raipur scraper |
| `scraper/cities/varanasi.py` | VDA Varanasi scraper |
| `scraper/cities/bhubaneswar.py` | BDA-OD Bhubaneswar scraper |
| `scraper/cities/nagpur.py` | NIT Nagpur scraper |
| `scraper/cities/ahmedabad.py` | AUDA Ahmedabad scraper |
| `scraper/cities/delhi.py` | DDA Delhi scraper (Tier 3) |
| `scraper/cities/bhopal.py` | VP-BPL Bhopal scraper |
| `scraper/cities/udaipur.py` | UIT Udaipur scraper |
| `scraper/cities/dehradun.py` | MDDA Dehradun scraper |
| `scraper/cities/meerut.py` | MDA Meerut scraper |

### REPLACE FILES — These replace existing files

| File Path | What changed |
|---|---|
| `scraper/base_scraper.py` | v4.0 — 4-tier strategy, stealth Playwright, random UA rotation, httpx fallback |
| `scraper/registry.py` | v4.0 — imports all 20 city scrapers, priority order |

### DELETE — Old files no longer needed

```
scraper/cities/all_cities.py        # was 58-city monolith
scraper/cities/bangalore.py         # replaced by bengaluru.py
scraper/cities/delhi.py             # ← WAIT — new delhi.py is already created
scraper/cities/gurgaon.py           # Gurgaon removed from 20 cities
scraper/cities/hyderabad.py         # ← new one is already created
scraper/cities/karnataka.py         # replaced by bengaluru.py
scraper/cities/lucknow.py           # ← new one is already created
scraper/cities/maharashtra.py       # replaced by pune.py, navi_mumbai.py, nagpur.py
scraper/cities/noida.py             # replaced by yeida.py
scraper/cities/other_cities.py      # all cities not in 20 removed
scraper/cities/up.py                # replaced by individual city files
```

**IMPORTANT**: Do NOT delete these old files until the new files are tested.
Rename them with `_old` suffix first.

---

## STEP 3: Backend Routes

### REPLACE — `backend/routes/cities.py`

**Old file**: 153 hardcoded city objects, no external dependency
**New file**: Reads dynamically from `scraper/cities/city_config.py`

New endpoints added:
- `GET /api/v1/cities/` → All 20 cities ordered by rank
- `GET /api/v1/cities/names` → Just city names (for dropdowns)
- `GET /api/v1/cities/by-state` → Grouped by state
- `GET /api/v1/cities/by-demand` → Grouped by demand level
- `GET /api/v1/cities/{name}` → Single city detail

---

## STEP 4: Frontend Components

### REPLACE — `frontend/components/AlertModal.tsx`

**Old**: Hardcoded 100+ city list (static array)
**New**: Fetches from `GET /api/v1/cities/names` on mount. Falls back to 20-city hardcoded list if API fails.

Changes:
- Added `useEffect` to fetch city names from API
- Dropdown shows only 20 cities (no optgroups needed since it's a short list)
- Label updated: "20 tracked cities" instead of "100+ available"
- Loading state while cities fetch

### REPLACE — `frontend/components/FilterBar.tsx`

**Old**: Hardcoded `CITY_GROUPS` with 100+ cities grouped by state
**New**: Fetches from `GET /api/v1/cities/by-state` on mount. Falls back to 20-city hardcoded groups.

Changes:
- `useEffect` to fetch city groups from API
- `FALLBACK_CITY_GROUPS` const with 20 cities only (used if API fails)
- Option text updated: "All Cities (20 tracked)" instead of "All Cities (100+)"

### REPLACE — `frontend/pages/cities.tsx`

**Old**: Hardcoded `CITIES` array (25 city cards), grouped as Tier 1/2/Emerging
**New**: Fetches from `GET /api/v1/cities/` on mount. Groups by `demand_level`.

Changes:
- Dynamic fetch with loading state (BrandLoader)
- Groups: EXTREME → VERY_HIGH → HIGH → RISING (based on demand_level from config)
- Each card shows: emoji, city name, state, authority, demand_tags (from config), rank badge
- `href` from config points to official authority URL

---

## STEP 5: GitHub Actions Workflow

### REPLACE — `.github/workflows/scrape.yml`

**Critical fix**: Bot commit now includes `[skip ci]` in commit message.

**Old commit message:**
```
"chore: scheme data 2026-04-11T06:30:00Z mode=full"
```

**New commit message:**
```
"chore(data): scheme data 2026-04-11T06:30:00Z mode=full [skip ci]"
```

The `[skip ci]` flag tells Vercel NOT to trigger a production deployment from this data commit. This was the **root cause of the blog route outage**.

Additional v4.0 changes:
- Summary step shows cities count and tier breakdown
- ScraperAPI status shown in summary
- Mode detection unchanged (Sunday = full, Mon-Sat = refresh)

---

## STEP 6: data/schemes/latest.json

After deploying, trigger the first seed:
```bash
# Option A: Via API (after backend deploys on Railway)
curl -X POST https://your-backend.railway.app/api/v1/schemes/sync

# Option B: Manually run the scraper locally
python -m scraper.main full
```

This populates Supabase with the static schemes from `static_schemes.py`.
The file `data/schemes/latest.json` already has some schemes — those can stay
as-is until the first cron run replaces them.

---

## STEP 7: Schemes Route — Seed from static_schemes.py

Add this to `backend/routes/schemes.py` — replace the `_seed_db_from_json()` function:

```python
def _seed_db_from_json(db: Session):
    """Seed DB from static_schemes.py if empty (first deploy)."""
    if _is_postgres():
        count = db.query(Scheme).count()
        if count > 0:
            return  # Already seeded
        logger.info("Postgres empty — seeding from static_schemes.py ...")
    
    # Import static schemes
    try:
        from scraper.cities.static_schemes import get_all_static_schemes
        schemes_data = get_all_static_schemes()
    except Exception:
        schemes_data = _load_from_json()  # fallback to latest.json

    if not schemes_data:
        return
    
    inserted = 0
    for s in schemes_data:
        existing = db.query(Scheme).filter_by(scheme_id=s.get("scheme_id")).first()
        if not existing:
            try:
                # Map static scheme dict to ORM fields
                scheme_fields = {
                    k: v for k, v in s.items()
                    if hasattr(Scheme, k) and k not in ("last_updated", "is_active")
                }
                db.add(Scheme(is_active=True, **scheme_fields))
                inserted += 1
            except Exception as exc:
                logger.warning(f"Skip {s.get('scheme_id')}: {exc}")
    db.commit()
    if inserted:
        logger.info(f"Seeded {inserted} schemes from static_schemes.py")
```

---

## Admin Backend Dashboard — Manual Scheme Editing

To edit schemes manually via Supabase (no custom dashboard needed yet):

### Option A: Supabase Dashboard (immediate)

1. Go to Supabase → Table Editor → `schemes`
2. Find the scheme you want to edit
3. Edit fields directly in the table
4. Set `is_manually_edited = true`
5. Set `admin_last_updated = now()`
6. Add `manual_notes` with reason for edit

### Option B: Via SQL function (programmatic)

```sql
SELECT public.admin_update_scheme(
    'YEIDA-RPS10-2026',           -- scheme_id
    'admin@govplottracker.com',   -- admin email
    NULL,                          -- name (null = no change)
    'OPEN',                        -- new status
    '2026-06-01',                  -- open_date
    '2026-08-31',                  -- close_date
    2000,                          -- total_plots
    30.0,                          -- price_min
    90.0,                          -- price_max
    'Sector 18, Yamuna Expressway near Jewar Airport',  -- location_details
    'https://yamunaexpresswayauthority.com',  -- apply_url
    'Verified from official YEIDA brochure April 2026'  -- manual_notes
);
```

### Option C: Backend API endpoint (add to schemes.py)

```python
@router.patch("/{scheme_id}/admin")
def admin_update_scheme(
    scheme_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    # NOTE: Add admin auth check here
):
    """Admin endpoint to manually update scheme fields."""
    from sqlalchemy import text
    result = db.execute(
        text("SELECT public.admin_update_scheme(:sid, :email, :name, :status, :open_date, :close_date, :plots, :price_min, :price_max, :location, :apply_url, :notes, :override_status)"),
        {
            "sid": scheme_id,
            "email": "admin@govplottracker.com",
            "name": payload.get("name"),
            "status": payload.get("status"),
            "open_date": payload.get("open_date"),
            "close_date": payload.get("close_date"),
            "plots": payload.get("total_plots"),
            "price_min": payload.get("price_min"),
            "price_max": payload.get("price_max"),
            "location": payload.get("location_details"),
            "apply_url": payload.get("apply_url"),
            "notes": payload.get("manual_notes"),
            "override_status": payload.get("admin_override_status"),
        }
    )
    db.commit()
    return result.fetchone()[0]  # Returns JSONB with success/error
```

---

## Git Commands — Apply All Changes

```bash
# 1. Create new branch for these changes
git checkout -b feat/v4-20-cities

# 2. Stage new scraper files
git add scraper/cities/city_config.py
git add scraper/cities/static_schemes.py
git add scraper/cities/_city_mixin.py
git add scraper/cities/yeida.py
git add scraper/cities/lucknow.py
git add scraper/cities/jaipur.py
git add scraper/cities/agra.py
git add scraper/cities/prayagraj.py
git add scraper/cities/chandigarh.py
git add scraper/cities/navi_mumbai.py
git add scraper/cities/hyderabad.py
git add scraper/cities/pune.py
git add scraper/cities/bengaluru.py
git add scraper/cities/raipur.py
git add scraper/cities/varanasi.py
git add scraper/cities/bhubaneswar.py
git add scraper/cities/nagpur.py
git add scraper/cities/ahmedabad.py
git add scraper/cities/delhi.py
git add scraper/cities/bhopal.py
git add scraper/cities/udaipur.py
git add scraper/cities/dehradun.py
git add scraper/cities/meerut.py

# 3. Stage updated files
git add scraper/base_scraper.py
git add scraper/registry.py
git add backend/routes/cities.py
git add frontend/components/AlertModal.tsx
git add frontend/components/FilterBar.tsx
git add frontend/pages/cities.tsx
git add .github/workflows/scrape.yml

# 4. Stage SQL migration (for reference — run manually in Supabase)
git add supabase_migration_v4.sql

# 5. Commit
git commit -m "feat: v4.0 — 20-city scraper architecture, city_config.py single source, [skip ci] bot fix"

# 6. Push and create PR
git push origin feat/v4-20-cities
# Then merge to main via GitHub PR
```

---

## Testing Checklist

### Backend (local)
```bash
# Test city config loads
python -c "from scraper.cities.city_config import ALL_CITIES_API; print(len(ALL_CITIES_API), 'cities')"
# Expected: 20 cities

# Test static schemes
python -c "from scraper.cities.static_schemes import get_all_static_schemes; print(len(get_all_static_schemes()), 'schemes')"
# Expected: ~75-80 schemes

# Test YEIDA scraper (fallback only in local env)
python -c "
from scraper.cities.yeida import YEIDAScraper
s = YEIDAScraper()
result, errors = s.run()
print(f'{len(result)} schemes, {len(errors)} errors')
print('data_source:', result[0]['data_source'] if result else 'none')
"

# Test registry imports
python -c "from scraper.registry import ALL_SCRAPERS; print(len(ALL_SCRAPERS), 'scrapers registered')"
# Expected: 20 scrapers

# Test full run (all 20 cities)
python -m scraper.main full
```

### Frontend (local)
```bash
cd frontend
npm run dev
# Navigate to:
# http://localhost:3000/cities       → Should show 20 cities from API
# http://localhost:3000/schemes      → Filter dropdown should show 20 cities
# Alert modal → City dropdown should show 20 cities
```

### Backend API (after Railway deploy)
```bash
# Cities endpoint
curl https://your-backend.railway.app/api/v1/cities/ | jq '. | length'
# Expected: 20

curl https://your-backend.railway.app/api/v1/cities/names
# Expected: ["Greater Noida", "Lucknow", "Jaipur", ...]

curl https://your-backend.railway.app/api/v1/cities/by-state
# Expected: grouped by state

# Schemes endpoint
curl "https://your-backend.railway.app/api/v1/schemes/?limit=5" | jq '.[] | .city' | sort -u
# Expected: only cities from the 20-city list
```

---

## Known Limitations (to address in future)

1. **Schemes seeding**: The `schemes.py` route needs the `_seed_db_from_json` update (see Step 7 above). Without this, first deploy will show empty DB until cron runs.

2. **Admin dashboard**: Currently admin edits go through Supabase Table Editor or SQL function. A proper React admin UI can be built later with the `admin_update_scheme()` function as the backend.

3. **Scraper accuracy**: Tier 1/2 live scraping will return 0 schemes for many cities (portals are blocked/hard to scrape). The aggregator tier and STATIC fallback ensure data is always shown. When SCRAPER_API_KEY is set in GitHub Secrets, Tier 1 success rate improves significantly for .gov.in domains.

4. **About page**: Still references "100+ cities". Update `DATA_SOURCES` array in `frontend/pages/about.tsx` to show only the 20 tracked cities.

5. **README.md**: References 100+ cities and 58 scrapers. Update to 20 cities and 20 scrapers.
