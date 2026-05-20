# U-Report Cocody - Backend Django

Backend Django connecte a Supabase via l'API REST PostgREST.

## Demarrage

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py runserver 0.0.0.0:8000
```

Renseigner `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env`, puis executer `supabase/schema.sql` dans l'editeur SQL Supabase.

## Routes

- `GET /health/`
- Articles: `/api/articles`, `/api/articles/<id>`
- Evenements: `/api/events`, `/api/events/<id>`
- Inscription activite: `/api/events/<id>/register`
- Liste et presence: `/api/events/<id>/registrations`, `/api/events/<id>/registrations/<registration_id>/attendance`
- Resume presence: `/api/events/<id>/attendance-summary`
- Membres: `/api/members`
- Cotisations: `/api/contributions/initiate`, `/api/contributions`, `/api/contributions/payment-links`
- Contenus: `/api/partners`, `/api/testimonials`, `/api/gallery/albums`, `/api/gallery/photos`
- Newsletter: `/api/newsletter/subscribe`, `/api/newsletter/subscribers`
