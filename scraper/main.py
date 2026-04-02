"""GovPlot Tracker — Scraper Orchestrator v2.0 | Modes: full | refresh | verify | auto"""
from __future__ import annotations
import json, logging, os
from datetime import datetime, timezone
from pathlib import Path
from scraper.cities.all_cities import ALL_SCRAPERS

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
OUTPUT_DIR = Path("data/schemes")
ACTIVE_STATUS = {"OPEN", "ACTIVE"}

def _is_weekly_run():
    return os.getenv("GOVPLOT_FORCE_FULL","").strip()=="1" or datetime.now(timezone.utc).weekday()==6

def _load_existing():
    p=OUTPUT_DIR/"latest.json"
    if p.exists():
        try: return {s["scheme_id"]:s for s in json.loads(p.read_text()) if isinstance(s,dict)}
        except: pass
    return {}

def _load_scores():
    p=OUTPUT_DIR/"verification_scores.json"
    if p.exists():
        try: return json.loads(p.read_text())
        except: pass
    return {}

def _recalc(scheme):
    from datetime import date
    today=date.today().isoformat()
    od,cd=scheme.get("open_date"),scheme.get("close_date")
    if cd and cd<today: scheme["status"]="CLOSED"
    elif od and od>today: scheme["status"]="UPCOMING"
    elif od and od<=today and (not cd or cd>=today): scheme["status"]="OPEN"
    return scheme

def run_all(mode="auto"):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing=_load_existing(); scores=_load_scores()
    is_weekly=(mode=="full") or (mode=="auto" and _is_weekly_run())
    all_schemes=[]; errors=[]
    if mode!="verify":
        for SC in ALL_SCRAPERS:
            sc=SC()
            if mode=="refresh" and not is_weekly:
                if not any(s.get("authority")==sc.authority and s.get("status") in ACTIVE_STATUS for s in existing.values()):
                    all_schemes.extend(v for v in existing.values() if v.get("authority")==sc.authority); continue
            try:
                results=[_recalc(r) for r in sc.run()]
                all_schemes.extend(results)
                logger.info(f"✅ {sc.authority} ({sc.city}): {len(results)} schemes")
            except Exception as e:
                errors.append({"scraper":sc.authority,"error":str(e)}); logger.error(f"❌ {sc.authority}: {e}")
                all_schemes.extend(v for v in existing.values() if v.get("authority")==sc.authority)
    else:
        all_schemes=list(existing.values())
    seen,unique=set(),[]
    for s in all_schemes:
        sid=s.get("scheme_id","")
        if sid and sid not in seen: seen.add(sid); unique.append(s)
    if is_weekly or mode=="verify":
        try:
            from scraper.verifier import bulk_verify
            vr=bulk_verify(unique,existing_scores=scores)
            new_scores=dict(scores)
            for sid,v in vr.items():
                new_scores[sid]=v.verification_score
                for s in unique:
                    if s.get("scheme_id")==sid: s["verification_score"]=v.verification_score; s["verified"]=v.verified
            (OUTPUT_DIR/"verification_scores.json").write_text(json.dumps(new_scores,indent=2))
        except Exception as e: logger.warning(f"Verification skipped: {e}")
    else:
        for s in unique:
            sid=s.get("scheme_id","")
            if sid in scores: s["verification_score"]=scores[sid]; s["verified"]=scores[sid]>=1
    ts=datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    jd=json.dumps(unique,ensure_ascii=False,indent=2)
    (OUTPUT_DIR/f"schemes_{ts}.json").write_text(jd); (OUTPUT_DIR/"latest.json").write_text(jd)
    logger.info(f"📁 {len(unique)} schemes saved")
    if errors: logger.warning(f"⚠️ {len(errors)} errors")
    _push(unique); return unique

def _push(schemes):
    url=os.getenv("SUPABASE_URL"); key=os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key: return
    try:
        import httpx
        hdrs={"apikey":key,"Authorization":f"Bearer {key}","Content-Type":"application/json","Prefer":"resolution=merge-duplicates"}
        for i in range(0,len(schemes),100):
            b=[{k:v for k,v in s.items() if k not in ("raw_data","verification_sources")} for s in schemes[i:i+100]]
            httpx.post(f"{url}/rest/v1/schemes",json=b,headers=hdrs,timeout=60).raise_for_status()
        logger.info(f"✅ Pushed {len(schemes)} to Supabase")
    except Exception as e: logger.error(f"❌ Supabase: {e}")

if __name__=="__main__":
    import sys
    mode=sys.argv[1] if len(sys.argv)>1 else "auto"
    result=run_all(mode=mode); print(f"\n✅ Done — {len(result)} schemes, mode={mode}")
