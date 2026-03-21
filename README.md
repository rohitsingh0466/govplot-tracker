# 🏠 GovPlot Tracker

> **India's most complete real-time tracker for Government Residential Plot Schemes**
> Monitor Open / Closed / Active / Upcoming status across 9 major cities.
> Get notified instantly via Email, WhatsApp, Telegram, and Push.

[![Scraper Status](https://github.com/YOUR_USERNAME/govplot-tracker/actions/workflows/scrape.yml/badge.svg)](https://github.com/YOUR_USERNAME/govplot-tracker/actions)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🏙️ Cities Covered

| City | Authority | Portal |
|---|---|---|
| Lucknow | LDA | lda.up.nic.in |
| Bangalore | BDA | bdabangalore.org |
| Noida | GNIDA / NUDA / YEIDA | noidaauthorityonline.in |
| Gurgaon | HSVP / DGTCP | hsvphry.gov.in |
| Hyderabad | HMDA | hmda.gov.in |
| Pune | PMRDA | pmrda.gov.in |
| Mumbai | MHADA | mhada.gov.in |
| Chandigarh | GMADA | gmada.gov.in |
| Agra | ADA | agra.up.nic.in |

---

## 🏗️ Architecture

```
Government Portals
       ↓
Python Scrapers (Selenium + BeautifulSoup)
       ↓  [GitHub Actions CRON every 6h]
PostgreSQL / Supabase  ←→  Redis Cache
       ↓
FastAPI Backend  (REST API)
       ↓
Next.js Frontend  →  Vercel
       ↓
Notification Layer (Email / WhatsApp / Telegram)
```

---

## 🚀 Quick Start

### 1. Clone & install Python deps
```bash
git clone https://github.com/YOUR_USERNAME/govplot-tracker.git
cd govplot-tracker
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run the scraper
```bash
python -m scraper.main
# → creates data/schemes/latest.json
```

### 4. Start the API
```bash
uvicorn backend.main:app --reload --port 8000
# → http://localhost:8000/api/docs
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/schemes/` | List all schemes (filter by city, status, authority) |
| GET | `/api/v1/schemes/stats` | Dashboard statistics |
| GET | `/api/v1/schemes/{id}` | Single scheme detail |
| POST | `/api/v1/schemes/sync` | Trigger scraper refresh |
| POST | `/api/v1/alerts/subscribe` | Subscribe to alerts |
| GET | `/api/v1/alerts/my?email=...` | List my subscriptions |
| GET | `/api/v1/cities/` | List tracked cities |

---

## 💰 Monetisation Roadmap

| Stream | Model | Target |
|---|---|---|
| Freemium Subscriptions | Free: 2 cities / Pro ₹99/mo | ₹50K–2L/month |
| Google AdSense | CPM ₹80–200 (real-estate niche) | ₹10K–40K/month |
| Affiliate Links | NoBroker / 99acres / Housing.com | ₹15K–60K/month |
| B2B API Access | Per-client data feed license | ₹20K–1L/month |

---

## ⚙️ Free Deployment Stack

| Service | Free Tier |
|---|---|
| **Vercel** | Frontend hosting |
| **Railway** | Backend API (500 hrs/month free) |
| **Supabase** | PostgreSQL DB (500MB free) |
| **GitHub Actions** | CRON scraper (2000 min/month free) |
| **SendGrid** | 100 emails/day free |

---

## 📁 Project Structure

```
govplot-tracker/
├── scraper/
│   ├── base_scraper.py       # Abstract base class
│   ├── main.py               # Orchestrator
│   └── cities/
│       ├── lucknow.py        # LDA scraper
│       ├── bangalore.py      # BDA scraper
│       └── noida.py          # GNIDA/NUDA/YEIDA scraper
├── backend/
│   ├── main.py               # FastAPI app
│   ├── models/
│   │   ├── db_models.py      # SQLAlchemy + Pydantic models
│   │   └── database.py       # DB connection
│   ├── routes/
│   │   ├── schemes.py        # Scheme endpoints
│   │   ├── alerts.py         # Alert subscriptions
│   │   ├── auth.py           # Auth
│   │   └── cities.py         # City list
│   └── notifications/
│       └── notifier.py       # Email/WhatsApp/Telegram dispatcher
├── frontend/
│   ├── pages/
│   │   └── index.tsx         # Main dashboard
│   └── components/
│       ├── Navbar.tsx
│       ├── StatsBar.tsx
│       ├── FilterBar.tsx
│       ├── SchemeCard.tsx
│       └── AlertModal.tsx
├── .github/workflows/
│   └── scrape.yml            # Auto CRON scraper
├── data/schemes/             # JSON output (auto-generated)
├── requirements.txt
├── .env.example
└── README.md
```

---

## 📜 License

MIT — free to use, fork, and build on.

---

*Built with ❤️ for every Indian looking to invest in government land.*
