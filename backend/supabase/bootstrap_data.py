import os
import sys
import json
import httpx
import django
from pathlib import Path

# Setup Django path
backend_dir = Path("/Users/mac/Documents/U-REPORT/backend")
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ureport_backend.settings")
django.setup()

from api import supabase

def bootstrap_data():
    print("Bootstrapping settings...")
    # Load site_settings.json
    settings_file = backend_dir / "site_settings.json"
    if settings_file.exists():
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                settings_data = json.load(f)
            
            valid_fields = [
                "hero_title",
                "hero_subtitle",
                "hero_description",
                "hero_image_url",
                "about_title",
                "about_description",
                "facebook_url",
                "instagram_url",
                "tiktok_url",
                "whatsapp_group_link",
                "whatsapp_manager_link",
                "whatsapp_message_aspirant",
                "whatsapp_message_advanced",
                "footer_contact_title",
                "footer_contact_address",
                "footer_contact_phone",
                "footer_contact_email",
                "footer_newsletter_title",
                "footer_newsletter_text",
                "footer_newsletter_placeholder",
                "footer_newsletter_button",
                "newsletter_receiver_email",
                "site_under_maintenance",
                "maintenance_message",
                "maintenance_image_url",
            ]
            settings_data = {k: v for k, v in settings_data.items() if k in valid_fields}
            
            # Delete old settings
            try:
                supabase.delete("settings", "hero_title", "neq.IS_NULL_DELETE_ALL_FALLBACK_NOT_NEEDED")
            except Exception as e:
                print("Delete settings warning:", e)
            
            # Since settings has no simple delete-all, let's insert or update
            # We can select first
            rows = supabase.select("settings", "select=*")
            if rows:
                settings_id = rows[0]["id"]
                print(f"Updating settings row {settings_id}...")
                res = supabase.update("settings", "id", settings_id, settings_data)
                print("Settings update success")
            else:
                print("Inserting new settings row...")
                res = supabase.insert("settings", settings_data)
                print("Settings insert success")
        except httpx.HTTPStatusError as e:
            print("Failed to bootstrap settings (HTTPStatusError):", e)
            print("Response text:", e.response.text)
        except Exception as e:
            print("Failed to bootstrap settings (General):", e)
    else:
        print("site_settings.json not found")

    print("Bootstrapping testimonials...")
    testimonials_file = Path("/Users/mac/.gemini/antigravity-ide/brain/6425fd57-4284-48d8-8f1d-7c5ac053a9ff/scratch/testimonials.json")
    if testimonials_file.exists():
        try:
            with open(testimonials_file, "r", encoding="utf-8") as f:
                testimonials_data = json.load(f)
            
            # Clean old testimonials if any
            # (Supabase doesn't support easy truncate via REST without filter, but we can do delete with dummy match)
            # Let's insert testimonials
            for testimonial in testimonials_data:
                payload = {
                    "full_name": testimonial.get("full_name"),
                    "role": testimonial.get("role", ""),
                    "content": testimonial.get("content", ""),
                    "avatar_url": testimonial.get("avatar_url", ""),
                    "status": testimonial.get("status", "published")
                }
                print(f"Inserting testimonial for {payload['full_name']}...")
                res = supabase.insert("testimonials", payload)
                print("Insert success")
        except Exception as e:
            print("Failed to bootstrap testimonials:", e)
    else:
        print("testimonials.json not found")

if __name__ == "__main__":
    bootstrap_data()
