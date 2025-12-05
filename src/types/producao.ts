export interface Producao {
  id: string;
  obraId: string;
  vagaoId: string;
  unidades: string[]; // Array de unidades produzidas
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProducaoData {
  vagaoId: string;
  unidades: string[];
}

