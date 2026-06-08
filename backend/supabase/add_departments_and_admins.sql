-- Migration SQL : Gestion des administrateurs par département

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('superadmin', 'communication', 'activites', 'programme', 'logistique', 'finances', 'secretariat', 'president')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour accélérer la recherche par email lors de la connexion
create index if not exists idx_admins_email on admins(email);
