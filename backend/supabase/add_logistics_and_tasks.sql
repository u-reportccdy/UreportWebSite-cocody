-- Migration SQL : Phase 2 - Automatisation inter-départements & Logistique

-- 1. Mettre à jour la contrainte de rôle sur la table admins pour inclure 'logistique' et 'president'
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'admins'::regclass AND contype = 'c' AND conname LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE admins DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('superadmin', 'communication', 'activites', 'programme', 'finances', 'secretariat', 'logistique', 'president'));

-- 2. Créer la table logistics_materials (Inventaire du matériel logistique)
CREATE TABLE IF NOT EXISTS logistics_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    total_quantity integer NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    available_quantity integer NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'lost')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Créer la table logistics_requests (Demandes de réservation de matériel pour un événement)
CREATE TABLE IF NOT EXISTS logistics_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES logistics_materials(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Créer la table tasks (Tâches collaboratives inter-départements)
CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    title text NOT NULL,
    department_code text NOT NULL CHECK (department_code IN ('communication', 'programme', 'logistique', 'finances', 'secretariat')),
    assigned_user_id uuid REFERENCES admins(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Créer des index pour optimiser les jointures et filtres
CREATE INDEX IF NOT EXISTS idx_logistics_requests_event_id ON logistics_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_material_id ON logistics_requests(material_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department_code ON tasks(department_code);
