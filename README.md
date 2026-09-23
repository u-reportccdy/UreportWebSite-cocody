# Plateforme Web U-Report Cocody (v1.2.0)

Application web officielle de U-Report Cocody. Un portail communautaire interactif avec un frontend React/Vite et un backend Python Django connecté à Supabase.

## ✨ Nouveautés (Version 1.2.0)

- **Application PWA (Progressive Web App)** : Le site peut désormais être installé directement sur l'écran d'accueil des téléphones (iOS & Android) pour une utilisation native.
- **Assistant Virtuel IA** : Un Chatbot flottant intelligent intégré pour répondre aux questions fréquentes des jeunes (Inscriptions, Événements, Cotisations, etc.).
- **Conformité Légale 100%** : Ajout des CGU, Politique de Confidentialité, Mentions Légales, Politique de Remboursements, et Politique des Cookies (avec bannière de consentement) selon la législation Ivoirienne et le RGPD.
- **Footer Dynamique** : Bas de page intelligent (Slim footer) s'allégeant sur les pages légales ou utilitaires pour ne pas encombrer la lecture.
- **Backend & Automatisation** : Ajout du système de Rôles (`commission_role`) pour des notifications d'IA ciblées aux responsables (ex: Coordinateur Général).

## Architecture

```text
U-REPORT/
├── frontend/      # React, Vite, TypeScript, TailwindCSS, Framer Motion
└── backend/       # API Python Django + Supabase (PostgreSQL)
```

## Démarrage backend

```bash
cd backend
python -m venv .venv
# Sur Windows : .venv\Scripts\activate
# Sur Mac/Linux : source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py runserver 0.0.0.0:8000
```

> **Note :** Avant de lancer les routes dynamiques, exécuter `backend/supabase/schema.sql` dans Supabase puis renseigner `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `backend/.env`.

## Démarrage frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend utilise par défaut `http://localhost:8000/api`. Pour changer l'URL, définir `VITE_API_URL` dans `frontend/.env`.

## Documentation

- [Documentation Frontend](./frontend/README.md)
- [Documentation Backend](./backend/README.md)
