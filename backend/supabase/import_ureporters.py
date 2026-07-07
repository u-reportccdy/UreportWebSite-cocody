import os
import sys
import csv
import django
from pathlib import Path

# Setup Django path
backend_dir = Path("/Users/mac/Documents/U-REPORT/backend")
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ureport_backend.settings")
django.setup()

from api import supabase

def clean_name(name_str):
    if not name_str:
        return ""
    # Remove extra spaces and capitalize names
    words = name_str.strip().split()
    return " ".join(words)

def clean_phone(phone_str):
    if not phone_str:
        return ""
    # Extract only digits
    return "".join(ch for ch in str(phone_str) if ch.isdigit())

def import_ureporters():
    csv_path = backend_dir / "Base de données ureport.csv"
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return

    print("Fetching existing members from database...")
    try:
        existing_members = supabase.select("members", "select=id,phone,full_name,status")
    except Exception as e:
        print("Error fetching members:", e)
        return

    print(f"Loaded {len(existing_members)} existing members from DB.")

    # Index existing members by the last 9 digits of their phone numbers
    existing_by_phone_9 = {}
    for m in existing_members:
        phone_digits = clean_phone(m.get("phone"))
        if len(phone_digits) >= 9:
            phone_9 = phone_digits[-9:]
            existing_by_phone_9[phone_9] = m

    new_members_payloads = []
    updated_members_count = 0
    skipped_duplicates_in_csv = 0
    seen_phones_in_csv = set()

    print("Parsing CSV file...")
    with open(csv_path, mode="r", encoding="utf-8-sig", errors="ignore") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            print("Error: CSV file is empty.")
            return

        for line_num, row in enumerate(reader, start=2):
            if not row or len(row) < 2:
                continue
            
            raw_name = row[0]
            phone_fields = [x.strip() for x in row[1:] if x.strip()]
            if not phone_fields:
                print(f"Line {line_num}: Skipped due to missing phone number.")
                continue

            raw_phone = phone_fields[-1]
            
            name = clean_name(raw_name)
            phone_digits = clean_phone(raw_phone)
            
            if not name or not phone_digits:
                print(f"Line {line_num}: Skipped due to empty name or phone digits.")
                continue

            # Ensure phone is 9 digits (our inspection showed all are 9 digits)
            if len(phone_digits) < 9:
                print(f"Line {line_num}: Warning: Phone number '{raw_phone}' has less than 9 digits ({phone_digits}). Skipping.")
                continue
            
            phone_9 = phone_digits[-9:]
            db_phone = f"+2250{phone_9}"

            # Avoid duplicates inside the CSV itself
            if phone_9 in seen_phones_in_csv:
                skipped_duplicates_in_csv += 1
                continue
            seen_phones_in_csv.add(phone_9)

            # Check if this phone number exists in DB
            if phone_9 in existing_by_phone_9:
                db_member = existing_by_phone_9[phone_9]
                # If they are currently aspirant, upgrade them to 'ureporter'
                if db_member.get("status") == "aspirant":
                    try:
                        print(f"Upgrading existing member status to 'ureporter' for: {name} ({db_phone})")
                        supabase.update("members", "id", db_member["id"], {"status": "ureporter", "interview_passed": True})
                        updated_members_count += 1
                    except Exception as e:
                        print(f"Error upgrading member {db_member['id']}: {e}")
                else:
                    # Already ureporter or mentor, skip updating
                    pass
            else:
                # New member payload
                new_members_payloads.append({
                    "full_name": name,
                    "phone": db_phone,
                    "status": "ureporter",
                    "sex": "non_precise",
                    "commune": "Cocody",
                    "integration_note": "Importé de la liste officielle des U-Reporters",
                    "interview_passed": True,
                    "tshirt_received": False,
                    "is_pco": False,
                    "commission": ""
                })

    print(f"\nProcessing insertion of {len(new_members_payloads)} new U-Reporters...")
    
    # Batch inserts (max 100 rows per request)
    batch_size = 100
    inserted_count = 0
    
    for i in range(0, len(new_members_payloads), batch_size):
        batch = new_members_payloads[i : i + batch_size]
        try:
            print(f"Inserting batch of {len(batch)} new members ({i + 1} to {min(i + batch_size, len(new_members_payloads))})...")
            # In PostgREST, we can insert a list of dicts directly
            supabase.insert("members", batch)
            inserted_count += len(batch)
        except Exception as e:
            print(f"Error inserting batch: {e}. Trying row-by-row fallback for this batch...")
            for item in batch:
                try:
                    supabase.insert("members", item)
                    inserted_count += 1
                except Exception as row_err:
                    print(f"Failed to insert individual member {item['full_name']} ({item['phone']}): {row_err}")

    print("\n" + "="*40)
    print("IMPORT SUMMARY:")
    print(f"Total new members inserted: {inserted_count}")
    print(f"Total existing members updated to 'ureporter': {updated_members_count}")
    print(f"Duplicate phone numbers skipped in CSV: {skipped_duplicates_in_csv}")
    print("="*40)

if __name__ == "__main__":
    import_ureporters()
