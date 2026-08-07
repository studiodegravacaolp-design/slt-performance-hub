export interface Athlete {
  id: string;
  nome: string;
  dataNascimento: string | null;
  userId: string | null;
}

export interface AthleteRow {
  id: string;
  full_name: string;
  birth_date: string | null;
  user_id: string | null;
}

export function rowToAthlete(row: AthleteRow): Athlete {
  return {
    id: row.id,
    nome: row.full_name,
    dataNascimento: row.birth_date,
    userId: row.user_id,
  };
}
