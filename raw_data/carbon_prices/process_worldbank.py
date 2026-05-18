import pandas as pd
import json
import re
import math

def clean_val(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v

def parse_share(share_str):
    if not share_str or not isinstance(share_str, str):
        return None, None
    m = re.search(r'(\d+(?:\.\d+)?)%\s*of jurisdiction', share_str)
    m2 = re.search(r'(\d+(?:\.\d+)?)%\s*of global', share_str)
    juris = float(m.group(1)) if m else None
    global_ = float(m2.group(1)) if m2 else None
    return juris, global_

def parse_price_label(price_str):
    """Extract USD numeric value from e.g. 'US$14 (ALL1,255)' or 'US$70 (€65)'"""
    if not price_str or not isinstance(price_str, str):
        return None
    m = re.search(r'US\$\s*([\d,]+(?:\.\d+)?)', price_str)
    if m:
        return float(m.group(1).replace(',', ''))
    return None

df = pd.read_excel('/mnt/user-data/uploads/data_08_2025.xlsx',
                   sheet_name='Compliance_Gen Info', header=4)

PRICE_YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

results = []
for _, row in df.iterrows():
    uid = row.get('Unique ID')
    if not isinstance(uid, str) or not uid.strip():
        continue

    # Only include implemented or under development instruments with a price
    status = str(row.get('Status', '')).strip()
    instrument_type = str(row.get('Type', '')).strip()

    # Build yearly prices
    yearly_prices = {}
    for yr in PRICE_YEARS:
        v = clean_val(row.get(yr))
        if v is not None:
            yearly_prices[str(yr)] = round(float(v), 4)

    # Skip entries with no price data and not implemented
    if not yearly_prices and status not in ('Implemented', 'Under development'):
        continue

    share_juris, share_global = parse_share(row.get('Share of jurisdiction emissions covered'))
    latest_price_label = str(row.get('Price on 1 April', ''))
    latest_price_usd = parse_price_label(latest_price_label)

    # Get most recent actual price from yearly data
    most_recent_price = None
    most_recent_year = None
    for yr in reversed(PRICE_YEARS):
        if str(yr) in yearly_prices:
            most_recent_price = yearly_prices[str(yr)]
            most_recent_year = yr
            break

    entry = {
        "id": uid.strip(),
        "instrument_name": str(row.get('Instrument name', '')).strip(),
        "type": instrument_type,
        "status": status,
        "jurisdiction": str(row.get('Jurisdiction covered', '')).strip(),
        "coverage_jurisdiction_pct": share_juris,
        "coverage_global_pct": share_global,
        "price_label_2025": latest_price_label if isinstance(row.get('Price on 1 April'), str) else None,
        "price_usd_2025": latest_price_usd,
        "most_recent_price_usd": most_recent_price,
        "most_recent_price_year": most_recent_year,
        "yearly_prices_usd": yearly_prices,
        "gases_covered": str(row.get('Gases covered', '')).strip() or None,
        "sectors": {
            "electricity_heat": str(row.get('Electricity and heat', '')).strip() or None,
            "industry": str(row.get('Industry', '')).strip() or None,
            "transport": str(row.get('Transport', '')).strip() or None,
            "buildings": str(row.get('Buildings', '')).strip() or None,
            "aviation": str(row.get('Aviation', '')).strip() or None,
        },
        "allocation_approach": str(row.get('Allocation approaches', '')).strip() or None,
        "offset_eligibility": str(row.get('Offset eligibility', '')).strip() or None,
    }
    # Clean None-equivalent strings
    for k, v in entry.items():
        if v == 'nan' or v == '':
            entry[k] = None

    results.append(entry)

# Also produce a simplified dashboard-focused version
dashboard = []
for r in results:
    if r['most_recent_price_usd'] is not None or r['price_usd_2025'] is not None:
        price = r['price_usd_2025'] or r['most_recent_price_usd']
        year = 2025 if r['price_usd_2025'] else r['most_recent_price_year']
        dashboard.append({
            "id": r["id"],
            "instrument_name": r["instrument_name"],
            "type": r["type"],
            "status": r["status"],
            "jurisdiction": r["jurisdiction"],
            "coverage_jurisdiction_pct": r["coverage_jurisdiction_pct"],
            "price_usd": price,
            "price_year": year,
            "yearly_prices_usd": r["yearly_prices_usd"],
        })

# Save both
with open('/home/claude/carbon_prices_full.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

with open('/home/claude/carbon_prices_dashboard.json', 'w') as f:
    json.dump(dashboard, f, indent=2, ensure_ascii=False)

print(f"Full dataset: {len(results)} instruments")
print(f"Dashboard dataset (with prices): {len(dashboard)} instruments")
print()

# Print Indonesia entries
print("=== INDONESIA ENTRIES ===")
id_entries = [r for r in results if 'Indonesia' in (r['jurisdiction'] or '')]
for e in id_entries:
    print(json.dumps(e, indent=2))

