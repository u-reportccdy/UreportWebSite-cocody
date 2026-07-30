import os
from datetime import date
from django.core.management.base import BaseCommand
from django.conf import settings
from api import supabase
from api.views import _send_email_via_brevo, _calculate_status_from_birth_date

class Command(BaseCommand):
    help = "Vérifie les anniversaires du jour, met à jour les statuts d'âge et envoie les e-mails de félicitations via Brevo."

    def handle(self, *args, **options):
        self.stdout.write("Démarrage du traitement des anniversaires...")
        
        try:
            # Récupérer tous les membres ayant une date de naissance renseignée
            members = supabase.select("members", "select=*")
        except Exception as e:
            self.stderr.write(f"Erreur lors de la récupération des membres : {e}")
            return

        today = date.today()
        today_month = today.month
        today_day = today.day

        birthdays_count = 0
        email_sent_count = 0

        for member in members:
            birth_date_str = member.get("birth_date")
            if not birth_date_str:
                continue

            try:
                # Parser la date de naissance (YYYY-MM-DD)
                dob = date.fromisoformat(birth_date_str)
            except ValueError:
                continue

            # Vérifier si c'est son anniversaire aujourd'hui (même jour et même mois)
            if dob.month == today_month and dob.day == today_day:
                birthdays_count += 1
                member_id = member.get("id")
                email = member.get("email")
                full_name = member.get("full_name")
                old_status = member.get("status", "aspirant")

                # 1. Calculer le nouvel âge et le nouveau statut
                new_age = today.year - dob.year
                new_status = _calculate_status_from_birth_date(birth_date_str)

                # 2. Mettre à jour en base de données si le statut a changé ou pour marquer le passage d'âge
                updates = {"status": new_status}
                try:
                    supabase.update("members", "id", member_id, updates)
                    self.stdout.write(f"Anniversaire de {full_name} ({new_age} ans). Statut mis à jour de '{old_status}' vers '{new_status}'.")
                except Exception as e:
                    self.stderr.write(f"Impossible de mettre à jour le statut du membre {member_id}: {e}")

                # 3. Envoyer l'email d'anniversaire via Brevo s'il a un email renseigné
                if email:
                    subject = f"🎉 Joyeux Anniversaire {full_name} ! 🎂"
                    
                    status_label = "U-Reporter Junior"
                    if new_status == "senior":
                        status_label = "U-Reporter Senior"
                    elif new_status == "mentor":
                        status_label = "Mentor"

                    text_content = (
                        f"Bonjour {full_name},\n\n"
                        f"Toute la communauté U-Report Cocody te souhaite un très joyeux anniversaire pour tes {new_age} ans ! 🥳🎉\n\n"
                        f"À cette occasion, ton profil a été mis à jour de façon automatique. Tu as désormais le statut de :\n"
                        f"👉 {status_label}\n\n"
                        f"Merci pour ton engagement précieux au sein de la communauté U-Reporters. Profite bien de ta journée !\n\n"
                        f"L'équipe U-Report Cocody."
                    )

                    try:
                        success = _send_email_via_brevo(subject, text_content, email)
                        if success:
                            self.stdout.write(f"E-mail d'anniversaire envoyé avec succès à {email}.")
                            email_sent_count += 1
                        else:
                            self.stderr.write(f"Échec de l'envoi de l'e-mail à {email}.")
                    except Exception as e:
                        self.stderr.write(f"Erreur d'envoi d'e-mail à {email}: {e}")

        self.stdout.write(f"Traitement terminé. {birthdays_count} anniversaire(s) identifié(s). {email_sent_count} e-mail(s) envoyé(s).")
