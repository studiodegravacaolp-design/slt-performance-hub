
-- Organizations (tenants)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_own_select ON public.organizations FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY org_own_insert ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY org_own_update ON public.organizations FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY org_own_delete ON public.organizations FOR DELETE USING (auth.uid() = owner_id);
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Athletes
CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  email text NOT NULL,
  plano text NOT NULL DEFAULT 'Ativo',
  altura integer NOT NULL DEFAULT 170,
  peso integer NOT NULL DEFAULT 70,
  ultima_avaliacao text DEFAULT '—',
  modalidade text NOT NULL DEFAULT 'musculacao',
  classificacao text,
  restricoes text,
  metrica_label text DEFAULT 'Métrica principal',
  metrica_unidade text DEFAULT '—',
  telemetria jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ath_own_select ON public.athletes FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY ath_own_insert ON public.athletes FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY ath_own_update ON public.athletes FOR UPDATE USING (auth.uid() = tenant_id);
CREATE POLICY ath_own_delete ON public.athletes FOR DELETE USING (auth.uid() = tenant_id);
CREATE INDEX idx_athletes_tenant ON public.athletes(tenant_id);
CREATE TRIGGER trg_ath_updated BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed function for a single user
CREATE OR REPLACE FUNCTION public.seed_user_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Organization
  INSERT INTO public.organizations (owner_id, name)
  VALUES (_user_id, 'Elite Performance Club')
  ON CONFLICT DO NOTHING;

  -- Athletes (skip if user already has any)
  IF EXISTS (SELECT 1 FROM public.athletes WHERE tenant_id = _user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.athletes
    (tenant_id, nome, email, plano, altura, peso, ultima_avaliacao, modalidade, classificacao, restricoes, metrica_label, metrica_unidade, telemetria)
  VALUES
    (_user_id, 'Maria Souza', 'maria@club.com', 'Ativo', 168, 62, '12/05', 'natacao',
      'Classe S9 — Paranatação',
      'Amputação transtibial direita. Usar prótese esportiva apenas para saída de bloco. Evitar carga axial completa em treino seco.',
      'Pace 100m livre', 's',
      '[{"label":"Sem 1","valor":78},{"label":"Sem 2","valor":76},{"label":"Sem 3","valor":75},{"label":"Sem 4","valor":74},{"label":"Sem 5","valor":73.5},{"label":"Sem 6","valor":72}]'::jsonb),
    (_user_id, 'João Pereira', 'joao@club.com', 'Ativo', 182, 84, '08/05', 'musculacao', NULL, NULL,
      'Carga total agachamento', 'kg',
      '[{"label":"Sem 1","valor":90},{"label":"Sem 2","valor":95},{"label":"Sem 3","valor":100},{"label":"Sem 4","valor":102},{"label":"Sem 5","valor":108},{"label":"Sem 6","valor":112}]'::jsonb),
    (_user_id, 'Ana Lima', 'ana@club.com', 'Inadimplente', 165, 58, '02/04', 'corrida', NULL, NULL,
      'Pace médio 5km', 'min/km',
      '[{"label":"Sem 1","valor":5.4},{"label":"Sem 2","valor":5.3},{"label":"Sem 3","valor":5.35},{"label":"Sem 4","valor":5.5},{"label":"Sem 5","valor":5.6},{"label":"Sem 6","valor":5.55}]'::jsonb),
    (_user_id, 'Pedro Alves', 'pedro@club.com', 'Pausado', 178, 79, '20/03', 'futebol', NULL, NULL,
      'Presença semanal', '%',
      '[{"label":"Sem 1","valor":80},{"label":"Sem 2","valor":75},{"label":"Sem 3","valor":60},{"label":"Sem 4","valor":50},{"label":"Sem 5","valor":40},{"label":"Sem 6","valor":30}]'::jsonb),
    (_user_id, 'Clara Mendes', 'clara@club.com', 'Ativo', 170, 64, '15/05', 'tenis', NULL, NULL,
      'Aproveitamento de saque', '%',
      '[{"label":"Sem 1","valor":55},{"label":"Sem 2","valor":58},{"label":"Sem 3","valor":60},{"label":"Sem 4","valor":63},{"label":"Sem 5","valor":66},{"label":"Sem 6","valor":68}]'::jsonb),
    (_user_id, 'Rafael Costa', 'rafa@club.com', 'Ativo', 185, 88, '11/05', 'musculacao', NULL, NULL,
      'Volume total semanal', 't',
      '[{"label":"Sem 1","valor":8},{"label":"Sem 2","valor":9},{"label":"Sem 3","valor":10},{"label":"Sem 4","valor":11},{"label":"Sem 5","valor":12},{"label":"Sem 6","valor":12.5}]'::jsonb),
    (_user_id, 'Beatriz Rocha', 'bia@club.com', 'Inadimplente', 162, 55, '28/03', 'paradesporto',
      'Classe T54 — Atletismo cadeirante',
      'Lesão medular T12. Atenção a transferências e pressão escapular. Hidratação reforçada em ambiente quente.',
      'Velocidade média propulsão', 'km/h',
      '[{"label":"Sem 1","valor":18},{"label":"Sem 2","valor":19},{"label":"Sem 3","valor":19.5},{"label":"Sem 4","valor":20},{"label":"Sem 5","valor":20.5},{"label":"Sem 6","valor":21}]'::jsonb),
    (_user_id, 'Lucas Martins', 'lucas@club.com', 'Ativo', 176, 75, '13/05', 'corrida', NULL, NULL,
      'VO2 estimado', 'ml/kg/min',
      '[{"label":"Sem 1","valor":48},{"label":"Sem 2","valor":49},{"label":"Sem 3","valor":50},{"label":"Sem 4","valor":51},{"label":"Sem 5","valor":52},{"label":"Sem 6","valor":53}]'::jsonb);
END;
$$;

-- Trigger on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_user_data(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (current logged-in user)
DO $$
DECLARE u record;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_user_data(u.id);
  END LOOP;
END $$;
