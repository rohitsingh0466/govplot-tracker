# GovPlot v4.0 — Output Files Index

## Total: 31 files

### Scraper Layer (23 Python files)
| File | Purpose |
|---|---|
| `scraper/cities/city_config.py` | ⭐ Single source of truth — 20 cities |
| `scraper/cities/static_schemes.py` | Initial dataset — 51 schemes across 20 cities |
| `scraper/cities/_city_mixin.py` | Shared helpers for all city scrapers |
| `scraper/base_scraper.py` | 4-tier base class with anti-scraping bypass |
| `scraper/registry.py` | ALL_SCRAPERS list — controls all 20 scrapers |
| `scraper/cities/yeida.py` | Greater Noida / YEIDA (Rank 1) |
| `scraper/cities/lucknow.py` | Lucknow / LDA (Rank 2) |
| `scraper/cities/jaipur.py` | Jaipur / JDA (Rank 3) |
| `scraper/cities/agra.py` | Agra / ADA (Rank 4) |
| `scraper/cities/prayagraj.py` | Prayagraj / PDA (Rank 5) |
| `scraper/cities/chandigarh.py` | Chandigarh / GMADA (Rank 6) |
| `scraper/cities/navi_mumbai.py` | Navi Mumbai / CIDCO (Rank 7) |
| `scraper/cities/hyderabad.py` | Hyderabad / HMDA (Rank 8) |
| `scraper/cities/pune.py` | Pune / PMRDA (Rank 9) |
| `scraper/cities/bengaluru.py` | Bengaluru / BDA (Rank 10) |
| `scraper/cities/raipur.py` | Raipur / NRDA (Rank 11) |
| `scraper/cities/varanasi.py` | Varanasi / VDA (Rank 12) |
| `scraper/cities/bhubaneswar.py` | Bhubaneswar / BDA-OD (Rank 13) |
| `scraper/cities/nagpur.py` | Nagpur / NIT (Rank 14) |
| `scraper/cities/ahmedabad.py` | Ahmedabad / AUDA (Rank 15) |
| `scraper/cities/delhi.py` | Delhi / DDA (Rank 16, Tier 3) |
| `scraper/cities/bhopal.py` | Bhopal / VP-BPL (Rank 17) |
| `scraper/cities/udaipur.py` | Udaipur / UIT (Rank 18) |
| `scraper/cities/dehradun.py` | Dehradun / MDDA (Rank 19) |
| `scraper/cities/meerut.py` | Meerut / MDA (Rank 20) |

### Backend (1 file)
| File | Purpose |
|---|---|
| `backend/routes/cities.py` | Dynamic cities API (reads city_config.py) |

### Frontend (3 files)
| File | Purpose |
|---|---|
| `frontend/components/AlertModal.tsx` | Fetches 20 cities from API dynamically |
| `frontend/components/FilterBar.tsx` | Fetches city groups from API dynamically |
| `frontend/pages/cities.tsx` | Dynamic cities page (demand grouped) |

### DevOps (1 file)
| File | Purpose |
|---|---|
| `.github/workflows/scrape.yml` | **[skip ci] fix** + v4.0 improvements |

### Database + Docs (2 files)
| File | Purpose |
|---|---|
| `supabase_migration_v4.sql` | Admin fields, RLS, audit log, dispatch views |
| `CHANGE_GUIDE_v4.md` | Step-by-step deployment guide |
