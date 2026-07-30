import os
import sys
import openpyxl
import django
from datetime import datetime
from pathlib import Path

# Setup Django path
backend_dir = Path("/Users/mac/Documents/U-REPORT/backend")
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ureport_backend.settings")
django.setup()

from api import supabase

def clean_phone(phone_str):
    if not phone_str:
        return ""
    return "".join(ch for ch in str(phone_str) if ch.isdigit())

def fix_adhesion_dates():
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

    updated_count = 0
    skipped_count = 0

    for row_num, row in enumerate(rows, start=2):
        if not row or len(row) < 10:
            continue

        raw_timestamp = row[0] # L'Horodateur est à la colonne 0 (ex: 2023-05-15 14:32:00 ou une chaîne de caractères)
        raw_whatsapp = row[8]
        raw_contact2 = row[9]

        if not raw_timestamp:
            continue

        # Convertir le timestamp en format ISO string (timestamptz pour postgres)
        iso_timestamp = None
        if isinstance(raw_timestamp, datetime):
            iso_timestamp = raw_timestamp.isoformat()
        else:
            # Essayer de parser la chaîne de caractères
            try:
                # Format classique: "YYYY-MM-DD HH:MM:SS" ou "DD/MM/YYYY HH:MM:SS"
                parsed_dt = datetime.strptime(str(raw_timestamp).strip(), "%Y-%m-%d %H:%M:%S")
                iso_timestamp = parsed_dt.isoformat()
            except ValueError:
                try:
                    parsed_dt = datetime.strptime(str(raw_timestamp).strip(), "%d/%m/%Y %H:%M:%S")
                    iso_timestamp = parsed_dt.isoformat()
                except ValueError:
                    # Rempli par défaut
                    iso_timestamp = str(raw_timestamp)

        # Déterminer le numéro de téléphone pour faire correspondre le membre
        phone_whatsapp = clean_phone(raw_whatsapp)
        phone_contact2 = clean_phone(raw_contact2)

        phone_digits = None
        if len(phone_whatsapp) >= 9:
            phone_digits = phone_whatsapp
        elif len(phone_contact2) >= 9:
            phone_digits = phone_contact2

        if not phone_digits:
            continue

        phone_9 = phone_digits[-9:]

        # Si le membre existe, on met à jour sa date d'adhésion
        if phone_9 in existing_by_phone_9:
            db_member = existing_by_phone_9[phone_9]
            member_id = db_member.get("id")
            
            payload = {
                "date_adhesion": iso_timestamp
            }
            
            try:
                supabase.update("members", "id", member_id, payload)
                print(f"[{row_num}] Updated member {db_member.get('full_name')} with date_adhesion: {iso_timestamp}")
                updated_count += 1
            except Exception as e:
                print(f"Error updating member {member_id}:", e)
        else:
            skipped_count += 1

    print(f"\nFinished! Updated: {updated_count} members, Skipped/Not found: {skipped_count}.")

if __name__ == "__main__":
    fix_adhesion_dates()
