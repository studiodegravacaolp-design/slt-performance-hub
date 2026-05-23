export type PlanStatus = "Ativo" | "Inadimplente" | "Pausado";
export type Sport =
  | "musculacao"
  | "natacao"
  | "corrida"
  | "futebol"
  | "tenis"
  | "paradesporto";

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
  telemetria: { label: string; valor: number }[];
  metricaLabel: string;
  metricaUnidade: string;
}

export const ATHLETES: Athlete[] = [
  {
    id: "1",
    nome: "Maria Souza",
    email: "maria@club.com",
    plano: "Ativo",
    altura: 168,
    peso: 62,
    ultimaAvaliacao: "12/05",
    modalidade: "natacao",
    classificacao: "Classe S9 — Paranatação",
    restricoes:
      "Amputação transtibial direita. Usar prótese esportiva apenas para saída de bloco. Evitar carga axial completa em treino seco.",
    metricaLabel: "Pace 100m livre",
    metricaUnidade: "s",
    telemetria: [
      { label: "Sem 1", valor: 78 },
      { label: "Sem 2", valor: 76 },
      { label: "Sem 3", valor: 75 },
      { label: "Sem 4", valor: 74 },
      { label: "Sem 5", valor: 73.5 },
      { label: "Sem 6", valor: 72 },
    ],
  },
  {
    id: "2",
    nome: "João Pereira",
    email: "joao@club.com",
    plano: "Ativo",
    altura: 182,
    peso: 84,
    ultimaAvaliacao: "08/05",
    modalidade: "musculacao",
    metricaLabel: "Carga total agachamento",
    metricaUnidade: "kg",
    telemetria: [
      { label: "Sem 1", valor: 90 },
      { label: "Sem 2", valor: 95 },
      { label: "Sem 3", valor: 100 },
      { label: "Sem 4", valor: 102 },
      { label: "Sem 5", valor: 108 },
      { label: "Sem 6", valor: 112 },
    ],
  },
  {
    id: "3",
    nome: "Ana Lima",
    email: "ana@club.com",
    plano: "Inadimplente",
    altura: 165,
    peso: 58,
    ultimaAvaliacao: "02/04",
    modalidade: "corrida",
    metricaLabel: "Pace médio 5km",
    metricaUnidade: "min/km",
    telemetria: [
      { label: "Sem 1", valor: 5.4 },
      { label: "Sem 2", valor: 5.3 },
      { label: "Sem 3", valor: 5.35 },
      { label: "Sem 4", valor: 5.5 },
      { label: "Sem 5", valor: 5.6 },
      { label: "Sem 6", valor: 5.55 },
    ],
  },
  {
    id: "4",
    nome: "Pedro Alves",
    email: "pedro@club.com",
    plano: "Pausado",
    altura: 178,
    peso: 79,
    ultimaAvaliacao: "20/03",
    modalidade: "futebol",
    metricaLabel: "Presença semanal",
    metricaUnidade: "%",
    telemetria: [
      { label: "Sem 1", valor: 80 },
      { label: "Sem 2", valor: 75 },
      { label: "Sem 3", valor: 60 },
      { label: "Sem 4", valor: 50 },
      { label: "Sem 5", valor: 40 },
      { label: "Sem 6", valor: 30 },
    ],
  },
  {
    id: "5",
    nome: "Clara Mendes",
    email: "clara@club.com",
    plano: "Ativo",
    altura: 170,
    peso: 64,
    ultimaAvaliacao: "15/05",
    modalidade: "tenis",
    metricaLabel: "Aproveitamento de saque",
    metricaUnidade: "%",
    telemetria: [
      { label: "Sem 1", valor: 55 },
      { label: "Sem 2", valor: 58 },
      { label: "Sem 3", valor: 60 },
      { label: "Sem 4", valor: 63 },
      { label: "Sem 5", valor: 66 },
      { label: "Sem 6", valor: 68 },
    ],
  },
  {
    id: "6",
    nome: "Rafael Costa",
    email: "rafa@club.com",
    plano: "Ativo",
    altura: 185,
    peso: 88,
    ultimaAvaliacao: "11/05",
    modalidade: "musculacao",
    metricaLabel: "Volume total semanal",
    metricaUnidade: "t",
    telemetria: [
      { label: "Sem 1", valor: 8 },
      { label: "Sem 2", valor: 9 },
      { label: "Sem 3", valor: 10 },
      { label: "Sem 4", valor: 11 },
      { label: "Sem 5", valor: 12 },
      { label: "Sem 6", valor: 12.5 },
    ],
  },
  {
    id: "7",
    nome: "Beatriz Rocha",
    email: "bia@club.com",
    plano: "Inadimplente",
    altura: 162,
    peso: 55,
    ultimaAvaliacao: "28/03",
    modalidade: "paradesporto",
    classificacao: "Classe T54 — Atletismo cadeirante",
    restricoes:
      "Lesão medular T12. Atenção a transferências e pressão escapular. Hidratação reforçada em ambiente quente.",
    metricaLabel: "Velocidade média propulsão",
    metricaUnidade: "km/h",
    telemetria: [
      { label: "Sem 1", valor: 18 },
      { label: "Sem 2", valor: 19 },
      { label: "Sem 3", valor: 19.5 },
      { label: "Sem 4", valor: 20 },
      { label: "Sem 5", valor: 20.5 },
      { label: "Sem 6", valor: 21 },
    ],
  },
  {
    id: "8",
    nome: "Lucas Martins",
    email: "lucas@club.com",
    plano: "Ativo",
    altura: 176,
    peso: 75,
    ultimaAvaliacao: "13/05",
    modalidade: "corrida",
    metricaLabel: "VO2 estimado",
    metricaUnidade: "ml/kg/min",
    telemetria: [
      { label: "Sem 1", valor: 48 },
      { label: "Sem 2", valor: 49 },
      { label: "Sem 3", valor: 50 },
      { label: "Sem 4", valor: 51 },
      { label: "Sem 5", valor: 52 },
      { label: "Sem 6", valor: 53 },
    ],
  },
];

export const SPORT_LABEL: Record<Sport, string> = {
  musculacao: "Musculação / Crossfit",
  natacao: "Natação",
  corrida: "Corrida / Atletismo",
  futebol: "Futebol",
  tenis: "Tênis",
  paradesporto: "Paradesporto",
};

export function getAthlete(id: string): Athlete | undefined {
  return ATHLETES.find((a) => a.id === id);
}
