"""
GovPlot Tracker — Cities API Route v4.0
=========================================
Dynamically serves city data from city_config.py.
NO hardcoded city list — single source of truth is city_config.py.

Endpoints:
  GET /api/v1/cities/          → All 20 cities (ordered by rank)
  GET /api/v1/cities/by-state  → Grouped by state
  GET /api/v1/cities/names     → Just city names (for dropdowns/alert modal)
  GET /api/v1/cities/{name}    → Single city detail
"""

from fastapi import APIRouter, HTTPException
from scraper.cities.city_config import ALL_CITIES_API, CITY_BY_NAME, CITY_NAMES_ORDERED

router = APIRouter()


@router.get("/")
def list_cities():
    """Return all 20 cities ordered by demand rank."""
    return ALL_CITIES_API


@router.get("/names")
def city_names():
    """Return ordered list of city names. Used by AlertModal, FilterBar dropdowns."""
    return CITY_NAMES_ORDERED


@router.get("/by-state")
def cities_by_state():
    """Return cities grouped by state. Used by FilterBar optgroups."""
    result: dict[str, list] = {}
    for city_dict in ALL_CITIES_API:
        state = city_dict["state"]
        if state not in result:
            result[state] = []
        result[state].append(city_dict)
    return result


@router.get("/by-demand")
def cities_by_demand():
    """Return cities grouped by demand level."""
    result: dict[str, list] = {}
    for city_dict in ALL_CITIES_API:
        demand = city_dict["demand_level"]
        if demand not in result:
            result[demand] = []
        result[demand].append(city_dict)
    return result


@router.get("/{name}")
def get_city(name: str):
    """Return single city config by name."""
    cfg = CITY_BY_NAME.get(name)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"City '{name}' not found in tracked list")
    from scraper.cities.city_config import city_to_api_dict
    return city_to_api_dict(cfg)
