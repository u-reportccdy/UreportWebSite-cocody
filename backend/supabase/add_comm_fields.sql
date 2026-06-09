-- Migration SQL : Optimisation Département Communication
-- 1. Ajouter le lien d'activité aux albums photos
ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- 2. Ajouter le lien externe facultatif aux articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS external_link TEXT NOT NULL DEFAULT '';
