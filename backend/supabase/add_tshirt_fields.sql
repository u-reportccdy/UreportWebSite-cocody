-- Migration SQL : Ajouter les champs de suivi T-shirt, Intégration et Commission pour le département Logistique

-- Ajouter les colonnes de suivi à la table members
ALTER TABLE members ADD COLUMN IF NOT EXISTS interview_passed boolean DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tshirt_received boolean DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_pco boolean DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS commission text DEFAULT '';
