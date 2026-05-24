export type PlanStatus = "Ativo" | "Inadimplente" | "Pausado";
export type Sport =
  | "musculacao"
  | "natacao"
  | "corrida"
  | "futebol"
  | "tenis"
  | "paradesporto";

export interface TelemetryPoint {
  label: string;
  valor: number;
}

export interface Athlete {
  id: string;
  nome: string;
  email: string;
  plano: PlanStatus;
  altura: number;
  peso: number;
  ultimaAvaliacao: string;
  modalidade: Sport;
  classificacao?: string;
  restricoes?: string;
  telemetria: TelemetryPoint[];
  metricaLabel: string;
  metricaUnidade: string;
}

export const SPORT_LABEL: Record<Sport, string> = {
  musculacao: "Musculação / Crossfit",
  natacao: "Natação",
  corrida: "Corrida / Atletismo",
  futebol: "Futebol",
  tenis: "Tênis",
  paradesporto: "Paradesporto",
};

// Row shape coming from Supabase `athletes` table
export interface AthleteRow {
  id: string;
  nome: string;
  email: string;
  plano: string;
  altura: number;
  peso: number;
  ultima_avaliacao: string | null;
  modalidade: string;
  classificacao: string | null;
  restricoes: string | null;
  metrica_label: string | null;
  metrica_unidade: string | null;
  telemetria: unknown;
}

export function rowToAthlete(r: AthleteRow): Athlete {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    plano: (r.plano as PlanStatus) ?? "Ativo",
    altura: r.altura,
    peso: r.peso,
    ultimaAvaliacao: r.ultima_avaliacao ?? "—",
    modalidade: (r.modalidade as Sport) ?? "musculacao",
    classificacao: r.classificacao ?? undefined,
    restricoes: r.restricoes ?? undefined,
    metricaLabel: r.metrica_label ?? "Métrica principal",
    metricaUnidade: r.metrica_unidade ?? "—",
    telemetria: Array.isArray(r.telemetria) ? (r.telemetria as TelemetryPoint[]) : [],
  };
}
