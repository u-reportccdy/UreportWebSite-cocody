-- Migration SQL : Ajout du flag welcome_email_sent pour le suivi d'envoi d'email de bienvenue
ALTER TABLE members ADD COLUMN IF NOT EXISTS welcome_email_sent boolean NOT NULL DEFAULT false;
