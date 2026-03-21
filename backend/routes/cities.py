"""Cities route"""
from fastapi import APIRouter
router = APIRouter()

CITIES = [
    {"name": "Lucknow",    "authority": "LDA",       "tags": ["IT", "Government"]},
    {"name": "Bangalore",  "authority": "BDA",        "tags": ["IT Hub"]},
    {"name": "Noida",      "authority": "GNIDA/NUDA", "tags": ["IT", "NCR"]},
    {"name": "Gurgaon",    "authority": "HSVP/DGTCP", "tags": ["IT", "NCR"]},
    {"name": "Hyderabad",  "authority": "HMDA",       "tags": ["IT Hub"]},
    {"name": "Pune",       "authority": "PMRDA",      "tags": ["IT"]},
    {"name": "Mumbai",     "authority": "MHADA",      "tags": ["Finance", "Premium"]},
    {"name": "Chandigarh", "authority": "GMADA",      "tags": ["Tourism", "Planned City"]},
    {"name": "Agra",       "authority": "ADA",        "tags": ["Tourism"]},
]

@router.get("/")
def list_cities():
    return CITIES
