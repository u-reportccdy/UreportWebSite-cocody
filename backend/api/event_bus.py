# Decoupled Event Bus for modular architecture
import logging
import os
import json
import requests
from django.core.mail import send_mail
from . import supabase

logger = logging.getLogger(__name__)

def _generate_tasks_with_gemini(event_title, event_description):
    """
    Calls the Gemini API to analyze event description and generate specific tasks.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.info("GEMINI_API_KEY not found in environment. Using default static tasks.")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    prompt = f"""
    Tu es un assistant de gestion d'activités pour le comité local U-Report Cocody (Côte d'Ivoire).
    Génère une liste de tâches préparatoires recommandées pour l'événement suivant :
    Titre: {event_title}
    Description: {event_description}
    
    Génère entre 5 et 8 tâches au total distribuées de manière pertinente entre les départements suivants :
    - communication (création d'affiches, publication réseaux sociaux, articles, etc.)
    - logistique (préparation matériel, transport, installation terrain, etc. Note: s'il s'agit d'une caravane mobile, pas besoin de réserver une salle !)
    - programme (agenda de l'activité, invitation formateurs/intervenants)
    - finances (devis, budget de rafraîchissements/transport)
    - secretariat (convocations des membres, compte-rendu d'organisation)

    Le format de sortie doit obligatoirement être un tableau JSON valide brut (sans bloc de code markdown, pas de ```json ou autre texte d'introduction) avec précisément cette structure :
    [
      {{
        "title": "Titre court et clair de la tâche",
        "description": "Description détaillée de l'action à mener",
        "department_code": "code_du_departement (doit être l'un des suivants: communication, logistique, programme, finances, secretariat)"
      }}
    ]
    """
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            data = response.json()
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            # Clean markdown formatting if present
            if text_response.startswith("```"):
                text_response = text_response.split("```")[1]
                if text_response.startswith("json"):
                    text_response = text_response[4:]
            
            tasks_list = json.loads(text_response.strip())
            if isinstance(tasks_list, list):
                return tasks_list
        else:
            logger.error(f"Gemini API returned error status {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Exception during Gemini API task generation: {e}")
    return None


def _send_event_notifications(event_data):
    """
    Sends SMTP notification emails to all registered department admins.
    """
    event_title = event_data.get("title", "Nouvel événement")
    event_date = event_data.get("event_date", "Non définie")
    event_location = event_data.get("location", "Non défini")
    event_description = event_data.get("description", "")
    
    # Fetch all admins' emails
    try:
        admins = supabase.select("admins", "select=email,role")
        recipient_list = list({admin["email"].strip() for admin in admins if admin.get("email")})
    except Exception as e:
        logger.error(f"Error fetching admin emails for notification: {e}")
        recipient_list = ["comm@test.com", "logistique@test.com", "finance@test.com", "secretariat@test.com"]
        
    if not recipient_list:
        return
        
    subject = f"🚨 Nouvelle activité lancée : {event_title}"
    message = f"""Bonjour,

Une nouvelle activité a été créée et lancée dans le système :

Titre : {event_title}
Date : {event_date}
Lieu : {event_location}

Description :
{event_description}

Les tâches préparatoires correspondantes ont été automatiquement générées dans l'onglet "Tâches" de vos tableaux de bord respectifs.

Merci d'y accéder pour commencer la préparation.

L'équipe U-Report Cocody
"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=recipient_list,
            fail_silently=True
        )
        logger.info(f"Notification emails sent to: {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email notifications: {e}")


def handle_event_created(event_data):
    """
    Listener for when a new event is created.
    Automatically generates initial tasks for both Communication and Logistics departments.
    """
    event_id = event_data.get("id")
    event_title = event_data.get("title", "Nouvel événement")
    event_description = event_data.get("description", "")
    due_date = event_data.get("event_date")

    # 1. Attempt to generate tasks using Gemini AI
    tasks = _generate_tasks_with_gemini(event_title, event_description)
    
    # 2. Fallback to default tasks if Gemini is unavailable
    if not tasks:
        logger.info("Using default fallback tasks for the event.")
        tasks = [
            {
                "title": f"Créer l'affiche et publier l'annonce pour {event_title}",
                "description": f"Concevoir le visuel de l'activité '{event_title}' et le partager sur les canaux de communication officiels.",
                "department_code": "communication"
            },
            {
                "title": f"Préparer la logistique et le matériel pour {event_title}",
                "description": f"Préparer les besoins logistiques matériels et humains selon la nature de '{event_title}'.",
                "department_code": "logistique"
            },
            {
                "title": f"Établir le budget prévisionnel pour {event_title}",
                "description": f"Estimer les coûts nécessaires pour l'organisation de '{event_title}' et les soumettre pour approbation.",
                "department_code": "finances"
            },
            {
                "title": f"Rédiger et envoyer les convocations pour {event_title}",
                "description": f"Notifier officiellement les membres du comité et les partenaires impliqués dans '{event_title}'.",
                "department_code": "secretariat"
            }
        ]

    # Insert tasks into Supabase
    for task_data in tasks:
        task_payload = {
            "event_id": event_id,
            "title": task_data.get("title"),
            "description": task_data.get("description", ""),
            "department_code": task_data.get("department_code", "logistique"),
            "status": "todo",
            "due_date": due_date
        }
        try:
            supabase.insert("tasks", task_payload)
            logger.info(f"Auto-generated task: '{task_payload['title']}' for department '{task_payload['department_code']}'")
        except Exception as e:
            logger.error(f"Failed to auto-generate task for event {event_id}: {e}")

    # 3. Send email notifications
    _send_event_notifications(event_data)


# Map event names to listeners
_listeners = {
    "event.created": [handle_event_created]
}

def dispatch(event_name: str, data: dict):
    """
    Dispatches events to registered listeners.
    """
    handlers = _listeners.get(event_name, [])
    for handler in handlers:
        try:
            handler(data)
        except Exception as e:
            logger.error(f"Error executing listener {handler.__name__} for event {event_name}: {e}")
