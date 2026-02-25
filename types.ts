
export interface CardData {
  id: string;
  name: string;
  rm: string;
  numero: string;
  nascimento: string;
  serie: string;
  cpf: string;
  email: string;
  senha: string;
  photoUrl?: string;
  [key: string]: string | undefined;
}

export interface CSVRow {
  [key: string]: string;
}
