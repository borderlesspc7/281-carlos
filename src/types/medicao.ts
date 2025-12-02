export interface Medicao {
  id: string;
  obraId: string;
  numero: string;
  data: string;
  fornecedorId: string;
  contratoId: string;
  aditivosIds: string[];
  vagaoId: string;
  itemsIds: string[];
  unidades: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicaoData {
  numero: string;
  data: string;
  fornecedorId: string;
  contratoId: string;
  aditivosIds: string[];
  vagaoId: string;
  itemsIds: string[];
  unidades: string[];
}

export interface MedicaoDraft {
  numero: string;
  data: string;
  fornecedorId: string;
  contratoId: string;
  aditivosIds: string[];
  vagaoId: string;
  itemsIds: string[];
  unidades: string[];
}

