-- Migration SQL : Table member_awards (Prix & Certificats des membres U-Report)

-- Créer la table member_awards si elle n'existe pas
CREATE TABLE IF NOT EXISTS member_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    award_name text NOT NULL,
    award_type text NOT NULL DEFAULT 'award',
    awarded_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    description text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Mettre à jour la contrainte CHECK pour accepter 'certificate'
ALTER TABLE member_awards DROP CONSTRAINT IF EXISTS member_awards_award_type_check;
ALTER TABLE member_awards ADD CONSTRAINT member_awards_award_type_check CHECK (award_type IN ('ugirl', 'best_ureporter', 'award', 'custom', 'certificate'));

-- Ajouter les colonnes justificatif et structure émettrice si elles n'existent pas
ALTER TABLE member_awards ADD COLUMN IF NOT EXISTS document_url text DEFAULT '';
ALTER TABLE member_awards ADD COLUMN IF NOT EXISTS issuer text DEFAULT '';

-- Index pour accélerer les requêtes par membre
CREATE INDEX IF NOT EXISTS idx_member_awards_member_id ON member_awards(member_id);
CREATE INDEX IF NOT EXISTS idx_member_awards_year ON member_awards(awarded_year);
