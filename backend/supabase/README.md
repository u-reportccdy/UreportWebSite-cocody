# Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `schema.sql`.
3. Copy `backend/.env.example` to `backend/.env`.
4. Fill `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTEGRATION_CONTACT_URL`, and payment URLs.

The backend uses the service role key server-side only. Never expose it in the frontend.
