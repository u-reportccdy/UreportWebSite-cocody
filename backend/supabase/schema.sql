create extension if not exists "pgcrypto";

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  image_url text not null default '',
  category text not null default 'Actualites',
  author text not null default 'Admin',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  location text not null default '',
  event_date date,
  start_time time,
  end_time time,
  image_url text not null default '',
  whatsapp_link text not null default '',
  category text not null default 'Formation',
  capacity integer not null default 0,
  registered integer not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'past', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events add column if not exists whatsapp_link text not null default '';

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null default '',
  sex text not null default 'non_precise' check (sex in ('homme', 'femme', 'non_precise')),
  birth_date date,
  commune text not null default '',
  status text not null default 'aspirant' check (status in ('aspirant', 'ureporter', 'mentor')),
  integration_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text not null default '',
  sex text not null default 'non_precise' check (sex in ('homme', 'femme', 'non_precise')),
  member_status text not null default 'aspirant' check (member_status in ('aspirant', 'ureporter', 'mentor')),
  attended boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, phone)
);

create table if not exists payment_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_amount integer,
  max_amount integer,
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text not null default '',
  amount integer not null check (amount > 0),
  currency text not null default 'XOF',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_url text not null,
  provider_reference text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null default '',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default '',
  website text not null default '',
  logo_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default '',
  content text not null,
  avatar_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  cover_url text not null default '',
  external_link text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references gallery_albums(id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default '',
  team_type text not null default 'bureau' check (team_type in ('bureau', 'developer')),
  bio text not null default '',
  photo_url text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace view event_attendance_summary as
select
  e.id as event_id,
  e.title,
  count(r.id)::integer as registered_count,
  count(r.id) filter (where r.attended = true)::integer as attended_count,
  case
    when count(r.id) = 0 then 0
    else round((count(r.id) filter (where r.attended = true)::numeric / count(r.id)::numeric) * 100)
  end::integer as attendance_rate
from events e
left join event_registrations r on r.event_id = e.id
group by e.id, e.title;

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text not null default 'Engagez-vous pour Cocody',
  hero_subtitle text not null default 'La voix de la jeunesse Ivoirienne',
  hero_description text not null default 'Rejoignez la plus grande communauté de jeunes engagés. Participez à nos actions, donnez votre avis et contribuez au développement de notre commune.',
  hero_image_url text not null default 'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  about_title text not null default 'Plus qu''une communauté, un mouvement.',
  about_description text not null default 'U-Report est une plateforme sociale développée par l''UNICEF pour engager les jeunes et les communautés. À Cocody, nous utilisons cet outil pour identifier les problèmes locaux, proposer des solutions et agir concrètement sur le terrain.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default settings row if table is empty
insert into settings (hero_title, hero_subtitle, hero_description, hero_image_url, about_title, about_description)
select 'Engagez-vous pour Cocody', 'La voix de la jeunesse Ivoirienne', 'Rejoignez la plus grande communauté de jeunes engagés. Participez à nos actions, donnez votre avis et contribuez au développement de notre commune.', 'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Plus qu''une communauté, un mouvement.', 'U-Report est une plateforme sociale développée par l''UNICEF pour engager les jeunes et les communautés. À Cocody, nous utilisons cet outil pour identifier les problèmes locaux, proposer des solutions et agir concrètement sur le terrain.'
where not exists (select 1 from settings);

alter table settings add column if not exists facebook_url text not null default '';
alter table settings add column if not exists instagram_url text not null default '';
alter table settings add column if not exists tiktok_url text not null default '';
alter table settings add column if not exists whatsapp_group_link text not null default '';
alter table settings add column if not exists whatsapp_manager_link text not null default '';
alter table settings add column if not exists whatsapp_message_aspirant text not null default 'Bonjour, je suis {name} ({status_label}) et je viens de m''inscrire à l''activité "{event_title}". Merci de m''ajouter au groupe d''intégration.';
alter table settings add column if not exists whatsapp_message_advanced text not null default 'Bonjour, je suis {name} ({status_label}) et je viens de m''inscrire à l''activité "{event_title}". Je souhaite finaliser mon intégration.';
alter table settings add column if not exists footer_contact_title text not null default 'Contact';
alter table settings add column if not exists footer_contact_address text not null default 'Mairie de Cocody,\nAbidjan, Côte d''Ivoire';
alter table settings add column if not exists footer_contact_phone text not null default '+225 00 00 00 00 00';
alter table settings add column if not exists footer_contact_email text not null default 'contact@ureportcocody.ci';
alter table settings add column if not exists footer_newsletter_title text not null default 'Newsletter';
alter table settings add column if not exists footer_newsletter_text text not null default 'Restez informé de nos prochaines activités et opportunités d''engagement.';
alter table settings add column if not exists footer_newsletter_placeholder text not null default 'Votre adresse email';
alter table settings add column if not exists footer_newsletter_button text not null default 'S''abonner';
alter table settings add column if not exists site_under_maintenance boolean not null default false;
alter table settings add column if not exists maintenance_message text not null default 'Le site est temporairement en maintenance.';
alter table settings add column if not exists maintenance_image_url text not null default '/images/logo-512.png';

create table if not exists superadmin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  target text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_superadmin_logs_created_at on superadmin_logs(created_at desc);
