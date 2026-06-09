# Decoupled Event Bus for modular architecture
import logging
from . import supabase

logger = logging.getLogger(__name__)

def handle_event_created(event_data):
    """
    Listener for when a new event is created.
    Automatically generates initial tasks for both Communication and Logistics departments.
    """
    event_id = event_data.get("id")
    event_title = event_data.get("title", "Nouvel événement")
    due_date = event_data.get("event_date")

    # Automated tasks
    tasks = [
        {
            "event_id": event_id,
            "title": f"Créer l'affiche et publier l'annonce pour {event_title}",
            "department_code": "communication",
            "status": "todo",
            "due_date": due_date
        },
        {
            "event_id": event_id,
            "title": f"Réserver le matériel et préparer la logistique pour {event_title}",
            "department_code": "logistique",
            "status": "todo",
            "due_date": due_date
        }
    ]

    for task_data in tasks:
        try:
            supabase.insert("tasks", task_data)
            logger.info(f"Auto-generated task: '{task_data['title']}' for department '{task_data['department_code']}'")
        except Exception as e:
            logger.error(f"Failed to auto-generate task for event {event_id}: {e}")

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
