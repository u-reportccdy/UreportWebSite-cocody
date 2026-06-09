# Plateforme Web U-Report Cocody

Application web U-Report Cocody avec un frontend React/Vite et un backend Python Django connecte a Supabase.

## Architecture

```text
U-REPORT/
├── frontend/      # React, Vite, TypeScript, TailwindCSS
└── backend/       # API Python Django + Supabase
```

## Demarrage backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py runserver 0.0.0.0:8000
```

Avant de lancer les routes dynamiques, executer `backend/supabase/schema.sql` dans Supabase puis renseigner `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `backend/.env`.

## Demarrage frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend utilise par defaut `http://localhost:8000/api`. Pour changer l'URL, definir `VITE_API_URL` dans `frontend/.env`.

## Documentation

- [Frontend](./frontend/README.md)
- [Backend](./backend/README.md)
