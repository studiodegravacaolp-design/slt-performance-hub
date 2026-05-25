CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tenant_id uuid NOT NULL,
  email text,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_own_select"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profile_own_insert"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() = tenant_id);

CREATE POLICY "profile_own_update"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND auth.uid() = tenant_id);

CREATE POLICY "profile_own_delete"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.seed_user_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.organizations (owner_id, name)
  VALUES (_user_id, 'Elite Performance Club')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_profiles (user_id, tenant_id, email, display_name)
  VALUES (_user_id, _user_id, NULL, 'Usuário')
  ON CONFLICT (user_id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      updated_at = now();

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
$function$;

INSERT INTO public.user_profiles (user_id, tenant_id, email, display_name)
SELECT o.owner_id, o.owner_id, NULL, 'Usuário'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.user_id = o.owner_id
);