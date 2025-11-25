export interface ProducaoFaltante {
  id: string;
  obraId: string;
  kitId: string;
  quantidade: number; // quantidade de apartamentos faltantes
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProducaoFaltanteData {
  kitId: string;
  quantidade: number;
}

export interface UpdateProducaoFaltanteData {
  quantidade?: number;
}

