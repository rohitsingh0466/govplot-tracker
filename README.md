# 🏠 GovPlot Tracker v2.0

> **India's most complete real-time tracker for Government Residential Plot Lottery Schemes**
> Monitor Open / Closed / Active / Upcoming schemes across 100+ major cities, 50+ housing authorities, and 23 Indian states.
> Get instant alerts via Email, WhatsApp, and Telegram.

[![Scraper Status](https://github.com/rohitsingh0466/govplot-tracker/actions/workflows/scrape.yml/badge.svg)](https://github.com/rohitsingh0466/govplot-tracker/actions)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🏙️ Cities Covered — 100+ Across All Major States

| State | Cities | Authorities |
|---|---|---|
| Uttar Pradesh | Lucknow, Kanpur, Agra, Varanasi, Prayagraj, Meerut, Ghaziabad, Noida, Aligarh, Mathura, Bareilly, Gorakhpur, Jhansi, Moradabad, Saharanpur, Muzaffarnagar | LDA, UPAVP, ADA, GDA, GNIDA, YEIDA |
| Delhi | Delhi | DDA |
| Maharashtra | Mumbai, Navi Mumbai, Pune, Nagpur, Nashik, Aurangabad, Thane, Kolhapur, Solapur, Amravati, Akola, Jalgaon, Latur, Nanded, Kalyan, Vasai, Panvel | MHADA, CIDCO, PMRDA, NIT |
| Karnataka | Bangalore, Mysuru, Hubballi, Mangalore, Belgaum, Shimoga, Tumkur, Davangere, Gulbarga | BDA, KHB |
| Telangana | Hyderabad, Warangal, Karimnagar, Nizamabad, Khammam, Mahabubnagar | HMDA, TSIIC |
| Tamil Nadu | Chennai, Coimbatore, Madurai, Salem, Trichy, Vellore, Erode, Tirunelveli, Thoothukudi, Thanjavur, Hosur | CMDA/TNHB, SIPCOT |
| Rajasthan | Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner | JDA, RHB |
| Gujarat | Ahmedabad, Surat, Vadodara, Rajkot, Bhavnagar, Gandhinagar, Jamnagar, Mehsana, Anand, Bharuch | AUDA, SUDA, VUDA, RUDA, GUDAH |
| Haryana | Gurgaon, Faridabad, Panchkula, Karnal, Rohtak, Hisar, Ambala, Panipat, Sonipat, Rewari, Kurukshetra | HSVP, HHB |
| Madhya Pradesh | Indore, Bhopal, Jabalpur | IDA, BDA-MP |
| Punjab/Chandigarh | Chandigarh, Ludhiana, Amritsar, Jalandhar, Mohali, Patiala, Bathinda, Zirakpur | GMADA, PUDA |
| West Bengal | Kolkata, New Town, Durgapur | KMDA, HIDCO, WBHB |
| Andhra Pradesh | Visakhapatnam, Vijayawada, Guntur, Tirupati, Nellore, Kakinada, Kurnool, Rajahmundry | VMRDA, CRDA, TUDA |
| Kerala | Kochi, Thiruvananthapuram, Kozhikode, Thrissur, Palakkad, Kannur, Kollam, Kottayam | GCDA, TRIDA, KSHB |
| Odisha | Bhubaneswar, Cuttack, Sambalpur, Berhampur, Rourkela | BDA-OD, OHB, SUDA |
| Bihar | Patna, Muzaffarpur, Gaya, Bhagalpur, Darbhanga | BSPHCL, BSHB |
| Jharkhand | Ranchi, Dhanbad, Jamshedpur, Bokaro, Hazaribagh | JUIDCO |
| Chhattisgarh | Raipur, Bhilai, Bilaspur, Korba, Durg | CGHB, CSIDCO |
| Uttarakhand | Dehradun, Haridwar, Haldwani, Roorkee, Rishikesh | MDDA, KDA, HDA |
| Goa | Panaji | GDA |
| Assam/NE | Guwahati, Agartala, Imphal, Shillong | GMDA-AS, TREDA, IDA-MN |
| Himachal Pradesh | Shimla, Dharamsala, Solan, Baddi | HIMUDA |
| J&K | Jammu, Srinagar | JDA-JK, LCMA |

---

## 🏗️ Architecture

```
Government Portals (50+ authorities, 100+ cities)
       ↓
58 Python Scrapers (Selenium + BeautifulSoup)
       ↓  [GitHub Actions: Sunday full pull + Mon–Sat daily refresh]
Verification Engine ← AajTak, 99acres, MagicBricks, NoBroker, Housing.com
  (verification_score 0–5 per scheme)
       ↓
PostgreSQL / Supabase  ←→  JSON cache (data/schemes/latest.json)
       ↓
FastAPI Backend (Railway)
       ↓
Next.js Frontend (Vercel)
       ↓
Notification Layer (Email / WhatsApp / Telegram)
```

---

## 📋 Scraper Modes

| Mode | Schedule | Description |
|---|---|---|
| `full` | Every Sunday 6:30 AM IST | All 58 scrapers → 100+ cities → verification pass |
| `refresh` | Mon–Sat 6:30 AM IST | Only OPEN/ACTIVE scheme statuses rechecked |
| `verify` | After weekly full pull | Cross-check all schemes against 5 portals |
| `auto` | Default | Detects mode from day of week automatically |

**Data policy:** Last 5 years only. Lottery-based residential plot schemes only. EIG/sub-10L schemes excluded.

---

## ✅ Scheme Verification (Score 0–5)

Each scheme is verified against: AajTak · 99acres · MagicBricks · NoBroker · Housing.com

`verified = true` when `verification_score ≥ 1`. Schemes at score ≥ 3 skip re-verification runs.

---

## 🚀 Quick Start (v2.0 Changes)

### 1. Copy new files into your repo
Replace the listed files from the provided ZIP package.

### 2. Install new dependency
```bash
pip install httpx==0.27.0
```

### 3. Run database migration (Supabase SQL Editor)
```sql
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS verification_score SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
```

### 4. Test locally
```bash
python -m scraper.main full      # All 58 scrapers
python -m scraper.main refresh   # Daily refresh only
python -m scraper.main verify    # Verification pass
```

### 5. Deploy
```bash
git add . && git commit -m "feat: v2.0 — 100+ cities, 58 scrapers" && git push
```
Railway (backend) and Vercel (frontend) auto-deploy.

### 6. GitHub Secrets required
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `DATABASE_URL`

---

## 💰 Monetisation

| Stream | Model | Target MRR |
|---|---|---|
| Pro ₹99/mo | Unlimited cities + alerts | ₹50K–2L |
| Premium ₹299/mo | API + multi-user + reports | ₹20K–1L |
| AdSense | Real estate niche CPM | ₹10K–40K |
| Affiliate | 99acres, NoBroker per-lead | ₹15K–60K |

---

## 📁 Project Structure

```
govplot-tracker/
├── scraper/
│   ├── base_scraper.py           # Abstract base class
│   ├── main.py                   # Orchestrator (full/refresh/verify/auto)
│   ├── verifier.py               # Cross-verification engine (0–5 score)
│   └── cities/
│       └── all_cities.py         # 58 scraper classes, ALL_SCRAPERS registry
├── backend/
│   ├── main.py                   # FastAPI app
│   ├── models/
│   │   ├── db_models.py          # SQLAlchemy ORM + Pydantic (incl. verification fields)
│   │   └── database.py           # DB setup + idempotent migration helpers
│   └── routes/
│       ├── schemes.py            # Scheme endpoints
│       ├── alerts.py             # Alert subscriptions
│       ├── auth.py               # Auth (Google OAuth)
│       ├── cities.py             # 153 city entries + /by-state + /tier/{n}
│       └── billing.py            # Razorpay integration
├── frontend/
│   ├── pages/
│   │   ├── index.tsx             # Homepage (100+ cities copy)
│   │   ├── cities.tsx            # Cities page (Tier 1/2/Emerging)
│   │   ├── schemes/index.tsx     # Schemes list
│   │   ├── about.tsx             # About (updated 100+ cities)
│   │   ├── pricing.tsx           # Pricing (Pro = 100+ cities)
│   │   └── auth.tsx              # Auth page (100+ cities stats)
│   └── components/
│       ├── FilterBar.tsx         # City dropdown (153 cities, grouped by state)
│       ├── AlertModal.tsx        # Alert subscription (100+ cities)
│       ├── Footer.tsx            # India's #1 Plot Lottery Tracker
│       └── ...
├── .github/workflows/
│   └── scrape.yml                # Dual cron: Sunday full + Mon–Sat refresh
└── data/schemes/
    ├── latest.json               # Current scraped data
    └── verification_scores.json  # Persistent verification scores
```

---

## 📜 License

MIT — free to use, fork, and build on.

*Built with ❤️ for every Indian looking to invest in government land.*
