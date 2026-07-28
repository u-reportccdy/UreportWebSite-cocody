import os
import sys
import openpyxl
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
    words = str(name_str).strip().split()
    return " ".join(words)

def clean_email(email_str):
    return str(email_str or "").strip().lower()

def clean_phone(phone_str):
    if not phone_str:
        return ""
    return "".join(ch for ch in str(phone_str) if ch.isdigit())

def clean_gender(gender_str):
    if not gender_str:
        return "non_precise"
    val = str(gender_str).strip().lower()
    if "fém" in val or "fem" in val:
        return "femme"
    if "mas" in val or "hom" in val:
        return "homme"
    return "non_precise"

def clean_commune(commune_str):
    if not commune_str:
        return "Cocody"
    return str(commune_str).strip()

def import_from_excel():
    xlsx_path = backend_dir / "Formulaire d'identification des U-Reporters de Cocody (réponses).xlsx"
    if not xlsx_path.exists():
        print(f"Error: Excel file not found at {xlsx_path}")
        return

    print("Fetching existing members from database...")
    try:
        existing_members = supabase.select("members", "select=*")
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
    skipped_duplicates_in_excel = 0
    seen_phones_in_excel = set()

    print("Loading Excel workbook...")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True)
    sheet = wb.active
    print(f"Reading sheet: '{sheet.title}'")

    rows = sheet.iter_rows(values_only=True)
    try:
        header = next(rows)
        print("Excel Headers:", header)
    except StopIteration:
        print("Error: Excel sheet is empty.")
        return

    # Header indexes:
    # 1: Adresse e-mail
    # 2: Nom et Prénoms
    # 3: Genre
    # 6: Votre lieu d’habitation
    # 8: Votre contact whatsapp
    # 9: Votre contact 2

    for row_num, row in enumerate(rows, start=2):
        if not row or len(row) < 10:
            continue

        raw_email = row[1]
        raw_name = row[2]
        raw_gender = row[3]
        raw_habitation = row[6]
        raw_whatsapp = row[8]
        raw_contact2 = row[9]

        name = clean_name(raw_name)
        if not name:
            continue

        # Determine phone number
        phone_whatsapp = clean_phone(raw_whatsapp)
        phone_contact2 = clean_phone(raw_contact2)

        phone_digits = None
        if len(phone_whatsapp) >= 9:
            phone_digits = phone_whatsapp
        elif len(phone_contact2) >= 9:
            phone_digits = phone_contact2

        if not phone_digits:
            # Skip rows without any valid 9+ digit phone number
            continue

        phone_9 = phone_digits[-9:]
        db_phone = f"+2250{phone_9}"

        # Avoid duplicates in the Excel file itself
        if phone_9 in seen_phones_in_excel:
            skipped_duplicates_in_excel += 1
            continue
        seen_phones_in_excel.add(phone_9)

        email = clean_email(raw_email)
        gender = clean_gender(raw_gender)
        commune = clean_commune(raw_habitation)

        # Check if member already exists in the database
        if phone_9 in existing_by_phone_9:
            db_member = existing_by_phone_9[phone_9]
            
            # Prepare updates to enrich existing member profile info
            updates = {}
            if not db_member.get("email") and email:
                updates["email"] = email
            if db_member.get("sex") == "non_precise" and gender != "non_precise":
                updates["sex"] = gender
            if (not db_member.get("commune") or db_member.get("commune") == "") and commune:
                updates["commune"] = commune
            
            # Always ensure they are recognized as 'ureporter' and interview_passed = True
            if db_member.get("status") == "aspirant":
                updates["status"] = "ureporter"
                updates["interview_passed"] = True

            if updates:
                try:
                    print(f"Updating existing member info for {name} ({db_phone}): {updates}")
                    supabase.update("members", "id", db_member["id"], updates)
                    updated_members_count += 1
                except Exception as e:
                    print(f"Error updating member {db_member['id']}: {e}")
        else:
            # Add to list of new members to insert
            new_members_payloads.append({
                "full_name": name,
                "phone": db_phone,
                "email": email,
                "status": "ureporter",
                "sex": gender,
                "commune": commune,
                "integration_note": "Importé depuis le formulaire d'identification officiel",
                "interview_passed": True,
                "tshirt_received": False,
                "is_pco": False,
                "commission": ""
            })

    print(f"\nProcessing insertion of {len(new_members_payloads)} new members...")
    
    # Batch inserts (max 100 rows per request)
    batch_size = 100
    inserted_count = 0
    
    for i in range(0, len(new_members_payloads), batch_size):
        batch = new_members_payloads[i : i + batch_size]
        try:
            print(f"Inserting batch of {len(batch)} new members ({i + 1} to {min(i + batch_size, len(new_members_payloads))})...")
            supabase.insert("members", batch)
            inserted_count += len(batch)
        except Exception as e:
            print(f"Error inserting batch: {e}. Trying row-by-row fallback...")
            for item in batch:
                try:
                    supabase.insert("members", item)
                    inserted_count += 1
                except Exception as row_err:
                    print(f"Failed to insert individual member {item['full_name']} ({item['phone']}): {row_err}")

    print("\n" + "="*40)
    print("IMPORT SUMMARY:")
    print(f"Total new members inserted: {inserted_count}")
    print(f"Total existing members enriched / updated: {updated_members_count}")
    print(f"Duplicate phone numbers skipped in Excel: {skipped_duplicates_in_excel}")
    print("="*40)

if __name__ == "__main__":
    import_from_excel()
